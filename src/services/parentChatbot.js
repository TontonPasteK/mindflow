import { supabase } from './supabase'

/**
 * Envoie un message au chatbot parent
 * @param {string} parentId - ID du parent
 * @param {string} childId - ID de l'enfant
 * @param {string} message - Message du parent
 * @returns {Promise<object>} Réponse de l'IA
 */
export async function sendParentChatMessage(parentId, childId, message) {
  try {
    // Récupérer le profil de l'enfant
    const { data: childProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', childId)
      .single()

    if (profileError) throw profileError

    // Récupérer les statistiques d'activité
    const { data: activityStats } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', childId)
      .order('date', { ascending: false })
      .limit(30)

    // Récupérer les résultats de quiz
    const { data: quizResults } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', childId)
      .order('completed_at', { ascending: false })
      .limit(10)

    // Récupérer les révisions Ebbinghaus
    const { data: ebbinghausReviews } = await supabase
      .from('ebbinghaus_reviews')
      .select('*')
      .eq('user_id', childId)

    // Construire le contexte pour l'IA
    const context = {
      childProfile: {
        prenom: childProfile.prenom,
        niveau_scolaire: childProfile.niveau_scolaire,
        avatar: childProfile.avatar,
        visuel: childProfile.visuel,
        auditif: childProfile.auditif,
        kinesthesique: childProfile.kinesthesique,
        intelligence_dominante: childProfile.intelligence_dominante,
        passions: childProfile.passions,
        projet_de_sens: childProfile.projet_de_sens,
        onboarding_complete: childProfile.onboarding_complete,
        seance_drMind: childProfile.seance_drMind
      },
      activityStats: {
        totalDays: activityStats?.length || 0,
        totalSessions: activityStats?.reduce((acc, day) => acc + (day.sessions_count || 0), 0) || 0,
        totalDuration: activityStats?.reduce((acc, day) => acc + (day.total_duration || 0), 0) || 0,
        avgDurationPerDay: activityStats?.length > 0
          ? Math.round(activityStats.reduce((acc, day) => acc + (day.total_duration || 0), 0) / activityStats.length)
          : 0
      },
      quizResults: {
        totalQuizzes: quizResults?.length || 0,
        avgScore: quizResults?.length > 0
          ? Math.round(quizResults.reduce((acc, quiz) => acc + (quiz.score || 0), 0) / quizResults.length)
          : 0,
        recentQuizzes: quizResults?.slice(0, 5).map(quiz => ({
          subject: quiz.subject,
          score: quiz.score,
          completed_at: quiz.completed_at
        })) || []
      },
      ebbinghausStats: {
        totalNotions: ebbinghausReviews?.length || 0,
        avgMastery: ebbinghausReviews?.length > 0
          ? Math.round(ebbinghausReviews.reduce((acc, r) => acc + (r.mastery_level || 0), 0) / ebbinghausReviews.length)
          : 0
      }
    }

    // Construire le prompt système pour le chatbot parent
    const systemPrompt = `Tu es l'assistant parent de Evokia. Ton rôle est d'aider les parents à comprendre les progrès, le profil cognitif et les recommandations pour leur enfant.

CONTEXTE ENFANT :
Prénom : ${context.childProfile.prenom}
Niveau scolaire : ${context.childProfile.niveau_scolaire}
Avatar attribué : ${context.childProfile.avatar}
Profil cognitif : ${context.childProfile.visuel}% visuel, ${context.childProfile.auditif}% auditif, ${context.childProfile.kinesthesique}% kinesthésique
Intelligence dominante : ${context.childProfile.intelligence_dominante}
Passions : ${context.childProfile.passions}
Projet de sens : ${context.childProfile.projet_de_sens}

STATISTIQUES D'ACTIVITÉ :
Jours d'activité : ${context.activityStats.totalDays}
Sessions totales : ${context.activityStats.totalSessions}
Temps d'étude total : ${Math.round(context.activityStats.totalDuration / 60)} minutes
Durée moyenne par jour : ${context.activityStats.avgDurationPerDay} minutes

RÉSULTATS QUIZ :
Quiz complétés : ${context.quizResults.totalQuizzes}
Score moyen : ${context.quizResults.avgScore}%

RÉVISIONS EBBINGHAUS :
Notions suivies : ${context.ebbinghausStats.totalNotions}
Maîtrise moyenne : ${context.ebbinghausStats.avgMastery}%

RÈGLES :
- Réponds de manière claire et encourageante
- Explique les concepts pédagogiques en termes simples pour les parents
- Donne des recommandations concrètes basées sur le profil de l'enfant
- Valorise les progrès, même petits
- Propose des actions spécifiques que le parent peut faire
- 3 phrases maximum par réponse
- Parle naturellement, sans markdown ni listes à puces`

    // Appeler l'API chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error('Erreur lors de l\'appel à l\'API chat')
    }

    const data = await response.json()

    // Sauvegarder la conversation
    await saveParentChatMessage(parentId, childId, message, data.content)

    return {
      message: data.content,
      context
    }
  } catch (error) {
    console.error('Erreur envoi message parent chatbot:', error)
    throw error
  }
}

/**
 * Sauvegarde un message de conversation parent
 * @param {string} parentId - ID du parent
 * @param {string} childId - ID de l'enfant
 * @param {string} userMessage - Message du parent
 * @param {string} aiResponse - Réponse de l'IA
 */
async function saveParentChatMessage(parentId, childId, userMessage, aiResponse) {
  try {
    const { error } = await supabase
      .from('parent_chat_history')
      .insert({
        parent_id: parentId,
        child_id: childId,
        user_message: userMessage,
        ai_response: aiResponse,
        created_at: new Date().toISOString()
      })

    if (error) throw error
  } catch (error) {
    console.error('Erreur sauvegarde message parent chatbot:', error)
  }
}

/**
 * Récupère l'historique des conversations parent
 * @param {string} parentId - ID du parent
 * @param {string} childId - ID de l'enfant
 * @param {number} limit - Nombre de messages à récupérer
 * @returns {Promise<Array>} Historique des conversations
 */
export async function getParentChatHistory(parentId, childId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('parent_chat_history')
      .select('*')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).reverse()
  } catch (error) {
    console.error('Erreur récupération historique parent chatbot:', error)
    return []
  }
}

/**
 * Supprime l'historique des conversations parent
 * @param {string} parentId - ID du parent
 * @param {string} childId - ID de l'enfant
 */
export async function clearParentChatHistory(parentId, childId) {
  try {
    const { error } = await supabase
      .from('parent_chat_history')
      .delete()
      .eq('parent_id', parentId)
      .eq('child_id', childId)

    if (error) throw error
  } catch (error) {
    console.error('Erreur suppression historique parent chatbot:', error)
    throw error
  }
}

/**
 * Récupère les statistiques de conversation parent
 * @param {string} parentId - ID du parent
 * @param {string} childId - ID de l'enfant
 * @returns {Promise<object>} Statistiques
 */
export async function getParentChatStats(parentId, childId) {
  try {
    const { data, error } = await supabase
      .from('parent_chat_history')
      .select('*')
      .eq('parent_id', parentId)
      .eq('child_id', childId)

    if (error) throw error

    const messages = data || []
    const today = new Date().toISOString().split('T')[0]

    const messagesToday = messages.filter(m => m.created_at.startsWith(today))

    return {
      totalMessages: messages.length,
      messagesToday: messagesToday.length,
      firstMessageDate: messages.length > 0 ? messages[0].created_at : null
    }
  } catch (error) {
    console.error('Erreur récupération stats parent chatbot:', error)
    return {
      totalMessages: 0,
      messagesToday: 0,
      firstMessageDate: null
    }
  }
}
