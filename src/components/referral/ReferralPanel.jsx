import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getReferralCode, createReferralCode, getReferralStats } from '../../services/referral'

export default function ReferralPanel() {
  const { user } = useAuth()
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats] = useState({ referrals: 0, totalBonus: 0 })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadReferralData()
  }, [user])

  const loadReferralData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Essayer de récupérer le code existant
      let code = await getReferralCode(user.id)

      // Si pas de code, en créer un
      if (!code) {
        const result = await createReferralCode(user.id)
        code = result.code
      }

      setReferralCode(code)

      // Récupérer les statistiques
      const referralStats = await getReferralStats(user.id)
      setStats(referralStats)
    } catch (error) {
      console.error('Erreur chargement données parrainage:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareCode = () => {
    if (referralCode) {
      const shareText = `Rejoins Evokia avec mon code de parrainage : ${referralCode} !`
      if (navigator.share) {
        navigator.share({
          title: 'Code de parrainage Evokia',
          text: shareText
        })
      } else {
        // Fallback : copier dans le presse-papier
        navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  if (loading) {
    return (
      <div style={{
        padding: '16px 20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        textAlign: 'center',
        color: 'var(--text-3)',
      }}>
        Chargement...
      </div>
    )
  }

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, rgba(29,158,117,0.1) 0%, rgba(29,158,117,0.05) 100%)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '24px' }}>🎁</span>
        <h3 style={{
          fontFamily: 'var(--f-title)',
          fontSize: '16px',
          margin: 0,
          color: 'var(--accent)',
        }}>
          Programme de parrainage
        </h3>
      </div>

      {/* Code de parrainage */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '8px' }}>
          Ton code de parrainage :
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1,
            padding: '12px 16px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--accent)',
            letterSpacing: '1px',
            textAlign: 'center',
          }}>
            {referralCode}
          </div>
          <button
            onClick={handleCopyCode}
            style={{
              padding: '12px 16px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: '#080D0A',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copié' : '📋 Copier'}
          </button>
        </div>
      </div>

      {/* Bouton partager */}
      <button
        onClick={handleShareCode}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--accent)',
          borderRadius: '8px',
          color: 'var(--accent)',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        📤 Partager le code
      </button>

      {/* Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        padding: '16px',
        background: 'var(--bg-card)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)' }}>
            {stats.referrals}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
            Parrainages
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)' }}>
            {stats.totalBonus}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
            Points gagnés
          </div>
        </div>
      </div>

      {/* Informations bonus */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(29,158,117,0.05)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'var(--text-2)',
        lineHeight: '1.5',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--accent)' }}>
          🎯 Comment ça marche ?
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Partage ton code avec tes amis</li>
          <li>Ils gagnent <strong>50 points</strong> en s'inscrivant</li>
          <li>Tu gagnes <strong>100 points</strong> par parrainage</li>
        </ul>
      </div>
    </div>
  )
}
