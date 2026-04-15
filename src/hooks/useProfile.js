import { useAuth } from '../context/AuthContext'

export function useProfile() {
  const { profile, isPremium } = useAuth()

  const dominant = () => {
    if (!profile) return 'unknown'
    const { visuel = 0, auditif = 0, kinesthesique = 0 } = profile
    const max = Math.max(visuel, auditif, kinesthesique)
    if (max === visuel) return 'visuel'
    if (max === auditif) return 'auditif'
    return 'kinesthesique'
  }

  // Assign character based on profile (future roadmap)
  const assignedCharacter = () => {
    if (!profile?.onboarding_complete) return 'max'
    const { visuel = 0, auditif = 0, kinesthesique = 0 } = profile
    const max = Math.max(visuel, auditif, kinesthesique)
    const diff = sorted => sorted[0] - sorted[1]
    const sorted = [visuel, auditif, kinesthesique].sort((a, b) => b - a)

    if (diff(sorted) > 30) {
      // Strong dominant
      if (max === auditif)      return 'victor'
      if (max === kinesthesique) return 'leo'
      return 'max'  // visuel dominant → Max
    }
    // Mixed profiles
    if (visuel > 30 && auditif > 30)       return 'maya'
    if (visuel > 30 && kinesthesique > 30)  return 'noa'
    if (auditif > 30 && kinesthesique > 30) return 'sam'
    return 'alex'
  }

  return {
    profile,
    isPremium,
    dominant: dominant(),
    assignedCharacter: assignedCharacter(),
    isOnboardingComplete: profile?.onboarding_complete ?? false,
  }
}
