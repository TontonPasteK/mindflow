import { useState, useCallback, useRef, useEffect } from 'react'

const SILENCE_DELAY = 2500  // ms de silence avant envoi automatique

export function useVoice({ onTranscript, onEnd } = {}) {
  const [isListening, setIsListening]             = useState(false)
  const [isSupported]                             = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [permissionAsked, setPermissionAsked]     = useState(false)
  const [interimText, setInterimText]             = useState('')

  const recognitionRef  = useRef(null)
  const silenceTimer    = useRef(null)
  const finalTranscript = useRef('')

  const requestPermission = useCallback(async () => {
    if (permissionAsked) return permissionGranted
    setPermissionAsked(true)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionGranted(true)
      return true
    } catch {
      setPermissionGranted(false)
      return false
    }
  }, [permissionAsked, permissionGranted])

  // Annule le timer de silence en cours
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
  }, [])

  // Ref so commitTranscript always calls the latest onTranscript without stale closure
  const onTranscriptRef = useRef(onTranscript)
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])

  // Envoie le transcript final et arrête
  const commitTranscript = useCallback(() => {
    clearSilenceTimer()
    const text = finalTranscript.current.trim()
    finalTranscript.current = ''
    setInterimText('')

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    if (text && onTranscriptRef.current) onTranscriptRef.current(text)
  }, [clearSilenceTimer])

  const startListening = useCallback(() => {
    if (!isSupported || isListening || !permissionGranted) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()

    recognition.lang            = 'fr-FR'
    recognition.continuous      = true   // ne coupe pas après une pause
    recognition.interimResults  = true   // reçoit les résultats partiels en temps réel

    finalTranscript.current = ''
    setInterimText('')

    recognition.onresult = (event) => {
      let interim = ''
      let final   = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        finalTranscript.current += ' ' + final
      }

      // Affiche le texte courant (final accumulé + interim en cours)
      setInterimText((finalTranscript.current + ' ' + interim).trim())

      // Repart le timer de silence à chaque mot détecté
      clearSilenceTimer()
      silenceTimer.current = setTimeout(commitTranscript, SILENCE_DELAY)
    }

    recognition.onend = () => {
      // Ignore stale callbacks from a previous recognition instance
      if (recognitionRef.current !== recognition) return
      setIsListening(false)
      setInterimText('')
      clearSilenceTimer()
      if (onEnd) onEnd()
    }

    recognition.onerror = (event) => {
      // Ignore stale callbacks from a previous recognition instance
      if (recognitionRef.current !== recognition) return
      // 'no-speech' est normal, on ignore silencieusement
      if (event.error !== 'no-speech') {
        console.warn('[useVoice] error:', event.error)
      }
      setIsListening(false)
      clearSilenceTimer()
    }

    recognitionRef.current = recognition
    setIsListening(true)
    try {
      recognition.start()
    } catch (err) {
      console.warn('[useVoice] recognition.start() failed:', err.message)
      recognitionRef.current = null
      setIsListening(false)
    }
  }, [isSupported, isListening, permissionGranted, clearSilenceTimer, commitTranscript, onEnd])

  const stopListening = useCallback(() => {
    clearSilenceTimer()
    finalTranscript.current = ''
    setInterimText('')
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [clearSilenceTimer])

  // Stop immédiatement à la déconnexion (même pattern que useTTS)
  useEffect(() => {
    const handler = () => stopListening()
    window.addEventListener('mindflow:logout', handler)
    return () => window.removeEventListener('mindflow:logout', handler)
  }, [stopListening])

  return {
    isListening,
    isSupported,
    permissionGranted,
    interimText,       // texte en cours de dictée (pour affichage live)
    requestPermission,
    startListening,
    stopListening,
  }
}
