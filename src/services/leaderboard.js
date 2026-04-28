import { supabase } from './supabase'

/**
 * Génère un pseudo anonyme pour le leaderboard
 * @returns {string} Pseudo anonyme
 */
function generateAnonymousPseudo() {
  const adjectives = ['Rapide', 'Sage', 'Brillant', 'Calme', 'Dynamique', 'Curieux', 'Persévérant', 'Créatif']
  const nouns = ['Éclaireur', 'Explorateur', 'Chercheur', 'Découvreur', 'Pionnier', 'Voyageur', 'Aventurier', 'Stratège']
  const emojis = ['🌟', '⚡', '🎯', '🚀', '💫', '🔥', '⭐', '🌙']

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const emoji = emojis[Math.floor(Math.random() * emojis.length)]

  return `${emoji} ${adj}${noun}`
}

/**
 * Crée ou met à jour le profil leaderboard d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {object} stats - Statistiques de l'utilisateur
 */
export async function updateLeaderboardProfile(userId, stats = {}) {
  try {
    // Vérifier si le profil existe déjà
    const { data: existingProfile, error: selectError } = await supabase
      .from('leaderboard_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError
    }

    if (existingProfile) {
      // Mettre à jour le profil existant
      const { error: updateError } = await supabase
        .from('leaderboard_profiles')
        .update({
          total_sessions: stats.totalSessions || existingProfile.total_sessions,
          total_quiz_victories: stats.quizVictories || existingProfile.total_quiz_victories,
          total_study_time: stats.totalStudyTime || existingProfile.total_study_time,
          consistency_streak: stats.consistencyStreak || existingProfile.consistency_streak,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) throw updateError
    } else {
      // Créer un nouveau profil
      const { error: insertError } = await supabase
        .from('leaderboard_profiles')
        .insert({
          user_id: userId,
          anonymous_pseudo: generateAnonymousPseudo(),
          total_sessions: stats.totalSessions || 0,
          total_quiz_victories: stats.quizVictories || 0,
          total_study_time: stats.totalStudyTime || 0,
          consistency_streak: stats.consistencyStreak || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })

      if (insertError) throw insertError
    }
  } catch (error) {
    console.error('Erreur mise à jour profil leaderboard:', error)
  }
}

/**
 * Calcule le score de leaderboard pour un profil
 * @param {object} profile - Profil utilisateur
 * @returns {number} Score calculé
 */
function calculateLeaderboardScore(profile) {
  const sessionWeight = 10
  const quizVictoryWeight = 50
  const studyTimeWeight = 0.5 // par minute
  const consistencyWeight = 20

  return (
    (profile.total_sessions || 0) * sessionWeight +
    (profile.total_quiz_victories || 0) * quizVictoryWeight +
    (profile.total_study_time || 0) * studyTimeWeight +
    (profile.consistency_streak || 0) * consistencyWeight
  )
}

/**
 * Récupère le leaderboard anonyme
 * @param {number} limit - Nombre d'entrées à retourner
 * @returns {Promise<Array>} Leaderboard
 */
export async function getLeaderboard(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_profiles')
      .select('*')
      .order('last_activity_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Calculer les scores et trier
    const profiles = data || []
    const scoredProfiles = profiles.map(profile => ({
      ...profile,
      score: calculateLeaderboardScore(profile)
    }))

    // Trier par score décroissant
    scoredProfiles.sort((a, b) => b.score - a.score)

    // Retourner les N premiers avec rang
    return scoredProfiles.slice(0, limit).map((profile, index) => ({
      rank: index + 1,
      anonymous_pseudo: profile.anonymous_pseudo,
      score: Math.round(profile.score),
      total_sessions: profile.total_sessions,
      total_quiz_victories: profile.total_quiz_victories,
      consistency_streak: profile.consistency_streak,
      isCurrentUser: false // sera mis à jour par le composant
    }))
  } catch (error) {
    console.error('Erreur récupération leaderboard:', error)
    return []
  }
}

/**
 * Récupère le rang d'un utilisateur dans le leaderboard
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<number>} Rang de l'utilisateur
 */
export async function getUserLeaderboardRank(userId) {
  try {
    const leaderboard = await getLeaderboard(1000)

    // Trouver le profil de l'utilisateur
    const { data: userProfile } = await supabase
      .from('leaderboard_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!userProfile) return null

    const userScore = calculateLeaderboardScore(userProfile)

    // Compter combien de profils ont un score supérieur
    const rank = leaderboard.filter(profile => profile.score > userScore).length + 1

    return rank
  } catch (error) {
    console.error('Erreur récupération rang utilisateur:', error)
    return null
  }
}

/**
 * Récupère les statistiques de leaderboard pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<object>} Statistiques
 */
export async function getUserLeaderboardStats(userId) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    if (!data) return null

    const rank = await getUserLeaderboardRank(userId)

    return {
      anonymous_pseudo: data.anonymous_pseudo,
      rank,
      score: Math.round(calculateLeaderboardScore(data)),
      total_sessions: data.total_sessions,
      total_quiz_victories: data.total_quiz_victories,
      total_study_time: data.total_study_time,
      consistency_streak: data.consistency_streak
    }
  } catch (error) {
    console.error('Erreur récupération stats leaderboard:', error)
    return null
  }
}

/**
 * Enregistre une victoire de quiz pour le leaderboard
 * @param {string} userId - ID de l'utilisateur
 */
export async function recordQuizVictory(userId) {
  try {
    const { data: profile } = await supabase
      .from('leaderboard_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profile) {
      await supabase
        .from('leaderboard_profiles')
        .update({
          total_quiz_victories: (profile.total_quiz_victories || 0) + 1,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    }
  } catch (error) {
    console.error('Erreur enregistrement victoire quiz:', error)
  }
}

/**
 * Enregistre une session d'étude pour le leaderboard
 * @param {string} userId - ID de l'utilisateur
 * @param {number} duration - Durée en minutes
 */
export async function recordStudySession(userId, duration) {
  try {
    const { data: profile } = await supabase
      .from('leaderboard_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profile) {
      await supabase
        .from('leaderboard_profiles')
        .update({
          total_sessions: (profile.total_sessions || 0) + 1,
          total_study_time: (profile.total_study_time || 0) + duration,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    }
  } catch (error) {
    console.error('Erreur enregistrement session étude:', error)
  }
}

/**
 * Met à jour la streak de régularité
 * @param {string} userId - ID de l'utilisateur
 * @param {number} streak - Nouvelle streak
 */
export async function updateConsistencyStreak(userId, streak) {
  try {
    const { data: profile } = await supabase
      .from('leaderboard_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profile) {
      await supabase
        .from('leaderboard_profiles')
        .update({
          consistency_streak: streak,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    }
  } catch (error) {
    console.error('Erreur mise à jour streak:', error)
  }
}
