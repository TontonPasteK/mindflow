import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

export default function ChatInterface({ messages, loading, speakingMessageId, ttsEnabled, avatarName = 'Dr Mind' }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id || i}
          role={msg.role}
          content={msg.content}
          strategies={msg.strategies}
          fileAttachment={msg.fileAttachment}
          isSpeaking={msg.id === speakingMessageId}
          isLatestAssistant={msg.role === 'assistant' && i === messages.length - 1}
          ttsEnabled={ttsEnabled}
          avatarName={avatarName}
        />
      ))}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
