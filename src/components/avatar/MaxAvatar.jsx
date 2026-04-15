import { useId } from 'react'
import SoundWaves from './SoundWaves'

/**
 * Minimal geometric avatar — Linear / Figma inspired
 *
 * Props:
 *   isSpeaking  boolean  — intensifies glow + ring
 *   size        number   — diameter in px (default 160)
 *   profile     string   — kept for API compat, unused visually
 */
export default function MaxAvatar({ isSpeaking = false, size = 160, profile = null }) {
  const uid = useId()
  const gradId    = `${uid}-fill`
  const gradBrId  = `${uid}-fill-bright`
  const maskId    = `${uid}-mask`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>

      {/* Breathing outer wrapper */}
      <div style={{
        position: 'relative',
        width: size,
        height: size,
        animation: 'breathe 4s ease-in-out infinite',
      }}>

        {/* Ambient glow halo — always present, intensifies when speaking */}
        <div style={{
          position: 'absolute',
          inset:  isSpeaking ? '-22px' : '-12px',
          borderRadius: '50%',
          background: isSpeaking
            ? 'radial-gradient(circle, rgba(29,158,117,0.48) 0%, transparent 62%)'
            : 'radial-gradient(circle, rgba(29,158,117,0.18) 0%, transparent 58%)',
          animation: 'avatar-glow-pulse 3.2s ease-in-out infinite',
          transition: 'inset 0.55s ease, background 0.55s ease',
          pointerEvents: 'none',
        }} />

        {/* Pulsing border ring */}
        <div style={{
          position: 'absolute',
          inset: '-2px',
          borderRadius: '50%',
          border: `1.5px solid ${isSpeaking ? 'rgba(29,158,117,0.88)' : 'rgba(29,158,117,0.28)'}`,
          animation: 'avatar-ring-pulse 3.2s ease-in-out infinite',
          transition: 'border-color 0.4s ease',
          pointerEvents: 'none',
        }} />

        {/* Avatar circle */}
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(155deg, #0E2018 0%, #060D0A 100%)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 36px rgba(0,0,0,0.65), inset 0 1px 0 rgba(29,158,117,0.07)',
        }}>

          <svg
            width={size * 0.76}
            height={size * 0.76}
            viewBox="0 0 100 106"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Main gradient: top → bottom */}
              <linearGradient id={gradId} x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%"   stopColor="#1D9E75" />
                <stop offset="100%" stopColor="#0D5C45" />
              </linearGradient>
              {/* Slightly brighter for inner highlights */}
              <linearGradient id={gradBrId} x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%"   stopColor="#22B888" />
                <stop offset="100%" stopColor="#10714F" />
              </linearGradient>
              {/* Clip mask so shoulders don't overflow viewBox */}
              <clipPath id={maskId}>
                <rect x="0" y="0" width="100" height="106" />
              </clipPath>
            </defs>

            <g clipPath={`url(#${maskId})`}>

              {/* ── Shoulders / body ───────────────────────────── */}
              <path
                d="M 0 106
                   C 0 80 8 68 22 64
                   C 32 61 42 59 50 58
                   C 58 59 68 61 78 64
                   C 92 68 100 80 100 106
                   Z"
                fill={`url(#${gradId})`}
              />

              {/* ── Neck ───────────────────────────────────────── */}
              <rect x="44" y="50" width="12" height="11" rx="4"
                fill={`url(#${gradId})`} />

              {/* ── Head ───────────────────────────────────────── */}
              <circle cx="50" cy="31" r="21" fill={`url(#${gradId})`} />

              {/* Subtle top-left specular catch */}
              <ellipse cx="42" cy="22" rx="8" ry="5"
                fill="rgba(255,255,255,0.06)" />

              {/* ── Eyes — suggested, not drawn ────────────────── */}
              {/* Soft shadow sockets */}
              <ellipse cx="42.5" cy="30.5" rx="4.5" ry="2.8"
                fill="rgba(6,16,10,0.38)" />
              <ellipse cx="57.5" cy="30.5" rx="4.5" ry="2.8"
                fill="rgba(6,16,10,0.38)" />
              {/* Tiny iris catch-light */}
              <circle cx="43.8" cy="29.4" r="1.3"
                fill="rgba(34,184,136,0.55)" />
              <circle cx="58.8" cy="29.4" r="1.3"
                fill="rgba(34,184,136,0.55)" />

            </g>
          </svg>
        </div>
      </div>

      <SoundWaves active={isSpeaking} />
    </div>
  )
}
