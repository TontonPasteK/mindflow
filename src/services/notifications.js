import { supabase } from './supabase'

/**
 * Service de notifications Ebbinghaus
 * Planifie des rappels à J+1, J+3, J+7 après chaque session
 */

/**
 * Crée les rappels Ebbinghaus pour une session
 * @param {string} userId - ID de l'utilisateur
 * @param {string[]} matieres - Liste des matières travaillées
 * @param {string} resume - Résumé de la session
 */
export async function createEbbinghausReminders(userId, matieres, resume) {
  if (!matieres || matieres.length === 0) return

  const now = new Date()
  const delays = [1, 3, 7] // J+1, J+3, J+7

  for (const matiere of matieres) {
    for (const days of delays) {
      const dateEnvoi = new Date(now)
      dateEnvoi.setDate(dateEnvoi.getDate() + days)

      const contenu = `Rappel ${matiere} — ${resume.substring(0, 100)}${resume.length > 100 ? '...' : ''}`

      await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          matiere,
          contenu_rappel: contenu,
          date_envoi: dateEnvoi.toISOString(),
          statut: 'pending',
        })
    }
  }

  console.log(`[Notifications] ${delays.length * matieres.length} rappels créés pour ${userId}`)
}

/**
 * Récupère les rappels en attente pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des rappels
 */
export async function getPendingReminders(userId) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('statut', 'pending')
    .order('date_envoi', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Marque un rappel comme envoyé
 * @param {string} reminderId - ID du rappel
 */
export async function markReminderAsSent(reminderId) {
  const { error } = await supabase
    .from('reminders')
    .update({ statut: 'sent' })
    .eq('id', reminderId)

  if (error) throw error
}

/**
 * Annule un rappel
 * @param {string} reminderId - ID du rappel
 */
export async function cancelReminder(reminderId) {
  const { error } = await supabase
    .from('reminders')
    .update({ statut: 'cancelled' })
    .eq('id', reminderId)

  if (error) throw error
}

/**
 * Récupère les rappels à envoyer maintenant
 * @returns {Promise<Array>} Liste des rappels à envoyer
 */
export async function getRemindersToSend() {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('statut', 'pending')
    .lte('date_envoi', now)
    .order('date_envoi', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Envoie une notification pour un rappel
 * Pour l'instant, log uniquement. À remplacer par email/push réel.
 * @param {Object} reminder - Rappel à envoyer
 */
export async function sendReminderNotification(reminder) {
  console.log(`[Notification] Envoi rappel ${reminder.id} : ${reminder.contenu_rappel}`)

  // TODO: Intégrer avec un service d'email (SendGrid, Mailgun, etc.)
  // ou un service de push (OneSignal, Firebase Cloud Messaging)

  await markReminderAsSent(reminder.id)
}

/**
 * Traite tous les rappels en attente
 * À appeler via un cron job ou une fonction serverless
 */
export async function processPendingReminders() {
  const reminders = await getRemindersToSend()

  console.log(`[Notifications] ${reminders.length} rappels à traiter`)

  for (const reminder of reminders) {
    try {
      await sendReminderNotification(reminder)
    } catch (err) {
      console.error(`[Notifications] Erreur envoi rappel ${reminder.id}:`, err.message)
    }
  }

  return reminders.length
}
