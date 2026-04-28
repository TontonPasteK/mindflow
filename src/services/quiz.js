import { supabase } from './supabase'
import { buildDrMindPrompt, buildFreePrompt } from './prompts'
import { chatWithAI } from './chat'

/**
 * Génère des questions de quiz personnalisées
 * @param {string} subject - Matière
 * @param {string} level - Niveau scolaire
 * @param {number} count - Nombre de questions
 * @param {object} profile - Profil utilisateur (optionnel pour personnalisation)
 * @returns {Promise<Array>} Questions de quiz
 */
export async function generateQuizQuestions(subject, level, count, profile = null) {
  try {
    // Construire le prompt pour générer des questions
    const prompt = buildQuizPrompt(subject, level, count, profile)

    // Appeler l'IA pour générer les questions
    const response = await chatWithAI(
      prompt,
      profile ? 'premium' : 'free',
      profile
    )

    // Parser la réponse JSON
    const questions = parseQuizResponse(response)

    return questions
  } catch (error) {
    console.error('Erreur génération questions quiz:', error)
    throw error
  }
}

/**
 * Construit le prompt pour générer des questions de quiz
 */
function buildQuizPrompt(subject, level, count, profile) {
  let prompt = `Tu es un enseignant expert qui prépare des quiz de révision pour un élève de ${level} en ${subject}.

Génère ${count} questions à choix multiples (QCM) avec 4 options chacune.

Pour chaque question, fournis :
1. La question (claire et précise)
2. Le niveau de difficulté (Facile, Moyen, Difficile)
3. 4 options de réponse (A, B, C, D)
4. La bonne réponse
5. Une explication courte de pourquoi c'est la bonne réponse

Les questions doivent couvrir différents niveaux de la taxonomie de Bloom :
- Reconnaître : identifier des concepts de base
- Appliquer : utiliser des connaissances dans des situations simples
- Transférer : adapter des connaissances à des situations nouvelles

Format de réponse attendu (JSON) :
\`\`\`json
[
  {
    "question": "Texte de la question",
    "level": "Facile|Moyen|Difficile",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Explication courte"
  }
]
\`\`\``

  // Ajouter la personnalisation si profil disponible
  if (profile) {
    prompt += `\n\nPersonnalisation pour l'élève :
- Profil visuel : ${profile.visuel}%
- Profil auditif : ${profile.auditif}%
- Profil kinesthésique : ${profile.kinesthesique}%
- Passions : ${profile.passions || 'Non spécifié'}
- Intelligence dominante : ${profile.intelligence_dominante || 'Non spécifié'}

Adapte le style des questions :
- Si profil visuel dominant : utilise des descriptions visuelles, des analogies imagées
- Si profil auditif dominant : utilise des exemples concrets, des histoires
- Si profil kinesthésique dominant : utilise des situations pratiques, des mises en situation
- Intègre les passions de l'élève quand c'est pertinent
- Adapte le niveau de langage selon son intelligence dominante`
  }

  return prompt
}

/**
 * Parse la réponse de l'IA pour extraire les questions
 */
function parseQuizResponse(response) {
  try {
    // Essayer d'extraire le JSON de la réponse
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                      response.match(/\[[\s\S]*\]/)

    if (!jsonMatch) {
      throw new Error('Format de réponse invalide')
    }

    const jsonString = jsonMatch[1] || jsonMatch[0]
    const questions = JSON.parse(jsonString)

    // Valider le format des questions
    return questions.map(q => ({
      question: q.question,
      level: q.level || 'Moyen',
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    }))
  } catch (error) {
    console.error('Erreur parsing réponse quiz:', error)
    // Retourner des questions par défaut en cas d'erreur
    return getDefaultQuestions()
  }
}

/**
 * Questions par défaut en cas d'erreur
 */
function getDefaultQuestions() {
  return [
    {
      question: "Quelle est la définition de base de ce concept ?",
      level: "Facile",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      explanation: "Explication de base"
    }
  ]
}

/**
 * Sauvegarde les résultats d'un quiz dans la base de données
 * @param {string} userId - ID de l'utilisateur
 * @param {object} results - Résultats du quiz
 */
export async function saveQuizResults(userId, results) {
  try {
    const { error } = await supabase
      .from('quiz_results')
      .insert({
        user_id: userId,
        subject: results.subject,
        level: results.level,
        total_questions: results.total,
        correct_answers: results.correct,
        percentage: results.percentage,
        completed_at: new Date().toISOString()
      })

    if (error) throw error
  } catch (error) {
    console.error('Erreur sauvegarde résultats quiz:', error)
    throw error
  }
}

/**
 * Récupère l'historique des quiz d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Historique des quiz
 */
export async function getQuizHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur récupération historique quiz:', error)
    return []
  }
}
