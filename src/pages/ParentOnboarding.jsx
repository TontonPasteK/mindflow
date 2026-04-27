import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function ParentOnboarding() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Étape 2 : Profil enfant
  const [childForm, setChildForm] = useState({
    prenom: '',
    age: '',
    classe: ''
  })

  // Étape 3 : Code d'accès
  const [accessCode, setAccessCode] = useState('')

  const handleStep2Submit = async (e) => {
    e.preventDefault()
    if (!childForm.prenom.trim() || !childForm.age || !childForm.classe) {
      setError('Tous les champs sont requis')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Générer un code d'accès unique (6 caractères)
      const code = generateAccessCode()

      // Mettre à jour le profil parent avec les infos de l'enfant
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          child_prenom: childForm.prenom.trim(),
          child_age: parseInt(childForm.age),
          child_classe: childForm.classe,
          access_code: code,
          onboarding_parent_complete: true
        })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      setAccessCode(code)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleStartDrMind = () => {
    navigate('/drMind?seance=1')
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
        maxWidth: '480px',
        animation: 'fade-up 0.4s ease',
      }}>
        {/* Progress bar */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
        }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                background: s <= step ? 'var(--accent)' : 'var(--border)',
                borderRadius: '2px',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Étape 1 : Bienvenue */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'var(--accent-dim)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <span style={{ fontSize: '32px' }}>👋</span>
            </div>
            <h1 style={{
              fontFamily: 'var(--f-title)',
              fontSize: '28px',
              marginBottom: '12px',
            }}>
              Bienvenue, {user?.prenom} !
            </h1>
            <p style={{
              color: 'var(--text-2)',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '32px',
            }}>
              Evokia accompagne votre enfant chaque soir.<br/>
              Créons ensemble son espace personnalisé.
            </p>
            <Button
              fullWidth
              size="lg"
              onClick={() => setStep(2)}
            >
              Commencer →
            </Button>
          </div>
        )}

        {/* Étape 2 : Profil enfant */}
        {step === 2 && (
          <div>
            <h2 style={{
              fontFamily: 'var(--f-title)',
              fontSize: '24px',
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              Qui est votre enfant ?
            </h2>
            <p style={{
              color: 'var(--text-2)',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              Ces infos aideront Evokia à s'adapter à lui.
            </p>

            <form onSubmit={handleStep2Submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Prénom de l'enfant"
                value={childForm.prenom}
                onChange={e => setChildForm({ ...childForm, prenom: e.target.value })}
                placeholder="Lucas"
                required
                autoFocus
              />

              <Input
                label="Âge"
                type="number"
                value={childForm.age}
                onChange={e => setChildForm({ ...childForm, age: e.target.value })}
                placeholder="12"
                min="6"
                max="25"
                required
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{
                  fontSize: '13px', fontWeight: '500',
                  color: 'var(--text-2)',
                }}>
                  Classe <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <select
                  value={childForm.classe}
                  onChange={e => setChildForm({ ...childForm, classe: e.target.value })}
                  required
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    color: childForm.classe ? 'var(--text)' : 'var(--text-3)',
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
                  <option value="" disabled>Choisis la classe</option>
                  {CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p style={{
                  fontSize: '13px',
                  color: 'var(--error)',
                  padding: '10px 14px',
                  background: 'var(--error-dim)',
                  borderRadius: 'var(--r-sm)',
                  margin: 0,
                }}>{error}</p>
              )}

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
              >
                Continuer →
              </Button>
            </form>
          </div>
        )}

        {/* Étape 3 : Code d'accès */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'var(--accent-dim)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <span style={{ fontSize: '32px' }}>🔑</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--f-title)',
              fontSize: '24px',
              marginBottom: '12px',
            }}>
              Voici le code d'accès
            </h2>
            <p style={{
              color: 'var(--text-2)',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px',
            }}>
              Donnez ce code à {childForm.prenom}.<br/>
              Il pourra se connecter avec ce code.
            </p>

            <div style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--accent)',
              borderRadius: 'var(--r-lg)',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <p style={{
                fontSize: '48px',
                fontWeight: '800',
                color: 'var(--accent)',
                letterSpacing: '8px',
                margin: 0,
                fontFamily: 'monospace',
              }}>
                {accessCode}
              </p>
            </div>

            <div style={{
              background: 'rgba(29,158,117,0.1)',
              border: '1px solid rgba(29,158,117,0.25)',
              borderRadius: 'var(--r-md)',
              padding: '12px 16px',
              marginBottom: '24px',
              textAlign: 'left',
            }}>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-2)',
                margin: 0,
                lineHeight: '1.5',
              }}>
                💡 <strong>Conseil :</strong> Notez ce code quelque part. {childForm.prenom} en aura besoin pour se connecter.
              </p>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={() => setStep(4)}
            >
              J'ai noté le code →
            </Button>
          </div>
        )}

        {/* Étape 4 : Dr Mind */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'var(--accent-dim)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <span style={{ fontSize: '32px' }}>🧠</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--f-title)',
              fontSize: '24px',
              marginBottom: '16px',
            }}>
              Dr Mind va découvrir comment {childForm.prenom} pense
            </h2>
            <p style={{
              color: 'var(--text-2)',
              fontSize: '15px',
              lineHeight: '1.7',
              marginBottom: '32px',
            }}>
              En 2 séances de 20 minutes, Dr Mind construira le profil cognitif de {childForm.prenom}.
              <br/><br/>
              <strong>Visuel, auditif ou kinesthésique ?</strong><br/>
              Chaque explication sera adaptée à sa façon d'apprendre.
            </p>

            <Button
              fullWidth
              size="lg"
              onClick={handleStartDrMind}
            >
              Lancer la première séance →
            </Button>

            <button
              onClick={() => navigate('/parent')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                fontSize: '13px',
                cursor: 'pointer',
                marginTop: '16px',
              }}
            >
              Passer pour l'instant →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Pas de I, O, 0, 1 pour éviter confusion
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const CLASSES = ['CM2', '6e', '5e', '4e', '3e', '2nde', '1ère', 'Terminale', 'Étudiant']
