import { supabase } from './supabase'

/**
 * Service Mem0 - Mémoire long terme inter-sessions
 * Permet de stocker et récupérer des mémoires contextuelles entre les sessions
 */

const MEM0_API_URL = 'https://api.mem0.ai/v1'

/**
 * Récupère les mémoires d'un utilisateur pour une requête donnée
 * @param {string} userId - ID de l'utilisateur
 * @param {string} query - Requête pour filtrer les mémoires
 * @param {number} limit - Nombre maximum de mémoires à récupérer
 * @returns {Promise<Array>} Liste des mémoires trouvées
 */
export async function searchMemories(userId, query, limit = 5) {
  try {
    const response = await fetch(`${MEM0_API_URL}/memories/search/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        user_id: userId,
        limit,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erreur Mem0 search: ${response.status}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Erreur recherche mémoires Mem0:', error)
    return []
  }
}

/**
 * Ajoute une nouvelle mémoire pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string|Array} content - Contenu de la mémoire (texte ou tableau de messages)
 * @returns {Promise<Object>} Mémoire créée
 */
export async function addMemory(userId, content) {
  try {
    const response = await fetch(`${MEM0_API_URL}/memories/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: Array.isArray(content) ? content : [{ role: 'user', content }],
        user_id: userId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erreur Mem0 add: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erreur ajout mémoire Mem0:', error)
    throw error
  }
}

/**
 * Récupère toutes les mémoires d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste de toutes les mémoires
 */
export async function getAllMemories(userId) {
  try {
    const response = await fetch(`${MEM0_API_URL}/memories/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Erreur Mem0 get all: ${response.status}`)
    }

    const data = await response.json()
    // Filtrer par user_id côté client si l'API ne le fait pas
    return data.filter(m => m.user_id === userId) || []
  } catch (error) {
    console.error('Erreur récupération mémoires Mem0:', error)
    return []
  }
}

/**
 * Supprime une mémoire spécifique
 * @param {string} memoryId - ID de la mémoire à supprimer
 * @returns {Promise<boolean>} True si supprimée avec succès
 */
export async function deleteMemory(memoryId) {
  try {
    const response = await fetch(`${MEM0_API_URL}/memories/${memoryId}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Erreur Mem0 delete: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error('Erreur suppression mémoire Mem0:', error)
    return false
  }
}

/**
 * Met à jour une mémoire existante
 * @param {string} memoryId - ID de la mémoire à mettre à jour
 * @param {string} content - Nouveau contenu de la mémoire
 * @returns {Promise<Object>} Mémoire mise à jour
 */
export async function updateMemory(memoryId, content) {
  try {
    const response = await fetch(`${MEM0_API_URL}/memories/${memoryId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erreur Mem0 update: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erreur mise à jour mémoire Mem0:', error)
    throw error
  }
}

/**
 * Construit l'injection de contexte Mem0 pour les prompts IA
 * @param {Array} memories - Liste des mémoires à injecter
 * @returns {string} Texte formaté pour injection dans le prompt
 */
export function buildMem0Context(memories) {
  if (!memories || memories.length === 0) {
    return ''
  }

  const memoryLines = memories
    .map(m => `- ${m.memory || m.content}`)
    .join('\n')

  return `\nMÉMOIRE INTER-SESSIONS :\n${memoryLines}`
}

/**
 * Sauvegarde un résumé de session dans Mem0
 * @param {string} userId - ID de l'utilisateur
 * @param {string} subject - Matière ou sujet de la session
 * @param {string} summary - Résumé structuré de la session
 * @returns {Promise<Object>} Mémoire créée
 */
export async function saveSessionSummary(userId, subject, summary) {
  const content = `Session ${subject}:\n${summary}`
  return addMemory(userId, content)
}

/**
 * Récupère le contexte pertinent pour une nouvelle session
 * @param {string} userId - ID de l'utilisateur
 * @param {string} subject - Matière ou sujet de la session
 * @param {string} userName - Nom de l'utilisateur (optionnel)
 * @returns {Promise<string>} Contexte formaté pour le prompt
 */
export async function getSessionContext(userId, subject, userName) {
  const query = [userName, subject].filter(Boolean).join(' ') || 'session'
  const memories = await searchMemories(userId, query, 5)
  return buildMem0Context(memories)
}

/**
 * Compte le nombre total de mémoires d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<number>} Nombre de mémoires
 */
export async function countMemories(userId) {
  const memories = await getAllMemories(userId)
  return memories.length
}

/**
 * Supprime toutes les mémoires d'un utilisateur (droit à l'oubli)
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<number>} Nombre de mémoires supprimées
 */
export async function deleteAllMemories(userId) {
  const memories = await getAllMemories(userId)
  let deletedCount = 0

  for (const memory of memories) {
    const success = await deleteMemory(memory.id)
    if (success) deletedCount++
  }

  return deletedCount
}
