import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useMem0 } from '../../hooks/useMem0'
import { getAllMemories, deleteMemory } from '../../services/mem0'

/**
 * Composant pour visualiser et gérer les mémoires Mem0
 * Affiche l'historique des mémoires inter-sessions
 */
export default function MemoryViewer() {
  const { user } = useAuth()
  const { memories, loading, error, remove, clearAll } = useMem0(user?.id)
  const [filter, setFilter] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const filteredMemories = memories.filter(m =>
    (m.memory || m.content || '').toLowerCase().includes(filter.toLowerCase())
  )

  const handleDelete = async (memoryId) => {
    setDeletingId(memoryId)
    await remove(memoryId)
    setDeletingId(null)
  }

  const handleClearAll = async () => {
    await clearAll()
    setShowConfirm(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMemoryContent = (memory) => {
    return memory.memory || memory.content || 'Contenu vide'
  }

  if (!user) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-3)',
      }}>
        Connecte-toi pour voir tes mémoires
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--f-title)',
            fontSize: '20px',
            margin: '0 0 8px 0',
            color: 'var(--text)',
          }}>
            🧠 Mes Mémoires
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-2)',
            margin: 0,
          }}>
            {memories.length} mémoire{memories.length > 1 ? 's' : ''} stockée{memories.length > 1 ? 's' : ''}
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
              minWidth: '200px',
            }}
          />

          {memories.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
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
              Tout effacer
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px',
          background: 'var(--error-dim)',
          border: '1px solid var(--error)',
          borderRadius: '8px',
          color: 'var(--error)',
          fontSize: '14px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-3)',
        }}>
          Chargement des mémoires...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredMemories.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-3)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
            {filter ? 'Aucune mémoire trouvée' : 'Aucune mémoire stockée'}
          </p>
          <p style={{ fontSize: '14px' }}>
            {filter
              ? 'Essaie une autre recherche'
              : 'Tes mémoires inter-sessions apparaîtront ici après chaque session'}
          </p>
        </div>
      )}

      {/* Memories list */}
      {!loading && filteredMemories.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              style={{
                padding: '16px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                position: 'relative',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '8px',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-2)',
                    margin: '0 0 8px 0',
                    fontStyle: 'italic',
                  }}>
                    {formatDate(memory.created_at || memory.metadata?.created_at)}
                  </p>
                  <p style={{
                    fontSize: '15px',
                    color: 'var(--text)',
                    margin: 0,
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {getMemoryContent(memory)}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(memory.id)}
                  disabled={deletingId === memory.id}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--error-dim)',
                    border: '1px solid var(--error)',
                    borderRadius: '6px',
                    color: 'var(--error)',
                    fontSize: '12px',
                    cursor: deletingId === memory.id ? 'not-allowed' : 'pointer',
                    opacity: deletingId === memory.id ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (deletingId !== memory.id) {
                      e.currentTarget.style.background = 'var(--error)'
                      e.currentTarget.style.color = 'white'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--error-dim)'
                    e.currentTarget.style.color = 'var(--error)'
                  }}
                >
                  {deletingId === memory.id ? '...' : 'Supprimer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <h3 style={{
              fontFamily: 'var(--f-title)',
              fontSize: '18px',
              margin: '0 0 12px 0',
              color: 'var(--text)',
            }}>
              ⚠️ Confirmation
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text)',
              marginBottom: '20px',
            }}>
              Es-tu sûr de vouloir supprimer toutes tes mémoires ? Cette action est irréversible.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleClearAll}
                style={{
                  padding: '8px 16px',
                  background: 'var(--error)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Supprimer tout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
