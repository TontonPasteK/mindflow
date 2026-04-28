import { useState, useEffect, useRef } from 'react'
import { sendParentChatMessage, getParentChatHistory, clearParentChatHistory } from '../../services/parentChatbot'

export default function ParentChatbot({ parentId, childId, childName }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadChatHistory()
  }, [parentId, childId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = async () => {
    if (!parentId || !childId) return

    setLoading(true)
    try {
      const history = await getParentChatHistory(parentId, childId)

      // Convertir l'historique en format de messages
      const formattedMessages = history.map(msg => ({
        id: msg.id,
        type: 'user',
        content: msg.user_message,
        timestamp: msg.created_at
      })).concat(history.map(msg => ({
        id: `${msg.id}_ai`,
        type: 'ai',
        content: msg.ai_response,
        timestamp: msg.created_at
      }))).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

      setMessages(formattedMessages)
    } catch (error) {
      console.error('Erreur chargement historique chatbot:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setSending(true)

    // Ajouter le message utilisateur immédiatement
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await sendParentChatMessage(parentId, childId, userMessage)

      // Ajouter la réponse de l'IA
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.message,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Erreur envoi message:', error)

      // Message d'erreur
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('Supprimer tout l\'historique de conversation ?')) return

    try {
      await clearParentChatHistory(parentId, childId)
      setMessages([])
    } catch (error) {
      console.error('Erreur suppression historique:', error)
      alert('Erreur lors de la suppression de l\'historique')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'var(--text-3)',
      }}>
        Chargement du chatbot...
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{
            fontFamily: 'var(--f-title)',
            fontSize: '18px',
            margin: 0,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🤖 Assistant Parent
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
            Pose tes questions sur {childName}
          </p>
        </div>
        <button
          onClick={handleClearHistory}
          style={{
            padding: '8px 16px',
            background: 'var(--error-dim)',
            border: '1px solid var(--error)',
            borderRadius: '8px',
            color: 'var(--error)',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--error)'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--error-dim)'
            e.currentTarget.style.color = 'var(--error)'
          }}
        >
          Effacer l'historique
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-3)',
            marginTop: '60px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              Bonjour ! Je suis ton assistant parent.
            </p>
            <p style={{ fontSize: '13px' }}>
              Pose-moi tes questions sur les progrès, le profil cognitif ou les recommandations pour {childName}.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              formatTime={formatTime}
            />
          ))
        )}
        {sending && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px',
          }}>
            <div style={{
              display: 'flex',
              gap: '4px',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'bounce 1.4s infinite ease-in-out both',
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'bounce 1.4s infinite ease-in-out both 0.16s',
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'bounce 1.4s infinite ease-in-out both 0.32s',
              }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '12px',
      }}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Pose ta question ici..."
          disabled={sending}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'none',
            minHeight: '48px',
            maxHeight: '120px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-h)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || sending}
          style={{
            padding: '12px 24px',
            background: inputValue.trim() && !sending ? 'var(--accent)' : 'var(--text-3)',
            border: 'none',
            borderRadius: '8px',
            color: inputValue.trim() && !sending ? '#080D0A' : 'var(--text-2)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: inputValue.trim() && !sending ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            minWidth: '100px',
          }}
        >
          {sending ? '...' : 'Envoyer'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}

function MessageBubble({ message, formatTime }) {
  const isUser = message.type === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: isUser ? 'var(--accent)' : 'var(--bg)',
          border: isUser ? '1px solid var(--accent)' : '1px solid var(--border)',
          borderRadius: '12px',
          color: isUser ? '#080D0A' : 'var(--text)',
          fontSize: '14px',
          lineHeight: '1.5',
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          {message.content}
        </div>
        <div style={{
          fontSize: '11px',
          color: isUser ? 'rgba(8, 13, 10, 0.6)' : 'var(--text-3)',
          textAlign: 'right',
        }}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
