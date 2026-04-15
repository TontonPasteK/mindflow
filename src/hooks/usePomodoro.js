import { useState, useEffect, useCallback, useRef } from 'react'

const WORK_DURATION  = 20 * 60  // 20 minutes in seconds
const BREAK_DURATION = 5 * 60   // 5 minutes in seconds

export function usePomodoro() {
  const [phase, setPhase]       = useState('work')   // 'work' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(WORK_DURATION)
  const [isRunning, setIsRunning]     = useState(false)
  const [cycles, setCycles]     = useState(0)
  const intervalRef = useRef(null)

  const tick = useCallback(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        // Phase over
        setPhase(p => {
          if (p === 'work') {
            setCycles(c => c + 1)
            setSecondsLeft(BREAK_DURATION)
            return 'break'
          } else {
            setSecondsLeft(WORK_DURATION)
            return 'work'
          }
        })
        return prev  // will be overridden by setSecondsLeft above
      }
      return prev - 1
    })
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, tick])

  const start  = useCallback(() => setIsRunning(true), [])
  const pause  = useCallback(() => setIsRunning(false), [])
  const reset  = useCallback(() => {
    setIsRunning(false)
    setPhase('work')
    setSecondsLeft(WORK_DURATION)
  }, [])
  const toggle = useCallback(() => setIsRunning(r => !r), [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const display = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
  const progress = phase === 'work'
    ? (WORK_DURATION - secondsLeft) / WORK_DURATION
    : (BREAK_DURATION - secondsLeft) / BREAK_DURATION

  return { phase, display, progress, isRunning, cycles, start, pause, reset, toggle }
}
