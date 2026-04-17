import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase envoie le token dans le hash de l'URL
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            if (!error) setReady(true)
            else setError('Lien invalide ou expiré. Recommence la procédure.')
          })
      }
    } else {
      // Fallback : écoute l'événement PASSWORD_RECOVERY
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true)
      })
      return () => subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (password.length < 8) {
      setError('Au moins 8 caractères')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => navigate('/auth?mode=login'), 2500)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', animation: 'fade-up 0.4s ease' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'var(--accent)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 06.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"
                fill="#080D0A"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '24px', marginBottom: '6px' }}>
            Nouveau mot de passe
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            Choisis un mot de passe sécurisé
          </p>
        </div>

        {!ready && !done && !error && (
          <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '14px' }}>
            Vérification du lien en cours...
          </p>
        )}

        {error && !done && (
          <p style={{
            fontSize: '13px', color: 'var(--error)',
            padding: '10px 14px',
            background: 'var(--error-dim)',
            borderRadius: 'var(--r-sm)',
            textAlign: 'center',
          }}>{error}</p>
        )}

        {ready && !done && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Au moins 8 caractères"
              autoFocus
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError('') }}
              placeholder="••••••••"
            />
            {error && (
              <p style={{
                fontSize: '13px', color: 'var(--error)',
                padding: '10px 14px',
                background: 'var(--error-dim)',
                borderRadius: 'var(--r-sm)',
                margin: 0,
              }}>{error}</p>
            )}
            <Button onClick={handleSubmit} loading={loading} fullWidth size="lg">
              Enregistrer
            </Button>
          </div>
        )}

        {done && (
          <p style={{
            fontSize: '14px', color: 'var(--accent)',
            padding: '14px', textAlign: 'center',
            background: 'rgba(29,158,117,0.1)',
            border: '1px solid rgba(29,158,117,0.25)',
            borderRadius: 'var(--r-sm)',
          }}>
            ✅ Mot de passe mis à jour ! Redirection...
          </p>
        )}
      </div>
    </div>
  )
}