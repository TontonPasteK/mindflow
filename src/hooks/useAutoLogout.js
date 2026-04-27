import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 minutes en millisecondes

export function useAutoLogout() {
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [timeUntilLogout, setTimeUntilLogout] = useState(null)
  const [showWarning, setShowWarning] = useState(false)
  const navigate = useNavigate()

  // Réinitialiser le timer d'activité
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now())
    setShowWarning(false)
  }, [])

  useEffect(() => {
    // Écouter les événements d'activité utilisateur
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      resetActivity()
    }

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [resetActivity])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const inactiveTime = now - lastActivity
      const remainingTime = INACTIVITY_LIMIT - inactiveTime

      // Afficher un avertissement 2 minutes avant la déconnexion
      if (remainingTime <= 2 * 60 * 1000 && remainingTime > 0 && !showWarning) {
        setShowWarning(true)
      }

      // Mettre à jour le temps restant
      if (remainingTime > 0) {
        setTimeUntilLogout(Math.ceil(remainingTime / 1000))
      } else {
        // Déconnexion automatique
        handleAutoLogout()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastActivity, showWarning])

  const handleAutoLogout = async () => {
    try {
      // Nettoyer le localStorage
      localStorage.clear()
      sessionStorage.clear()

      // Déconnexion Supabase
      await supabase.auth.signOut()

      // Redirection vers la page d'accueil
      window.location.replace('/auth')
    } catch (err) {
      console.error('Erreur auto logout:', err)
      // En cas d'erreur, forcer la redirection
      window.location.replace('/auth')
    }
  }

  const stayLoggedIn = () => {
    resetActivity()
  }

  return {
    timeUntilLogout,
    showWarning,
    stayLoggedIn,
    resetActivity
  }
}
