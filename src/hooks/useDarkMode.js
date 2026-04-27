import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [autoDarkMode, setAutoDarkMode] = useState(false)

  useEffect(() => {
    // Vérifier l'heure actuelle
    const checkTime = () => {
      const now = new Date()
      const hour = now.getHours()

      // Mode nuit automatique après 20h (8pm) jusqu'à 7h (7am)
      const shouldEnableDarkMode = hour >= 20 || hour < 7

      if (shouldEnableDarkMode && !autoDarkMode) {
        setAutoDarkMode(true)
        setIsDarkMode(true)
        document.documentElement.setAttribute('data-theme', 'dark')
      } else if (!shouldEnableDarkMode && autoDarkMode) {
        setAutoDarkMode(false)
        setIsDarkMode(false)
        document.documentElement.removeAttribute('data-theme')
      }
    }

    // Vérifier immédiatement
    checkTime()

    // Vérifier chaque minute
    const interval = setInterval(checkTime, 60000)

    return () => clearInterval(interval)
  }, [autoDarkMode])

  return { isDarkMode, autoDarkMode, setIsDarkMode }
}
