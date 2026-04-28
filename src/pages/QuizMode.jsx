import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { generateQuizQuestions } from '../services/quiz'
import Button from '../components/ui/Button'

export default function QuizMode() {
  const navigate = useNavigate()
  const { user, profile, isPremium } = useAuth()
  const [step, setStep] = useState('setup') // setup, quiz, results
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([])
  const [timer, setTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const subjects = ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Histoire-Géographie', 'Anglais', 'Espagnol', 'Allemand']
  const levels = ['6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale']

  useEffect(() => {
    let interval
    if (step === 'quiz' && timer > 0) {
      interval = setInterval(() => setTimer(timer - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [step, timer])

  const handleStartQuiz = async () => {
    if (!subject || !level) return

    setLoading(true)
    try {
      const quizQuestions = await generateQuizQuestions(subject, level, questionCount, profile)
      setQuestions(quizQuestions)
      setAnswers(new Array(questionCount).fill(null))
      setTimer(questionCount * 60) // 1 minute par question
      setStep('quiz')
      setCurrentQuestion(0)
    } catch (error) {
      console.error('Erreur génération quiz:', error)
      alert('Erreur lors de la génération du quiz. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResults(newAnswers)
    }
  }

  const calculateResults = (finalAnswers) => {
    let correct = 0
    const detailedResults = questions.map((q, i) => {
      const isCorrect = finalAnswers[i] === q.correctAnswer
      if (isCorrect) correct++
      return {
        question: q.question,
        userAnswer: finalAnswers[i],
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      }
    })

    setResults({
      total: questions.length,
      correct,
      percentage: Math.round((correct / questions.length) * 100),
      details: detailedResults
    })
    setStep('results')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (step === 'setup') {
    return (
      <div style={{
        minHeight: '100%',
        background: 'var(--bg)',
        padding: '24px',
        maxWidth: '520px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-2)', borderRadius: '8px',
              padding: '6px 10px', cursor: 'pointer', fontSize: '16px',
            }}
          >←</button>
          <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '22px' }}>Mode Épreuve</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' }}>
              Matière
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--text)',
              }}
            >
              <option value="">Choisir une matière</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' }}>
              Niveau
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--text)',
              }}
            >
              <option value="">Choisir un niveau</option>
              {levels.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' }}>
              Nombre de questions : {questionCount}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <Button
            fullWidth
            onClick={handleStartQuiz}
            loading={loading}
            disabled={!subject || !level}
          >
            Commencer l'épreuve
          </Button>

          {!isPremium && (
            <div style={{
              padding: '12px',
              background: 'rgba(29,158,117,0.1)',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-2)',
              textAlign: 'center',
            }}>
              💡 Mode Premium : questions personnalisées selon ton profil cognitif
            </div>
          )}
        </div>
      </div>
    )
  }

  if (step === 'quiz') {
    const question = questions[currentQuestion]
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div style={{
        minHeight: '100%',
        background: 'var(--bg)',
        padding: '24px',
        maxWidth: '520px',
        margin: '0 auto',
      }}>
        {/* Header avec timer et progression */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div style={{
            padding: '8px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: timer < 60 ? 'var(--error)' : 'var(--accent)',
          }}>
            ⏱️ {formatTime(timer)}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-2)' }}>
            Question {currentQuestion + 1}/{questions.length}
          </div>
        </div>

        {/* Barre de progression */}
        <div style={{
          height: '4px',
          background: 'var(--bg)',
          borderRadius: '2px',
          marginBottom: '24px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--accent)',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Question */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--accent)',
            fontWeight: '600',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}>
            {question.level}
          </div>
          <div style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text)' }}>
            {question.question}
          </div>
        </div>

        {/* Réponses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(option)}
              style={{
                width: '100%',
                padding: '16px',
                background: 'var(--bg-card)',
                border: '2px solid var(--border)',
                borderRadius: '12px',
                fontSize: '14px',
                color: 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--accent)'
                e.target.style.background = 'rgba(29,158,117,0.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.background = 'var(--bg-card)'
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'results') {
    return (
      <div style={{
        minHeight: '100%',
        background: 'var(--bg)',
        padding: '24px',
        maxWidth: '520px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-2)', borderRadius: '8px',
              padding: '6px 10px', cursor: 'pointer', fontSize: '16px',
            }}
          >←</button>
          <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '22px' }}>Résultats</h1>
        </div>

        {/* Score global */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>
            {results.percentage}%
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '16px' }}>
            {results.correct}/{results.total} bonnes réponses
          </div>
          <div style={{
            padding: '12px',
            background: results.percentage >= 70 ? 'rgba(29,158,117,0.1)' : 'rgba(239,68,68,0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            color: results.percentage >= 70 ? 'var(--accent)' : 'var(--error)',
          }}>
            {results.percentage >= 70 ? '🎉 Excellent travail !' : '💪 Continue à t\'entraîner !'}
          </div>
        </div>

        {/* Détail par question */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text)' }}>
            Détail des réponses
          </h3>
          {results.details.map((detail, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${detail.isCorrect ? 'var(--accent)' : 'var(--error)'}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
                Question {i + 1}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '8px' }}>
                {detail.question}
              </div>
              <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-3)' }}>Ta réponse :</span>{' '}
                <span style={{ color: detail.isCorrect ? 'var(--accent)' : 'var(--error)', fontWeight: '600' }}>
                  {detail.userAnswer}
                </span>
              </div>
              {!detail.isCorrect && (
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-3)' }}>Bonne réponse :</span>{' '}
                  <span style={{ color: 'var(--accent)', fontWeight: '600' }}>
                    {detail.correctAnswer}
                  </span>
                </div>
              )}
              {detail.explanation && (
                <div style={{
                  padding: '8px',
                  background: 'rgba(29,158,117,0.05)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-2)',
                  lineHeight: '1.5',
                }}>
                  💡 {detail.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button fullWidth onClick={() => navigate(-1)}>
          Retour au dashboard
        </Button>
      </div>
    )
  }

  return null
}
