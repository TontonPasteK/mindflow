import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { signUp, signIn, signInWithCode, supabase } from '../services/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Auth() {
  const [params] = useSearchParams()
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [form, setForm] = useState({ prenom: '', email: '', password: '', niveau: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [acceptedCGU, setAcceptedCGU] = useState(false)
  // BLOC 10 — connexion par code élève
  const [codeMode, setCodeMode] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const navigate = useNavigate()

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      setErrors(er => ({ ...er, email: 'Entre ton email pour recevoir le lien' }))
      return
    }
    setResetLoading(true)
    setGlobalError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setResetSent(true)
    } catch (err) {
      setGlobalError(err.message || 'Impossible d\'envoyer l\'email de réinitialisation')
    } finally {
      setResetLoading(false)
    }
  }

  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
    setGlobalError('')
  }

  const validate = () => {
    const errs = {}
    if (mode === 'signup' && !form.prenom.trim()) errs.prenom = 'Ton prénom est requis'
    if (mode === 'signup' && !form.niveau)        errs.niveau = 'Choisis ton niveau'
    if (!form.email.trim())    errs.email    = 'L\'email est requis'
    if (!form.password)        errs.password = 'Le mot de passe est requis'
    if (mode === 'signup' && form.password.length < 8)
      errs.password = 'Au moins 8 caractères'
    if (mode === 'signup' && !acceptedCGU)
      errs.cgu = 'Tu dois accepter les CGU pour continuer'
    return errs
  }

  // BLOC 10 — connexion par code
  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    if (!accessCode.trim()) { setGlobalError('Entre ton code d\'accès'); return }
    setLoading(true)
    setGlobalError('')
    try {
      await signInWithCode(accessCode.trim())
      navigate('/session')
    } catch (err) {
      setGlobalError(err.message || 'Code invalide')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setGlobalError('')
    try {
      if (mode === 'signup') {
        await signUp({ email: form.email, password: form.password, prenom: form.prenom, niveau: form.niveau })
        navigate('/choice')
      } else {
        await signIn({ email: form.email, password: form.password })
        navigate('/choice')
      }
    } catch (err) {
      setGlobalError(
        err.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : err.message || 'Une erreur est survenue'
      )
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
      <div style={{
        width: '100%',
        maxWidth: '400px',
        animation: 'fade-up 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'var(--accent)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"
                fill="#080D0A"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '24px', marginBottom: '6px' }}>
            {codeMode ? 'Espace élève' : mode === 'signup' ? 'Crée ton compte' : 'Bon retour !'}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            {codeMode
              ? 'Entre ton code donné par un parent'
              : mode === 'signup'
              ? 'Gratuit pour commencer'
              : 'Connecte-toi à ton espace Evokia'}
          </p>
        </div>

        {/* BLOC 10 — Onglets parent / élève */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => { setCodeMode(false); setGlobalError('') }}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
              background: !codeMode ? 'var(--accent-dim)' : 'var(--bg-card)',
              color: !codeMode ? 'var(--accent)' : 'var(--text-3)',
              fontWeight: !codeMode ? '600' : '400', fontSize: '13px',
            }}
          >Compte parent / adulte</button>
          <button
            type="button"
            onClick={() => { setCodeMode(true); setGlobalError('') }}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
              borderLeft: '1px solid var(--border)',
              background: codeMode ? 'var(--accent-dim)' : 'var(--bg-card)',
              color: codeMode ? 'var(--accent)' : 'var(--text-3)',
              fontWeight: codeMode ? '600' : '400', fontSize: '13px',
            }}
          >Code élève</button>
        </div>

        {/* BLOC 10 — Formulaire code élève */}
        {codeMode && (
          <form onSubmit={handleCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Code d'accès (6 caractères)"
              value={accessCode}
              onChange={e => { setAccessCode(e.target.value.toUpperCase()); setGlobalError('') }}
              placeholder="ABC123"
              required
              autoFocus
            />
            {globalError && (
              <p style={{ fontSize: '13px', color: 'var(--error)', padding: '10px 14px', background: 'var(--error-dim)', borderRadius: 'var(--r-sm)', margin: 0 }}>
                {globalError}
              </p>
            )}
            <Button type="submit" loading={loading} fullWidth size="lg">
              Accéder à ma session
            </Button>
          </form>
        )}

        {/* Form parent/adulte */}
        {!codeMode && <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'signup' && (
            <>
              <Input
                label="Ton prénom"
                value={form.prenom}
                onChange={update('prenom')}
                placeholder="Lucas"
                error={errors.prenom}
                required
                autoFocus
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{
                  fontSize: '13px', fontWeight: '500',
                  color: errors.niveau ? 'var(--error)' : 'var(--text-2)',
                }}>
                  Niveau scolaire <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <select
                  value={form.niveau}
                  onChange={update('niveau')}
                  required
                  style={{
                    background: 'var(--bg-input)',
                    border: `1px solid ${errors.niveau ? 'var(--error)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)',
                    color: form.niveau ? 'var(--text)' : 'var(--text-3)',
                    padding: '13px 16px',
                    fontSize: '15px',
                    width: '100%',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23DFF0E8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                  }}
                >
                  <option value="" disabled>Choisis ton niveau</option>
                  {NIVEAUX.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {errors.niveau && (
                  <p style={{ fontSize: '12px', color: 'var(--error)', margin: 0 }}>{errors.niveau}</p>
                )}
              </div>
            </>
          )}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="ton@email.fr"
            error={errors.email}
            required
            autoComplete="email"
            autoFocus={mode === 'login'}
          />
          <div>
            <Input
              label="Mot de passe"
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder={mode === 'signup' ? 'Au moins 8 caractères' : '••••••••'}
              error={errors.password}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              hint={mode === 'signup' ? 'Minimum 8 caractères' : undefined}
            />
            {mode === 'login' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-3)', fontSize: '12px',
                  cursor: 'pointer', padding: '6px 0 0',
                  display: 'block',
                }}
              >
                {resetLoading ? 'Envoi...' : 'Mot de passe oublié ?'}
              </button>
            )}
          </div>

          {resetSent && (
            <p style={{
              fontSize: '13px',
              color: 'var(--accent)',
              padding: '10px 14px',
              background: 'rgba(29,158,117,0.1)',
              border: '1px solid rgba(29,158,117,0.25)',
              borderRadius: 'var(--r-sm)',
              margin: 0,
            }}>
              Email envoyé ! Vérifie ta boîte mail pour réinitialiser ton mot de passe.
            </p>
          )}

          {globalError && (
            <p style={{
              fontSize: '13px',
              color: 'var(--error)',
              padding: '10px 14px',
              background: 'var(--error-dim)',
              borderRadius: 'var(--r-sm)',
              margin: 0,
            }}>{globalError}</p>
          )}

          {/* BLOC 12 — Case CGU (inscription uniquement) */}
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5' }}>
                <input
                  type="checkbox"
                  checked={acceptedCGU}
                  onChange={e => { setAcceptedCGU(e.target.checked); setErrors(er => ({ ...er, cgu: '' })) }}
                  style={{ marginTop: '2px', accentColor: 'var(--accent)', flexShrink: 0 }}
                />
                <span>
                  J'accepte les{' '}
                  <Link to="/legal" target="_blank" style={{ color: 'var(--accent)' }}>CGU et la politique de confidentialité</Link>
                  {' '}(données des mineurs protégées, RGPD)
                </span>
              </label>
              {errors.cgu && <p style={{ fontSize: '12px', color: 'var(--error)', margin: '4px 0 0' }}>{errors.cgu}</p>}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg" style={{ marginTop: '4px' }}>
            {mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </Button>
        </form>}

        {/* Toggle mode */}
        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '14px',
          color: 'var(--text-2)',
        }}>
          {mode === 'signup' ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button
            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setGlobalError('') }}
            style={{
              background: 'none', border: 'none',
              color: 'var(--accent)', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600',
            }}
          >
            {mode === 'signup' ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: '12px' }}>
          <Link to="/" style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  )
}

const NIVEAUX = ['CM2', '6e', '5e', '4e', '3e', '2nde', '1ère', 'Terminale', 'Étudiant', 'Adulte']