import { createContext, useContext, useState, useCallback } from 'react'
import { createSession, endSession, saveMessage } from '../services/supabase'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [sessionId, setSessionId]         = useState(null)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [exchangeCount, setExchangeCount]   = useState(0)
  const [detectedMatieres, setDetectedMatieres] = useState([])
  const [sessionStartTime, setSessionStartTime] = useState(null)

  const startSession = useCallback(async (userId, plan) => {
    const session = await createSession(userId, plan)
    setSessionId(session.id)
    setSessionStarted(true)
    setExchangeCount(0)
    setDetectedMatieres([])
    setSessionStartTime(Date.now())
    return session.id
  }, [])

  const addExchange = useCallback(() => {
    setExchangeCount(prev => prev + 1)
  }, [])

  const addMatiere = useCallback((matiere) => {
    setDetectedMatieres(prev => {
      if (prev.includes(matiere)) return prev
      return [...prev, matiere]
    })
  }, [])

  const closeSession = useCallback(async ({ resume } = {}) => {
    if (!sessionId || !sessionStartTime) return
    const dureeMinutes = Math.round((Date.now() - sessionStartTime) / 60000)
    await endSession(sessionId, {
      dureeMinutes,
      matieres: detectedMatieres,
      resume: resume || null,
    })
    setSessionId(null)
    setSessionStarted(false)
    setExchangeCount(0)
    setDetectedMatieres([])
    setSessionStartTime(null)
  }, [sessionId, sessionStartTime, detectedMatieres])

  const persistMessage = useCallback(async (role, content) => {
    if (!sessionId) return
    await saveMessage(sessionId, role, content)
  }, [sessionId])

  const value = {
    sessionId,
    sessionStarted,
    exchangeCount,
    detectedMatieres,
    startSession,
    addExchange,
    addMatiere,
    closeSession,
    persistMessage,
    showUpgradeBanner: exchangeCount >= 3,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
