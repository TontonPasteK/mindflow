// Générateur de sons d'entrée pour les avatars
// Utilise l'API Web Audio pour créer des sons distincts sans fichiers externes

export function playAvatarSound(avatarName) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  const sounds = {
    Max: { frequency: 440, type: 'sine', duration: 0.3 },
    Victor: { frequency: 523.25, type: 'triangle', duration: 0.4 },
    Léo: { frequency: 392, type: 'square', duration: 0.25 },
    Maya: { frequency: 466.16, type: 'sine', duration: 0.35 },
    Noa: { frequency: 587.33, type: 'sawtooth', duration: 0.3 },
    Sam: { frequency: 349.23, type: 'triangle', duration: 0.4 },
    Alex: { frequency: 523.25, type: 'sine', duration: 0.3 },
  }

  const sound = sounds[avatarName] || sounds.Maya

  oscillator.type = sound.type
  oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime)

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + sound.duration)
}
