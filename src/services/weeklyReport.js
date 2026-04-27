import { supabase } from './supabase'

/**
 * Génère et envoie un rapport hebdomadaire aux parents
 * @param {string} childId - ID de l'enfant
 * @param {string} parentEmail - Email du parent
 */
export async function sendWeeklyParentReport(childId, parentEmail) {
  try {
    // Récupérer les données de l'enfant
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', childId)
      .single()

    if (!profile) {
      throw new Error('Profil non trouvé')
    }

    // Récupérer les sessions de la semaine dernière
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', childId)
      .gte('started_at', oneWeekAgo.toISOString())
      .order('started_at', { ascending: false })

    // Récupérer les victoires de la semaine
    const { data: victories } = await supabase
      .from('victories')
      .select('*')
      .eq('user_id', childId)
      .gte('created_at', oneWeekAgo.toISOString())

    // Calculer les statistiques
    const totalSessions = sessions?.length || 0
    const totalMinutes = sessions?.reduce((acc, s) => acc + (s.duree_minutes || 0), 0) || 0
    const totalVictories = victories?.length || 0

    // Générer le rapport
    const report = generateWeeklyReport(profile, sessions, victories, {
      totalSessions,
      totalMinutes,
      totalVictories
    })

    // Envoyer l'email via l'API
    const response = await fetch('/api/weekly-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentEmail,
        childName: profile.prenom || 'Votre enfant',
        report
      })
    })

    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi de l\'email')
    }

    return { success: true, report }
  } catch (error) {
    console.error('Erreur rapport hebdomadaire:', error)
    throw error
  }
}

/**
 * Génère le contenu du rapport hebdomadaire
 */
function generateWeeklyReport(profile, sessions, victories, stats) {
  const childName = profile.prenom || 'Votre enfant'
  const streak = profile.streak || 0
  const points = profile.points || 0

  // Analyser les matières travaillées
  const matieresWorked = {}
  sessions?.forEach(session => {
    (session.matieres || []).forEach(matiere => {
      matieresWorked[matiere] = (matieresWorked[matiere] || 0) + 1
    })
  })

  const topMatieres = Object.entries(matieresWorked)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([matiere]) => matiere)

  // Générer le message
  return {
    subject: `📊 Rapport hebdomadaire - ${childName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1D9E75 0%, #0F5C3D 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Rapport Hebdomadaire</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${childName}</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">📈 Statistiques de la semaine</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #1D9E75;">${stats.totalSessions}</div>
              <div style="color: #666; font-size: 14px;">Sessions</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #1D9E75;">${stats.totalMinutes}</div>
              <div style="color: #666; font-size: 14px;">Minutes</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #1D9E75;">${stats.totalVictories}</div>
              <div style="color: #666; font-size: 14px;">Victoires</div>
            </div>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">🔥 Progression</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: bold; color: #F59E0B;">${streak}</div>
              <div style="color: #666; font-size: 14px;">Jours consécutifs</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: bold; color: #1D9E75;">${points}</div>
              <div style="color: #666; font-size: 14px;">Points accumulés</div>
            </div>
          </div>
        </div>

        ${topMatieres.length > 0 ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">📚 Matières travaillées</h2>
          <div style="margin-top: 15px;">
            ${topMatieres.map(m => `
              <div style="display: inline-block; padding: 8px 16px; background: white; border-radius: 20px; margin: 5px; border: 1px solid #1D9E75; color: #1D9E75;">
                ${m}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #1D9E75;">
          <p style="margin: 0; color: #2E7D32; font-size: 14px;">
            💡 <strong>Conseil :</strong> Encouragez ${childName} à continuer ses efforts ! La régularité est la clé de la réussite.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>Ce rapport est généré automatiquement par Evokia.</p>
          <p>Vous pouvez consulter plus de détails dans votre tableau de bord parent.</p>
        </div>
      </div>
    `,
    text: `
Rapport Hebdomadaire - ${childName}

📈 Statistiques de la semaine :
- Sessions : ${stats.totalSessions}
- Temps total : ${stats.totalMinutes} minutes
- Victoires : ${stats.totalVictories}

🔥 Progression :
- Jours consécutifs : ${streak}
- Points accumulés : ${points}

${topMatieres.length > 0 ? `📚 Matières travaillées : ${topMatieres.join(', ')}` : ''}

💡 Conseil : Encouragez ${childName} à continuer ses efforts ! La régularité est la clé de la réussite.

---
Ce rapport est généré automatiquement par Evokia.
    `
  }
}

/**
 * Planifie l'envoi des rapports hebdomadaires pour tous les parents
 * Cette fonction doit être appelée par un cron job
 */
export async function scheduleWeeklyReports() {
  try {
    // Récupérer tous les liens parent-enfant
    const { data: links } = await supabase
      .from('parent_child_links')
      .select('parent_id, child_id')

    if (!links || links.length === 0) {
      return { success: true, message: 'Aucun lien parent-enfant trouvé' }
    }

    // Récupérer les emails des parents
    const parentIds = [...new Set(links.map(l => l.parent_id))]
    const { data: parents } = await supabase
      .from('users')
      .select('id, email')
      .in('id', parentIds)

    const parentEmails = {}
    parents?.forEach(parent => {
      parentEmails[parent.id] = parent.email
    })

    // Envoyer les rapports pour chaque enfant
    const results = []
    for (const link of links) {
      const parentEmail = parentEmails[link.parent_id]
      if (parentEmail) {
        try {
          const result = await sendWeeklyParentReport(link.child_id, parentEmail)
          results.push({ childId: link.child_id, success: true })
        } catch (error) {
          results.push({ childId: link.child_id, success: false, error: error.message })
        }
      }
    }

    return {
      success: true,
      total: links.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  } catch (error) {
    console.error('Erreur planification rapports:', error)
    throw error
  }
}
