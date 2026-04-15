import { useState, useCallback, useRef, useEffect } from 'react'

export function useTTS({ enabled = true, onPlayStart } = {}) {
  const [isSpeaking, setIsSpeaking]   = useState(false)
  const audioRef                       = useRef(null)
  const queueRef                       = useRef([])
  const playingRef                     = useRef(false)
  const onPlayStartRef                 = useRef(onPlayStart)
  onPlayStartRef.current               = onPlayStart

  const playNext = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return
    playingRef.current = true
    const { text, messageId } = queueRef.current.shift()

    setIsSpeaking(true)

    let openaiOk = false
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `TTS ${response.status}`)
      }

      // ── Streaming via MediaSource (Chrome/Edge) ─────────────────────────────
      const canStream = 'MediaSource' in window && MediaSource.isTypeSupported('audio/mpeg')

      if (canStream) {
        await playViaMediaSource(
          response,
          messageId,
          onPlayStartRef,
          setIsSpeaking,
          playingRef,
          () => { playingRef.current = false; playNext() },
          audioRef,
        )
        openaiOk = true
      } else {
        // ── Fallback: full buffer + Web Audio API ──────────────────────────────
        const arrayBuffer = await response.arrayBuffer()
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        if (audioCtx.state === 'suspended') await audioCtx.resume()
        if (audioCtx.state !== 'running') {
          audioCtx.close()
          throw new Error('AudioContext not running')
        }
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        const source = audioCtx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioCtx.destination)
        source.onended = () => {
          setIsSpeaking(false)
          playingRef.current = false
          audioCtx.close()
          playNext()
        }
        if (onPlayStartRef.current) onPlayStartRef.current(messageId)
        source.start()
        audioRef.current = source
        openaiOk = true
      }
    } catch (err) {
      console.warn('[TTS] erreur:', err.message)
    }

    if (openaiOk) return

    // ── Fallback : SpeechSynthesis navigateur ────────────────────────────────
    if (!window.speechSynthesis) {
      setIsSpeaking(false)
      playingRef.current = false
      playNext()
      return
    }
    const utterance  = new SpeechSynthesisUtterance(text)
    utterance.lang   = 'fr-FR'
    const frVoice    = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('fr'))
    if (frVoice) utterance.voice = frVoice
    utterance.onstart = () => { if (onPlayStartRef.current) onPlayStartRef.current(messageId) }
    utterance.onend   = () => { setIsSpeaking(false); playingRef.current = false; playNext() }
    utterance.onerror = () => { setIsSpeaking(false); playingRef.current = false; playNext() }
    window.speechSynthesis.speak(utterance)
  }, [])

  const speak = useCallback((text, messageId) => {
    if (!enabled || !text) return
    const clean = text.replace(/\[\[.*?\]\]/g, '').trim()
    if (!clean) return
    queueRef.current.push({ text: clean, messageId })
    playNext()
  }, [enabled, playNext])

  const stop = useCallback(() => {
    if (audioRef.current) {
      try {
        if (typeof audioRef.current.stop === 'function') audioRef.current.stop()
        else if (typeof audioRef.current.pause === 'function') audioRef.current.pause()
      } catch {}
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    queueRef.current   = []
    playingRef.current = false
    setIsSpeaking(false)
  }, [])

  // Stop immédiatement à la déconnexion (événement global émis par AppNav/Settings)
  useEffect(() => {
    const handler = () => stop()
    window.addEventListener('mindflow:logout', handler)
    return () => window.removeEventListener('mindflow:logout', handler)
  }, [stop])

  return { isSpeaking, speak, stop }
}

// ─── MediaSource streaming playback ────────────────────────────────────────────
function playViaMediaSource(response, messageId, onPlayStartRef, setIsSpeaking, playingRef, onDone, audioRef) {
  return new Promise((resolve, reject) => {
    const ms  = new MediaSource()
    const audio = new Audio()
    const url = URL.createObjectURL(ms)
    audio.src = url
    audioRef.current = audio

    let settled = false
    const settle = (err) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      if (err) reject(err)
      else resolve()
    }

    ms.addEventListener('sourceopen', async () => {
      let sb
      try { sb = ms.addSourceBuffer('audio/mpeg') }
      catch (e) { settle(e); return }

      const chunks    = []
      let appending   = false
      let streamDone  = false
      let playStarted = false

      function appendNext() {
        if (appending || chunks.length === 0) return
        appending = true
        sb.appendBuffer(chunks.shift())
      }

      function tryPlay() {
        if (!playStarted && audio.readyState >= 2) {
          playStarted = true
          audio.play()
            .then(() => { if (onPlayStartRef.current) onPlayStartRef.current(messageId) })
            .catch((err) => settle(err))
        }
      }

      sb.addEventListener('updateend', () => {
        appending = false
        tryPlay()
        if (chunks.length > 0) {
          appendNext()
        } else if (streamDone) {
          try { ms.endOfStream() } catch {}
        }
      })

      audio.addEventListener('canplay', tryPlay)

      audio.addEventListener('ended', () => {
        setIsSpeaking(false)
        onDone()
        settle()
      })

      audio.addEventListener('error', () => settle(new Error('Audio playback error')))

      // Stream chunks from fetch response
      const reader = response.body.getReader()
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) {
            streamDone = true
            if (!appending && chunks.length === 0) {
              try { ms.endOfStream() } catch {}
            }
            break
          }
          chunks.push(value)
          appendNext()
        }
      } catch (e) {
        settle(e)
      }
    })
  })
}
