import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function VictoryModal({ victory, onClose }) {
  if (!victory) return null

  return (
    <Modal isOpen={!!victory} onClose={onClose} maxWidth="400px">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '16px',
        padding: '8px 0',
      }}>
        <div style={{ fontSize: '52px', animation: 'float 2s ease-in-out infinite' }}>🏆</div>

        <h3 style={{
          fontFamily: 'var(--f-title)',
          fontSize: '22px',
          color: 'var(--text)',
        }}>
          Victoire enregistrée !
        </h3>

        <p style={{
          fontSize: '15px',
          color: 'var(--text-2)',
          lineHeight: '1.6',
          padding: '12px 16px',
          background: 'var(--accent-dim)',
          border: '1px solid var(--border-h)',
          borderRadius: 'var(--r-md)',
          width: '100%',
        }}>
          "{victory.texte}"
        </p>

        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          Ajouté à ton journal de victoires
        </p>

        <Button onClick={onClose} fullWidth>
          Continuer
        </Button>
      </div>
    </Modal>
  )
}
