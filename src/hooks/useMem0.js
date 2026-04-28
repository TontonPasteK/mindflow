import { useState, useEffect, useCallback } from 'react'
import {
  searchMemories,
  addMemory,
  getAllMemories,
  deleteMemory,
  updateMemory,
  buildMem0Context,
  saveSessionSummary,
  getSessionContext,
  countMemories,
  deleteAllMemories,
} from '../services/mem0'

/**
 * Hook pour gérer la mémoire long terme Mem0
 * Permet de stocker et récupérer des mémoires inter-sessions
 */
export function useMem0(userId) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [context, setContext] = useState('')

  // Charger toutes les mémoires au montage
  useEffect(() => {
    if (userId) {
      loadMemories()
    }
  }, [userId])

  /**
   * Charge toutes les mémoires de l'utilisateur
   */
  const loadMemories = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getAllMemories(userId)
      setMemories(data)
    } catch (err) {
      setError(err.message)
      console.error('Erreur chargement mémoires:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Recherche des mémoires pertinentes
   */
  const search = useCallback(async (query, limit = 5) => {
    if (!userId) return []

    setLoading(true)
    setError(null)

    try {
      const results = await searchMemories(userId, query, limit)
      return results
    } catch (err) {
      setError(err.message)
      console.error('Erreur recherche mémoires:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Ajoute une nouvelle mémoire
   */
  const add = useCallback(async (content) => {
    if (!userId) return null

    setLoading(true)
    setError(null)

    try {
      const newMemory = await addMemory(userId, content)
      // Recharger la liste
      await loadMemories()
      return newMemory
    } catch (err) {
      setError(err.message)
      console.error('Erreur ajout mémoire:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [userId, loadMemories])

  /**
   * Supprime une mémoire
   */
  const remove = useCallback(async (memoryId) => {
    setLoading(true)
    setError(null)

    try {
      const success = await deleteMemory(memoryId)
      if (success) {
        // Recharger la liste
        await loadMemories()
      }
      return success
    } catch (err) {
      setError(err.message)
      console.error('Erreur suppression mémoire:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadMemories])

  /**
   * Met à jour une mémoire
   */
  const update = useCallback(async (memoryId, content) => {
    setLoading(true)
    setError(null)

    try {
      const updatedMemory = await updateMemory(memoryId, content)
      // Recharger la liste
      await loadMemories()
      return updatedMemory
    } catch (err) {
      setError(err.message)
      console.error('Erreur mise à jour mémoire:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadMemories])

  /**
   * Construit le contexte pour une session
   */
  const loadContext = useCallback(async (subject, userName) => {
    if (!userId) return ''

    setLoading(true)
    setError(null)

    try {
      const contextText = await getSessionContext(userId, subject, userName)
      setContext(contextText)
      return contextText
    } catch (err) {
      setError(err.message)
      console.error('Erreur chargement contexte:', err)
      return ''
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Sauvegarde un résumé de session
   */
  const saveSummary = useCallback(async (subject, summary) => {
    if (!userId) return null

    setLoading(true)
    setError(null)

    try {
      const savedMemory = await saveSessionSummary(userId, subject, summary)
      // Recharger la liste
      await loadMemories()
      return savedMemory
    } catch (err) {
      setError(err.message)
      console.error('Erreur sauvegarde résumé:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [userId, loadMemories])

  /**
   * Compte le nombre total de mémoires
   */
  const count = useCallback(async () => {
    if (!userId) return 0

    try {
      return await countMemories(userId)
    } catch (err) {
      setError(err.message)
      console.error('Erreur comptage mémoires:', err)
      return 0
    }
  }, [userId])

  /**
   * Supprime toutes les mémoires (droit à l'oubli)
   */
  const clearAll = useCallback(async () => {
    if (!userId) return 0

    setLoading(true)
    setError(null)

    try {
      const deletedCount = await deleteAllMemories(userId)
      // Recharger la liste
      await loadMemories()
      return deletedCount
    } catch (err) {
      setError(err.message)
      console.error('Erreur suppression mémoires:', err)
      return 0
    } finally {
      setLoading(false)
    }
  }, [userId, loadMemories])

  /**
   * Construit le contexte Mem0 pour injection dans prompt
   */
  const buildContext = useCallback((memoriesList) => {
    return buildMem0Context(memoriesList)
  }, [])

  return {
    // État
    memories,
    loading,
    error,
    context,

    // Actions
    loadMemories,
    search,
    add,
    remove,
    update,
    loadContext,
    saveSummary,
    count,
    clearAll,
    buildContext,
  }
}
