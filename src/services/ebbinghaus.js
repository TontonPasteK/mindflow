import { supabase } from './supabase'

// Intervalles Ebbinghaus (en jours)
const EBBINGHAUS_INTERVALS = [1, 3, 7, 14, 30]

/**
 * Ajoute une notion à suivre avec Ebbinghaus
 * @param {string} userId - ID de l'utilisateur
 * @param {string} notion - Notion à réviser
 * @param {string} subject - Matière
 * @param {string} sessionId - ID de la session
 */
export async function addEbbinghausReview(userId, notion, subject, sessionId) {
  try {
    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + EBBINGHAUS_INTERVALS[0])

    const { error } = await supabase
      .from('ebbinghaus_reviews')
      .insert({
        user_id: userId,
        notion,
        subject,
        session_id: sessionId,
        initial_learned_at: new Date().toISOString(),
        next_review_at: nextReviewDate.toISOString(),
        review_stage: 0,
        reviews_completed: 0,
        mastery_level: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) throw error
  } catch (error) {
    console.error('Erreur ajout révision Ebbinghaus:', error)
  }
}

/**
 * Récupère les révisions à faire pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Révisions à faire
 */
export async function getDueReviews(userId) {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('ebbinghaus_reviews')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur récupération révisions à faire:', error)
    return []
  }
}

/**
 * Récupère toutes les révisions Ebbinghaus d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Toutes les révisions
 */
export async function getAllEbbinghausReviews(userId) {
  try {
    const { data, error } = await supabase
      .from('ebbinghaus_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('next_review_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur récupération révisions Ebbinghaus:', error)
    return []
  }
}

/**
 * Marque une révision comme complétée
 * @param {string} reviewId - ID de la révision
 * @param {number} successLevel - Niveau de succès (0-100)
 */
export async function completeReview(reviewId, successLevel = 100) {
  try {
    const { data: review, error: selectError } = await supabase
      .from('ebbinghaus_reviews')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (selectError) throw selectError

    const currentStage = review.review_stage || 0
    const nextStage = currentStage + 1

    // Calculer la prochaine date de révision
    const nextReviewDate = new Date()
    if (nextStage < EBBINGHAUS_INTERVALS.length) {
      nextReviewDate.setDate(nextReviewDate.getDate() + EBBINGHAUS_INTERVALS[nextStage])
    } else {
      // Après le dernier intervalle, réviser tous les 30 jours
      nextReviewDate.setDate(nextReviewDate.getDate() + 30)
    }

    // Mettre à jour le niveau de maîtrise
    const currentMastery = review.mastery_level || 0
    const newMastery = Math.min(100, Math.round((currentMastery + successLevel) / 2))

    const { error: updateError } = await supabase
      .from('ebbinghaus_reviews')
      .update({
        next_review_at: nextReviewDate.toISOString(),
        review_stage: nextStage,
        reviews_completed: (review.reviews_completed || 0) + 1,
        last_reviewed_at: new Date().toISOString(),
        mastery_level: newMastery,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)

    if (updateError) throw updateError
  } catch (error) {
    console.error('Erreur complétion révision:', error)
    throw error
  }
}

/**
 * Supprime une révision Ebbinghaus
 * @param {string} reviewId - ID de la révision
 */
export async function deleteEbbinghausReview(reviewId) {
  try {
    const { error } = await supabase
      .from('ebbinghaus_reviews')
      .delete()
      .eq('id', reviewId)

    if (error) throw error
  } catch (error) {
    console.error('Erreur suppression révision:', error)
    throw error
  }
}

/**
 * Récupère les statistiques Ebbinghaus
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<object>} Statistiques
 */
export async function getEbbinghausStats(userId) {
  try {
    const { data, error } = await supabase
      .from('ebbinghaus_reviews')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const reviews = data || []
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const dueReviews = reviews.filter(r => new Date(r.next_review_at) <= now)
    const completedToday = reviews.filter(r =>
      r.last_reviewed_at && r.last_reviewed_at.startsWith(today)
    )

    const totalReviews = reviews.reduce((acc, r) => acc + (r.reviews_completed || 0), 0)
    const avgMastery = reviews.length > 0
      ? Math.round(reviews.reduce((acc, r) => acc + (r.mastery_level || 0), 0) / reviews.length)
      : 0

    // Compter par matière
    const subjectCounts = {}
    reviews.forEach(r => {
      subjectCounts[r.subject] = (subjectCounts[r.subject] || 0) + 1
    })

    return {
      totalNotions: reviews.length,
      dueReviews: dueReviews.length,
      completedToday: completedToday.length,
      totalReviews,
      avgMastery,
      subjectCounts
    }
  } catch (error) {
    console.error('Erreur récupération statistiques Ebbinghaus:', error)
    return {
      totalNotions: 0,
      dueReviews: 0,
      completedToday: 0,
      totalReviews: 0,
      avgMastery: 0,
      subjectCounts: {}
    }
  }
}

/**
 * Récupère le calendrier des révisions pour les 30 prochains jours
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<object>} Calendrier des révisions
 */
export async function getReviewCalendar(userId) {
  try {
    const { data, error } = await supabase
      .from('ebbinghaus_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('next_review_at', { ascending: true })

    if (error) throw error

    const reviews = data || []
    const calendar = {}

    // Initialiser les 30 prochains jours
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      calendar[dateKey] = []
    }

    // Remplir le calendrier avec les révisions
    reviews.forEach(review => {
      const reviewDate = new Date(review.next_review_at)
      const dateKey = reviewDate.toISOString().split('T')[0]

      if (calendar[dateKey]) {
        calendar[dateKey].push({
          id: review.id,
          notion: review.notion,
          subject: review.subject,
          masteryLevel: review.mastery_level || 0,
          reviewStage: review.review_stage || 0
        })
      }
    })

    return calendar
  } catch (error) {
    console.error('Erreur récupération calendrier révisions:', error)
    return {}
  }
}
