import { useRef, useState } from 'react'

export default function DocumentScanner({ onScan, isPremium, ocrProgress = 0, ocrProcessing = false }) {
  const cameraRef = useRef(null)
  const fileRef   = useRef(null)
  const [scanning, setScanning] = useState(false)

  const handleClick = (inputRef) => {
    if (!isPremium) {
      alert('Le scanner de documents est disponible en version Premium.')
      return
    }
    inputRef.current?.click()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    try {
      const base64 = await fileToBase64(file)
      onScan(base64, file.type)
    } catch (err) {
      console.error('File attach error:', err)
    } finally {
      setScanning(false)
      e.target.value = ''
    }
  }

  const btnStyle = (active) => ({
    width: '46px', height: '46px',
    borderRadius: '12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: active ? 'var(--accent)' : isPremium ? 'var(--text-2)' : 'var(--text-3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    flexShrink: 0,
    position: 'relative',
  })

  const premiumBadge = !isPremium && (
    <span style={{
      position: 'absolute', top: '-4px', right: '-4px',
      background: 'var(--accent)',
      color: '#080D0A',
      fontSize: '8px',
      fontWeight: '800',
      borderRadius: '4px',
      padding: '1px 4px',
    }}>★</span>
  )

  const spinner = (
    <div style={{
      width: '16px', height: '16px',
      border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {/* Camera button */}
      <button
        onClick={() => handleClick(cameraRef)}
        disabled={scanning}
        title={isPremium ? 'Scanner avec la caméra' : 'Scanner (Premium)'}
        style={btnStyle(false)}
      >
        {scanning ? spinner : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            {premiumBadge}
          </>
        )}
      </button>

      {/* File picker button (gallery / PDF) */}
      <button
        onClick={() => handleClick(fileRef)}
        disabled={scanning}
        title={isPremium ? 'Joindre une image ou un PDF' : 'Joindre un fichier (Premium)'}
        style={btnStyle(false)}
      >
        {scanning ? spinner : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            {premiumBadge}
          </>
        )}
      </button>

      {/* OCR Progress indicator */}
      {ocrProcessing && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: 'var(--text-2)',
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            <span>Analyse OCR {ocrProgress}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
