import { supabase } from './supabase'

/**
 * Sauvegarde un message dans l'historique des conversations
 * @param {string} userId - ID de l'utilisateur
 * @param {string} sessionId - ID de la session
 * @param {string} role - 'user' ou 'assistant'
 * @param {string} content - Contenu du message
 * @param {string} subject - Matière (optionnel)
 * @param {string} avatar - Avatar utilisé (optionnel)
 */
export async function saveConversationMessage(userId, sessionId, role, content, subject = null, avatar = null) {
  try {
    const { error } = await supabase
      .from('conversation_history')
      .insert({
        user_id: userId,
        session_id: sessionId,
        role,
        content,
        subject,
        avatar,
        timestamp: new Date().toISOString()
      })

    if (error) throw error
  } catch (error) {
    console.error('Erreur sauvegarde message conversation:', error)
  }
}

/**
 * Récupère l'historique des conversations d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} limit - Nombre maximum de messages
 * @returns {Promise<Array>} Historique des conversations
 */
export async function getConversationHistory(userId, limit = 100) {
  try {
    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur récupération historique conversations:', error)
    return []
  }
}

/**
 * Récupère les conversations groupées par session
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Sessions avec leurs messages
 */
export async function getConversationSessions(userId) {
  try {
    // Récupérer tous les messages
    const messages = await getConversationHistory(userId, 500)

    // Grouper par session_id
    const sessions = {}
    messages.forEach(msg => {
      if (!sessions[msg.session_id]) {
        sessions[msg.session_id] = {
          sessionId: msg.session_id,
          subject: msg.subject,
          avatar: msg.avatar,
          startTime: msg.timestamp,
          endTime: msg.timestamp,
          messages: []
        }
      }

      // Mettre à jour les timestamps
      if (new Date(msg.timestamp) < new Date(sessions[msg.session_id].startTime)) {
        sessions[msg.session_id].startTime = msg.timestamp
      }
      if (new Date(msg.timestamp) > new Date(sessions[msg.session_id].endTime)) {
        sessions[msg.session_id].endTime = msg.timestamp
      }

      // Ajouter le message
      sessions[msg.session_id].messages.push(msg)
    })

    // Convertir en tableau et trier par date de début
    return Object.values(sessions).sort((a, b) =>
      new Date(b.startTime) - new Date(a.startTime)
    )
  } catch (error) {
    console.error('Erreur récupération sessions conversations:', error)
    return []
  }
}

/**
 * Supprime l'historique des conversations d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
export async function deleteConversationHistory(userId) {
  try {
    const { error } = await supabase
      .from('conversation_history')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Erreur suppression historique conversations:', error)
    throw error
  }
}

/**
 * Récupère les statistiques de conversation
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<object>} Statistiques
 */
export async function getConversationStats(userId) {
  try {
    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const messages = data || []
    const sessions = new Set(messages.map(m => m.session_id))
    const subjects = new Set(messages.map(m => m.subject).filter(Boolean))

    return {
      totalMessages: messages.length,
      totalSessions: sessions.size,
      totalSubjects: subjects.size,
      subjects: Array.from(subjects),
      lastActivity: messages.length > 0 ? messages[0].timestamp : null
    }
  } catch (error) {
    console.error('Erreur récupération statistiques conversations:', error)
    return {
      totalMessages: 0,
      totalSessions: 0,
      totalSubjects: 0,
      subjects: [],
      lastActivity: null
    }
  }
}
