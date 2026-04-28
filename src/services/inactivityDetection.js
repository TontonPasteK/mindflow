import { supabase } from './supabase'

const INACTIVITY_WARNING_DAYS = 3
const INACTIVITY_CRITICAL_DAYS = 5

/**
 * Enregistre l'activité quotidienne d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {object} activityData - Données d'activité
 */
export async function recordDailyActivity(userId, activityData = {}) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: existing, error: selectError } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError
    }

    if (existing) {
      // Mettre à jour l'activité existante
      const { error: updateError } = await supabase
        .from('daily_activity')
        .update({
          sessions_count: (existing.sessions_count || 0) + (activityData.sessionsCount || 0),
          messages_count: (existing.messages_count || 0) + (activityData.messagesCount || 0),
          duration_minutes: (existing.duration_minutes || 0) + (activityData.durationMinutes || 0),
          subjects: Array.from(new Set([
            ...(existing.subjects || []),
            ...(activityData.subjects || [])
          ])),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (updateError) throw updateError
    } else {
      // Créer une nouvelle entrée
      const { error: insertError } = await supabase
        .from('daily_activity')
        .insert({
          user_id: userId,
          date: today,
          sessions_count: activityData.sessionsCount || 0,
          messages_count: activityData.messagesCount || 0,
          duration_minutes: activityData.durationMinutes || 0,
          subjects: activityData.subjects || []
        })

      if (insertError) throw insertError
    }
  } catch (error) {
    console.error('Erreur enregistrement activité quotidienne:', error)
  }
}

/**
 * Calcule le nombre de jours d'inactivité
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<number>} Nombre de jours d'inactivité
 */
export async function getInactiveDays(userId) {
  try {
    const { data, error } = await supabase
      .from('daily_activity')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)

    if (error) throw error

    if (!data || data.length === 0) {
      // Pas d'activité enregistrée, considérer comme inactif depuis longtemps
      return 999
    }

    const lastActivityDate = new Date(data[0].date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diffTime = today - lastActivityDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  } catch (error) {
    console.error('Erreur calcul jours inactivité:', error)
    return 0
  }
}

/**
 * Crée une alerte d'inactivité
 * @param {string} userId - ID de l'utilisateur
 * @param {string} parentId - ID du parent
 * @param {number} daysInactive - Nombre de jours d'inactivité
 * @param {string} alertType - Type d'alerte ('warning' ou 'critical')
 */
export async function createInactivityAlert(userId, parentId, daysInactive, alertType) {
  try {
    const messages = {
      warning: `⚠️ Attention : ${daysInactive} jours sans activité. Encouragez votre enfant à travailler sur Evokia.`,
      critical: `🚨 Alerte : ${daysInactive} jours sans activité ! Il est important de maintenir la régularité pour une progression optimale.`
    }

    const { error } = await supabase
      .from('inactivity_alerts')
      .insert({
        user_id: userId,
        parent_id: parentId,
        alert_type: alertType,
        days_inactive: daysInactive,
        message: messages[alertType],
        created_at: new Date().toISOString()
      })

    if (error) throw error
  } catch (error) {
    console.error('Erreur création alerte inactivité:', error)
  }
}

/**
 * Vérifie et crée les alertes d'inactivité si nécessaire
 * @param {string} userId - ID de l'utilisateur
 * @param {string} parentId - ID du parent
 */
export async function checkAndCreateInactivityAlerts(userId, parentId) {
  try {
    const inactiveDays = await getInactiveDays(userId)

    // Vérifier si une alerte similaire existe déjà
    const { data: existingAlerts, error: alertError } = await supabase
      .from('inactivity_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('days_inactive', inactiveDays)
      .is('acknowledged_at', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (alertError) throw alertError

    // Créer une alerte si nécessaire et si aucune n'existe déjà
    if (inactiveDays >= INACTIVITY_CRITICAL_DAYS && (!existingAlerts || existingAlerts.length === 0)) {
      await createInactivityAlert(userId, parentId, inactiveDays, 'critical')
    } else if (inactiveDays >= INACTIVITY_WARNING_DAYS && (!existingAlerts || existingAlerts.length === 0)) {
      await createInactivityAlert(userId, parentId, inactiveDays, 'warning')
    }
  } catch (error) {
    console.error('Erreur vérification alertes inactivité:', error)
  }
}

/**
 * Récupère les alertes d'inactivité non reconnues pour un parent
 * @param {string} parentId - ID du parent
 * @returns {Promise<Array>} Alertes d'inactivité
 */
export async function getUnacknowledgedAlerts(parentId) {
  try {
    const { data, error } = await supabase
      .from('inactivity_alerts')
      .select(`
        *,
        users:user_id (
          prenom,
          email
        )
      `)
      .eq('parent_id', parentId)
      .is('acknowledged_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur récupération alertes inactivité:', error)
    return []
  }
}

/**
 * Reconnaît une alerte d'inactivité
 * @param {string} alertId - ID de l'alerte
 * @param {string} userId - ID de l'utilisateur qui reconnaît
 */
export async function acknowledgeAlert(alertId, userId) {
  try {
    const { error } = await supabase
      .from('inactivity_alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId
      })
      .eq('id', alertId)

    if (error) throw error
  } catch (error) {
    console.error('Erreur reconnaissance alerte:', error)
    throw error
  }
}

/**
 * Récupère les statistiques d'activité récentes
 * @param {string} userId - ID de l'utilisateur
 * @param {number} days - Nombre de jours à analyser
 * @returns {Promise<object>} Statistiques d'activité
 */
export async function getActivityStats(userId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) throw error

    const activities = data || []
    const totalSessions = activities.reduce((acc, a) => acc + (a.sessions_count || 0), 0)
    const totalMessages = activities.reduce((acc, a) => acc + (a.messages_count || 0), 0)
    const totalDuration = activities.reduce((acc, a) => acc + (a.duration_minutes || 0), 0)

    // Calculer les matières les plus travaillées
    const subjectCounts = {}
    activities.forEach(activity => {
      (activity.subjects || []).forEach(subject => {
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1
      })
    })

    const topSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([subject]) => subject)

    return {
      totalDays: activities.length,
      totalSessions,
      totalMessages,
      totalDuration,
      avgSessionsPerDay: activities.length > 0 ? (totalSessions / activities.length).toFixed(1) : 0,
      avgDurationPerDay: activities.length > 0 ? Math.round(totalDuration / activities.length) : 0,
      topSubjects,
      activities: activities.map(a => ({
        date: a.date,
        sessions: a.sessions_count,
        messages: a.messages_count,
        duration: a.duration_minutes,
        subjects: a.subjects
      }))
    }
  } catch (error) {
    console.error('Erreur récupération statistiques activité:', error)
    return {
      totalDays: 0,
      totalSessions: 0,
      totalMessages: 0,
      totalDuration: 0,
      avgSessionsPerDay: 0,
      avgDurationPerDay: 0,
      topSubjects: [],
      activities: []
    }
  }
}
