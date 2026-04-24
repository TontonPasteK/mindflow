import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MaxAvatar from '../components/avatar/MaxAvatar'
import Button from '../components/ui/Button'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate  = useNavigate()
  const toSignup  = () => navigate('/auth?mode=signup')
  const toLogin   = () => navigate('/auth')
  const toParent  = () => navigate('/auth?mode=signup')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden', color: 'var(--text)' }}>
      {/* Ambient glow — fixed so it doesn't scroll */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 700px 500px at 50% -10%, rgba(29,158,117,0.07) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <LandingNav toSignup={toSignup} toLogin={toLogin} />
        <HeroSection toSignup={toSignup} toParent={toParent} />
        <ProblemSection />
        <SolutionSection />
        <AvatarsSection toSignup={toSignup} />
        <ChatDemoSection />
        <TestimonialsSection />
        <PricingSection toSignup={toSignup} />
        <CTAFinalSection toSignup={toSignup} />
        <LandingFooter />
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function LandingNav({ toSignup, toLogin }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px',
      borderBottom: '1px solid var(--border)',
      maxWidth: '1200px', margin: '0 auto',
    }}>
      <Logo />
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Button variant="ghost" size="sm" onClick={toLogin}>Connexion</Button>
        <Button size="sm" onClick={toSignup}>Essayer gratuitement</Button>
      </div>
    </nav>
  )
}

// ─── 1. Hero ──────────────────────────────────────────────────────────────────

function HeroSection({ toSignup, toParent }) {
  return (
    <section style={{
      maxWidth: '1100px', margin: '0 auto',
      padding: 'clamp(60px, 10vw, 110px) 32px clamp(60px, 10vw, 110px)',
      display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap',
    }}>
      {/* Avatar */}
      <div style={{
        flex: '0 0 auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        animation: 'fade-in 0.5s ease both',
        margin: '0 auto',
      }}>
        <MaxAvatar isSpeaking={false} size={160} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: 'var(--accent-dim)', border: '1px solid var(--border-h)',
          borderRadius: '20px', padding: '5px 14px',
          fontSize: '12px', color: 'var(--accent)', fontWeight: '700',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)',
            display: 'inline-block', boxShadow: '0 0 6px var(--accent)',
          }} />
          Disponible maintenant
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: '1 1 320px', minWidth: 0 }}>
        <div className="fade-up" style={{
          display: 'inline-block', background: 'var(--accent-dim)',
          border: '1px solid var(--border-h)', borderRadius: '20px',
          padding: '5px 14px', fontSize: '12px', color: 'var(--accent)',
          fontWeight: '700', letterSpacing: '0.07em', textTransform: 'uppercase',
          marginBottom: '22px',
        }}>
          ✦ Compagnon IA personnalisé
        </div>

        <h1 className="fade-up" style={{
          animationDelay: '0.07s',
          fontFamily: 'var(--f-title)', fontWeight: '800',
          fontSize: 'clamp(32px, 4.5vw, 58px)', lineHeight: '1.1',
          marginBottom: '20px', color: 'var(--text)',
        }}>
          La bonne méthode existe.<br />
          <span style={{ color: 'var(--accent)' }}>C'est la tienne.</span>
        </h1>

        <p className="fade-up" style={{
          animationDelay: '0.12s',
          fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-2)',
          lineHeight: '1.75', marginBottom: '32px', maxWidth: '480px',
        }}>
          Pas un prof. Pas un robot. Une grande sœur qui comprend vraiment comment
          ton cerveau fonctionne — et qui adapte chaque explication rien que pour toi.
        </p>

        <div className="fade-up" style={{
          animationDelay: '0.17s',
          display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '22px',
        }}>
          <Button size="lg" onClick={toSignup}>Essayer gratuitement →</Button>
          <Button size="lg" variant="secondary" onClick={toParent}>Découvrir pour mon enfant</Button>
        </div>

        <div className="fade-up" style={{
          animationDelay: '0.23s',
          display: 'flex', gap: '20px', flexWrap: 'wrap',
          fontSize: '13px', color: 'var(--text-3)',
        }}>
          {['✓ Gratuit pour commencer', '✓ Sans engagement', '✓ 5 min pour démarrer'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 2. Problème ──────────────────────────────────────────────────────────────

function ProblemSection() {
  const pains = [
    {
      icon: '🔄',
      title: 'Méthode unique pour tous',
      desc: 'Le prof explique de la même façon à 30 élèves. Ton enfant n\'est pas "dans le moule" — il reste à la traîne sans comprendre pourquoi.',
    },
    {
      icon: '😐',
      title: 'Le prof parle, l\'élève subit',
      desc: 'Passif, il attend que ça "rentre". Mais apprendre, c\'est actif. Sans la bonne méthode, rien ne s\'ancre vraiment.',
    },
    {
      icon: '📉',
      title: 'Les notes stagnent',
      desc: 'Des cours particuliers à 40€/h, des manuels, des apps... Des centaines d\'euros dépensés. Les résultats ne suivent toujours pas.',
    },
  ]

  return (
    <section style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      padding: 'clamp(60px, 9vw, 100px) 32px',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{
            fontFamily: 'var(--f-title)', fontWeight: '800',
            fontSize: 'clamp(22px, 3.5vw, 42px)', lineHeight: '1.2',
            marginBottom: '14px',
          }}>
            Les cours particuliers coûtent cher.<br />
            <span style={{ color: 'var(--text-2)', fontWeight: '600' }}>Et souvent, ça ne change rien.</span>
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: '15px', maxWidth: '480px', margin: '0 auto', lineHeight: '1.7' }}>
            En France, une heure de cours particulier coûte entre 30 et 60€. Pour des résultats qui finissent par décevoir.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px',
          marginBottom: '40px',
        }}>
          {pains.map((p, i) => (
            <div key={i} style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)', padding: '28px 24px',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>{p.icon}</div>
              <h3 style={{ fontFamily: 'var(--f-title)', fontSize: '16px', marginBottom: '10px' }}>{p.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7' }}>{p.desc}</p>
            </div>
          ))}
        </div>

        <div style={{
          textAlign: 'center', padding: '28px 32px',
          background: 'var(--accent-dim)', border: '1px solid var(--border-h)',
          borderRadius: 'var(--r-xl)',
        }}>
          <p style={{
            fontFamily: 'var(--f-title)', fontWeight: '700',
            fontSize: 'clamp(16px, 2.2vw, 20px)', color: 'var(--accent)', lineHeight: '1.5',
          }}>
            Et si le problème, c'était qu'on ne sait pas<br />
            comment ton enfant apprend vraiment ?
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── 3. Solution ──────────────────────────────────────────────────────────────

const VAK_PROFILES = [
  {
    icon: '👁️', tag: 'Visuel',
    title: 'Tu penses en images',
    traits: ['Tu retiens mieux avec des schémas', 'Tu visualises les scènes dans ta tête', 'Les couleurs et les cartes t\'aident'],
    example: '"Imagine une frise chronologique colorée — chaque événement a sa couleur."',
    color: '#3B82F6',
  },
  {
    icon: '👂', tag: 'Auditif',
    title: 'Tu penses en sons',
    traits: ['Tu retiens mieux en lisant à voix haute', 'Les rythmes et rimes t\'aident', 'Tu aimes les explications parlées'],
    example: '"Répète cette formule en rythme — comme un refrain que tu ne peux plus sortir de ta tête."',
    color: '#F59E0B',
  },
  {
    icon: '🤝', tag: 'Kinesthésique',
    title: 'Tu penses par le ressenti',
    traits: ['Tu retiens mieux en faisant', 'Les exemples concrets t\'ancrent', 'Tu as besoin de bouger pour apprendre'],
    example: '"Mime la réaction chimique avec tes mains — ton corps va mémoriser à ta place."',
    color: '#EC4899',
  },
]

function SolutionSection() {
  return (
    <section style={{ padding: 'clamp(60px, 9vw, 100px) 32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <p style={{
          color: 'var(--accent)', fontWeight: '700', fontSize: '12px',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px',
        }}>La méthode Evokia</p>
        <h2 style={{
          fontFamily: 'var(--f-title)', fontWeight: '800',
          fontSize: 'clamp(24px, 3.5vw, 44px)', lineHeight: '1.15', maxWidth: '640px', margin: '0 auto',
        }}>
          Ton cerveau a un mode d'emploi.<br />
          <span style={{ color: 'var(--accent)' }}>On le trouve ensemble.</span>
        </h2>
        <p style={{
          color: 'var(--text-2)', fontSize: '17px', marginTop: '16px', lineHeight: '1.7',
          maxWidth: '480px', margin: '16px auto 0',
        }}>
          Visuel, auditif ou kinesthésique — chaque profil apprend différemment.
          Evokia détecte le tien et adapte chaque explication en conséquence.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {VAK_PROFILES.map((p, i) => (
          <div key={i}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)', padding: '32px 28px',
              position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = p.color + '66'
              e.currentTarget.style.boxShadow = `0 0 24px ${p.color}22`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: `linear-gradient(90deg, transparent, ${p.color}, transparent)`,
            }} />
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>{p.icon}</div>
            <span style={{
              display: 'inline-block', background: p.color + '22', color: p.color,
              fontSize: '11px', fontWeight: '700', letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '3px 10px', borderRadius: '6px', marginBottom: '14px',
            }}>{p.tag}</span>
            <h3 style={{ fontFamily: 'var(--f-title)', fontSize: '20px', marginBottom: '14px' }}>{p.title}</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {p.traits.map((t, j) => (
                <li key={j} style={{ fontSize: '14px', color: 'var(--text-2)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: p.color, flexShrink: 0 }}>✓</span>{t}
                </li>
              ))}
            </ul>
            <div style={{
              background: 'var(--bg)', border: `1px solid ${p.color}33`,
              borderRadius: 'var(--r-md)', padding: '12px 14px',
              fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic', lineHeight: '1.6',
            }}>
              {p.example}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── 4. Maya en action ────────────────────────────────────────────────────────

const EXCHANGES = [
  { role: 'maya', text: 'Ferme les yeux. Je dis le mot CHEVAL. Qu\'est-ce qui se passe dans ta tête ?' },
  { role: 'user', text: 'Je vois une image... genre une photo assez nette 🐴' },
  { role: 'maya', text: 'Intéressant. Et si je dis le mot PLAGE ?' },
  { role: 'user', text: 'Du sable jaune, le soleil... et j\'entends aussi les vagues !' },
  { role: 'maya', text: '🎯 T\'es visuel avec une touche d\'auditif. Je vais adapter toutes mes explications pour toi — fini les mémos qui ne rentrent pas.' },
]

function ChatDemoSection() {
  const [count, setCount] = useState(1)

  useEffect(() => {
    if (count >= EXCHANGES.length) {
      const reset = setTimeout(() => setCount(1), 3500)
      return () => clearTimeout(reset)
    }
    const t = setTimeout(() => setCount(v => v + 1), 2400)
    return () => clearTimeout(t)
  }, [count])

  return (
    <section style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      padding: 'clamp(60px, 9vw, 100px) 32px',
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{
            color: 'var(--accent)', fontWeight: '700', fontSize: '12px',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px',
          }}>Maya en action</p>
          <h2 style={{
            fontFamily: 'var(--f-title)', fontWeight: '800',
            fontSize: 'clamp(22px, 3vw, 38px)', lineHeight: '1.2',
          }}>
            Regarde comment Maya<br />
            <span style={{ color: 'var(--accent)' }}>découvre comment tu penses</span>
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: '14px', marginTop: '12px' }}>
            En 5 minutes. Sans questionnaire. Juste une vraie conversation.
          </p>
        </div>

        <div style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: '28px',
          minHeight: '340px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          {EXCHANGES.slice(0, count).map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'maya' ? 'flex-start' : 'flex-end',
              animation: 'slide-in-' + (msg.role === 'maya' ? 'left' : 'right') + ' 0.3s ease both',
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '11px 16px',
                borderRadius: msg.role === 'maya' ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
                background: msg.role === 'maya'
                  ? 'linear-gradient(135deg, var(--bg-card), #121E15)'
                  : 'var(--accent-dim)',
                border: `1px solid ${msg.role === 'maya' ? 'var(--border)' : 'var(--border-h)'}`,
                fontSize: '14px', lineHeight: '1.65', color: 'var(--text)',
              }}>
                {msg.role === 'maya' && (
                  <div style={{
                    fontSize: '10px', color: 'var(--accent)', fontWeight: '700',
                    letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '5px',
                  }}>Maya</div>
                )}
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing dots */}
          {count < EXCHANGES.length && EXCHANGES[count].role === 'max' && (
            <div style={{ display: 'flex', gap: '5px', paddingLeft: '4px', animation: 'fade-in 0.3s ease both' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: `wave-bar 1s ${i * 0.18}s ease-in-out infinite`,
                  transformOrigin: 'center',
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── 4b. Avatars ──────────────────────────────────────────────────────────────

const AVATARS = [
  {
    name: 'Max', emoji: '🔵', profil: 'Visuel',
    desc: 'Max raisonne en images et en schémas. Il transforme chaque concept abstrait en carte mentale ou frise visuelle.',
    style: 'Direct, précis, organisé.',
    color: '#3B82F6',
  },
  {
    name: 'Victor', emoji: '🟡', profil: 'Auditif',
    desc: 'Victor pense à voix haute. Il explique par des formules rythmées, des analogies sonores et des récits logiques.',
    style: 'Narratif, méthodique, pédagogue.',
    color: '#F59E0B',
  },
  {
    name: 'Léo', emoji: '🟢', profil: 'Kinesthésique',
    desc: 'Léo apprend en faisant. Il ancre les notions dans des exemples concrets, des gestes et des mises en situation réelles.',
    style: 'Concret, dynamique, hands-on.',
    color: '#22C55E',
  },
]

function AvatarsSection({ toSignup }) {
  return (
    <section style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      padding: 'clamp(60px, 9vw, 100px) 32px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{
            color: 'var(--accent)', fontWeight: '700', fontSize: '12px',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px',
          }}>Tes tuteurs</p>
          <h2 style={{
            fontFamily: 'var(--f-title)', fontWeight: '800',
            fontSize: 'clamp(24px, 3.5vw, 44px)', lineHeight: '1.15',
          }}>
            7 avatars, <span style={{ color: 'var(--accent)' }}>un seul te correspond</span>
          </h2>
          <p style={{
            color: 'var(--text-2)', fontSize: '17px', marginTop: '16px', lineHeight: '1.7',
            maxWidth: '480px', margin: '16px auto 0',
          }}>
            Dr Mind analyse ton profil et t'attribue automatiquement l'avatar qui parle vraiment comme ton cerveau pense.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {AVATARS.map((a, i) => (
            <div key={i} style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)', padding: '32px 28px',
              position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = a.color + '66'
                e.currentTarget.style.boxShadow = `0 0 24px ${a.color}22`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, transparent, ${a.color}, transparent)`,
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: a.color + '22', border: `1px solid ${a.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px',
                }}>
                  {a.emoji}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--f-title)', fontWeight: '800', fontSize: '20px' }}>{a.name}</div>
                  <div style={{
                    display: 'inline-block', background: a.color + '22', color: a.color,
                    fontSize: '11px', fontWeight: '700', letterSpacing: '0.07em', textTransform: 'uppercase',
                    padding: '2px 8px', borderRadius: '6px', marginTop: '4px',
                  }}>{a.profil}</div>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.75', marginBottom: '14px' }}>{a.desc}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic' }}>{a.style}</p>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-3)' }}>
          + 4 autres avatars pour les profils mixtes — Maya (V+A), Noa (V+K), Sam (A+K), Alex (équilibré)
        </p>
      </div>
    </section>
  )
}

// ─── 5. Témoignages ───────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    initials: 'NM', color: '#3B82F6',
    name: 'Nathalie M.', role: 'Maman de Bastien, 4e',
    quote: 'En 3 semaines, mon fils est passé de 9 à 13 en maths. Mais surtout, il a arrêté de dire "je suis nul". Il comprend enfin pourquoi certaines méthodes ne marchaient pas pour lui.',
    before: '9/20', after: '13/20', subject: 'Maths',
  },
  {
    initials: 'LD', color: '#F59E0B',
    name: 'Lucas D.', role: 'Terminale, 17 ans',
    quote: 'J\'avais un mur avec l\'histoire-géo. Maya m\'a montré comment créer des images mentales pour chaque événement. Maintenant je retiens vraiment, et franchement je kiffe.',
    before: '8/20', after: '14/20', subject: 'Histoire',
  },
  {
    initials: 'SB', color: '#EC4899',
    name: 'Sophie B.', role: 'Maman de Léa, CM2',
    quote: 'Ma fille avait honte de ne pas comprendre. Elle se cachait en classe. Depuis Evokia, elle attend ses sessions avec impatience. Ce changement d\'attitude, c\'est inestimable.',
    before: '11/20', after: '16/20', subject: 'Français',
  },
]

function TestimonialsSection() {
  return (
    <section style={{ padding: 'clamp(60px, 9vw, 100px) 32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <p style={{
          color: 'var(--accent)', fontWeight: '700', fontSize: '12px',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px',
        }}>Témoignages</p>
        <h2 style={{
          fontFamily: 'var(--f-title)', fontWeight: '800',
          fontSize: 'clamp(22px, 3vw, 40px)', lineHeight: '1.2',
        }}>Ce que disent les familles</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)', padding: '28px',
            display: 'flex', flexDirection: 'column', gap: '18px',
          }}>
            {/* Stars */}
            <div style={{ color: '#F59E0B', fontSize: '15px', letterSpacing: '2px' }}>★★★★★</div>

            {/* Quote */}
            <p style={{
              fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.75',
              flex: 1, fontStyle: 'italic',
            }}>"{t.quote}"</p>

            {/* Before / after */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              fontSize: '13px',
            }}>
              <span style={{ color: 'var(--text-3)', flex: 1 }}>{t.subject}</span>
              <span style={{ color: 'var(--error)', fontWeight: '700' }}>{t.before}</span>
              <span style={{ color: 'var(--text-3)' }}>→</span>
              <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{t.after}</span>
            </div>

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <InitialAvatar initials={t.initials} color={t.color} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>{t.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── 6. Pricing ───────────────────────────────────────────────────────────────

const FREE_FEATURES    = ['Aide aux devoirs avec Maya', 'Questions illimitées', 'Accessible sur mobile', 'Sans engagement']
const PREMIUM_FEATURES = ['Tout le plan Gratuit', 'Profil cognitif V/A/K complet', 'Stratégies 100% personnalisées', 'Voix naturelle de Maya', 'Scanner de documents & photos', 'Dashboard parent en temps réel', 'Historique et journal de victoires']

function PricingSection({ toSignup }) {
  return (
    <section style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      padding: 'clamp(60px, 9vw, 100px) 32px',
    }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{
            color: 'var(--accent)', fontWeight: '700', fontSize: '12px',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px',
          }}>Tarifs</p>
          <h2 style={{
            fontFamily: 'var(--f-title)', fontWeight: '800',
            fontSize: 'clamp(22px, 3vw, 40px)', lineHeight: '1.2',
          }}>
            Commence gratuitement,{' '}
            <span style={{ color: 'var(--accent)' }}>évolue quand tu veux</span>
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px', alignItems: 'start',
        }}>
          {/* Free */}
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)', padding: '36px 32px',
          }}>
            <PlanHeader label="Gratuit" price="0€" sub="Pour toujours" labelColor="var(--text-3)" />
            <FeatureList features={FREE_FEATURES} disabledFrom={99} />
            <Button variant="secondary" fullWidth onClick={toSignup} style={{ marginTop: '28px' }}>
              Commencer gratuitement
            </Button>
          </div>

          {/* Premium */}
          <div style={{
            background: 'linear-gradient(145deg, #0E1F16, var(--bg-card))',
            border: '1px solid var(--border-h)',
            borderRadius: 'var(--r-xl)', padding: '36px 32px',
            boxShadow: 'var(--glow)', position: 'relative', overflow: 'hidden',
          }}>
            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            }} />
            {/* Badge */}
            <div style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'var(--accent)', color: '#080D0A',
              fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
              letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '6px',
            }}>Recommandé</div>

            <PlanHeader label="★ Premium" price="19€" sub="par mois · sans engagement" labelColor="var(--accent)" />
            <FeatureList features={PREMIUM_FEATURES} disabledFrom={99} />

            <button onClick={toSignup} style={{
              width: '100%', marginTop: '28px', padding: '14px',
              background: 'var(--accent)', color: '#080D0A',
              border: 'none', borderRadius: 'var(--r-md)',
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              fontFamily: 'var(--f-body)', transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-h)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              Commencer l'essai gratuit →
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-3)', marginTop: '10px' }}>
              7 jours d'essai · Annuler à tout moment
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 7. CTA Final ─────────────────────────────────────────────────────────────

function CTAFinalSection({ toSignup }) {
  return (
    <section style={{
      padding: 'clamp(70px, 10vw, 110px) 32px',
      maxWidth: '860px', margin: '0 auto',
      textAlign: 'center',
    }}>
      <p style={{
        color: 'var(--accent)', fontWeight: '700', fontSize: '12px',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px',
      }}>Prêt·e ?</p>
      <h2 style={{
        fontFamily: 'var(--f-title)', fontWeight: '800',
        fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: '1.15',
        marginBottom: '20px',
      }}>
        Découvre comment <span style={{ color: 'var(--accent)' }}>ton cerveau</span><br />
        apprend vraiment.
      </h2>
      <p style={{
        color: 'var(--text-2)', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: '1.75',
        maxWidth: '480px', margin: '0 auto 36px',
      }}>
        5 minutes pour que Dr Mind te découvre. Gratuit, sans carte bancaire.
      </p>
      <button onClick={toSignup} style={{
        padding: '16px 40px',
        background: 'var(--accent)', color: '#080D0A',
        border: 'none', borderRadius: 'var(--r-md)',
        fontSize: '17px', fontWeight: '700', cursor: 'pointer',
        fontFamily: 'var(--f-body)', transition: 'background 0.15s',
        letterSpacing: '-0.01em',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-h)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
      >
        Essayer gratuitement →
      </button>
      <p style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text-3)' }}>
        ✓ Sans engagement · ✓ 5 min pour démarrer · ✓ Données protégées RGPD
      </p>
    </section>
  )
}

// ─── 8. Footer ────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '28px 32px',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <Logo />
        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          Evokia © 2026 — Tous droits réservés
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="/legal" style={{ fontSize: '13px', color: 'var(--text-3)', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >CGU & Confidentialité</a>
          <a href="mailto:scolrcoaching@gmail.com" style={{ fontSize: '13px', color: 'var(--text-3)', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >Contact</a>
        </div>
      </div>
    </footer>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', background: 'var(--accent)',
        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" fill="#080D0A"/>
        </svg>
      </div>
      <span style={{ fontFamily: 'var(--f-title)', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.02em' }}>
        Evokia
      </span>
    </div>
  )
}

function InitialAvatar({ initials, color }) {
  return (
    <div style={{
      width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
      background: color + '22', border: `2px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: '14px', fontWeight: '700', color, fontFamily: 'var(--f-title)' }}>
        {initials}
      </span>
    </div>
  )
}

function PlanHeader({ label, price, sub, labelColor }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '13px', fontWeight: '700', color: labelColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--f-title)', fontSize: '48px', fontWeight: '800', lineHeight: '1' }}>
        {price}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>{sub}</div>
    </div>
  )
}

function FeatureList({ features, disabledFrom }) {
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px' }}>
      {features.map((f, i) => {
        const disabled = i >= disabledFrom
        return (
          <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: disabled ? 'var(--text-3)' : 'var(--text-2)', alignItems: 'flex-start' }}>
            <span style={{ color: disabled ? 'var(--text-3)' : 'var(--accent)', flexShrink: 0, marginTop: '1px' }}>
              {disabled ? '✗' : '✓'}
            </span>
            {f}
          </li>
        )
      })}
    </ul>
  )
}
