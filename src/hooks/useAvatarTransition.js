import { useEffect, useRef } from 'react'
import { playAvatarSound } from '../utils/avatarSounds'

const AVATAR_COLORS = {
  Max: 'rgba(138, 43, 226, 0.1)',
  Victor: 'rgba(255, 140, 0, 0.1)',
  Léo: 'rgba(34, 197, 94, 0.1)',
  Maya: 'rgba(20, 184, 166, 0.1)',
  Noa: 'rgba(234, 179, 8, 0.1)',
  Sam: 'rgba(239, 68, 68, 0.1)',
  Alex: 'rgba(59, 130, 246, 0.1)',
}

export function useAvatarTransition(avatarName, transitioning) {
  const previousAvatarRef = useRef(null)

  useEffect(() => {
    if (transitioning && avatarName && avatarName !== previousAvatarRef.current) {
      previousAvatarRef.current = avatarName
      playAvatarSound(avatarName)
    }
  }, [transitioning, avatarName])

  const getAvatarColor = () => AVATAR_COLORS[avatarName] || 'rgba(20, 184, 166, 0.1)'

  return { getAvatarColor }
}
