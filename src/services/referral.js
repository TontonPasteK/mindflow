import { supabase } from './supabase'

const REFERRAL_BONUS_POINTS = 100 // Points bonus pour le parrain
const REFERRAL_BONUS_REFEREE = 50 // Points bonus pour le filleul

/**
 * Génère un code de parrainage unique
 * @param {string} userId - ID de l'utilisateur
 * @returns {string} Code de parrainage
 */
export function generateReferralCode(userId) {
  const prefix = 'EVOKIA'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Crée un code de parrainage pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<{code: string, success: boolean}>}
 */
export async function createReferralCode(userId) {
  try {
    // Vérifier si l'utilisateur a déjà un code
    const { data: existingCode } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .single()

    if (existingCode) {
      return { code: existingCode.code, success: true }
    }

    // Générer un nouveau code
    const code = generateReferralCode(userId)

    // Insérer le code dans la base de données
    const { error } = await supabase
      .from('referral_codes')
      .insert({
        user_id: userId,
        code: code,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    return { code, success: true }
  } catch (error) {
    console.error('Erreur création code parrainage:', error)
    throw error
  }
}

/**
 * Récupère le code de parrainage d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<string|null>}
 */
export async function getReferralCode(userId) {
  try {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Pas de code trouvé
        return null
      }
      throw error
    }

    return data?.code || null
  } catch (error) {
    console.error('Erreur récupération code parrainage:', error)
    return null
  }
}

/**
 * Valide et utilise un code de parrainage
 * @param {string} code - Code de parrainage à valider
 * @param {string} newUserId - ID du nouvel utilisateur
 * @returns {Promise<{success: boolean, referrerId?: string, bonus?: number}>}
 */
export async function validateAndUseReferralCode(code, newUserId) {
  try {
    // Vérifier si le code existe et est valide
    const { data: referralData, error: referralError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (referralError || !referralData) {
      return { success: false, error: 'Code de parrainage invalide' }
    }

    // Vérifier que l'utilisateur ne s'auto-parraine pas
    if (referralData.user_id === newUserId) {
      return { success: false, error: 'Tu ne peux pas utiliser ton propre code de parrainage' }
    }

    // Vérifier si le code a déjà été utilisé par cet utilisateur
    const { data: existingUsage } = await supabase
      .from('referral_uses')
      .select('*')
      .eq('referral_code_id', referralData.id)
      .eq('referred_user_id', newUserId)
      .single()

    if (existingUsage) {
      return { success: false, error: 'Tu as déjà utilisé ce code de parrainage' }
    }

    // Enregistrer l'utilisation du code
    const { error: usageError } = await supabase
      .from('referral_uses')
      .insert({
        referral_code_id: referralData.id,
        referred_user_id: newUserId,
        used_at: new Date().toISOString()
      })

    if (usageError) throw usageError

    // Donner les points bonus au parrain
    await addReferralBonus(referralData.user_id, REFERRAL_BONUS_POINTS)

    // Donner les points bonus au filleul
    await addReferralBonus(newUserId, REFERRAL_BONUS_REFEREE)

    return {
      success: true,
      referrerId: referralData.user_id,
      bonus: REFERRAL_BONUS_REFERREE
    }
  } catch (error) {
    console.error('Erreur validation code parrainage:', error)
    return { success: false, error: 'Erreur lors de la validation du code' }
  }
}

/**
 * Ajoute des points bonus de parrainage à un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} points - Nombre de points à ajouter
 */
async function addReferralBonus(userId, points) {
  try {
    // Récupérer les points actuels
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('user_id', userId)
      .single()

    const currentPoints = profile?.points || 0

    // Mettre à jour les points
    const { error } = await supabase
      .from('profiles')
      .update({ points: currentPoints + points })
      .eq('user_id', userId)

    if (error) throw error

    // Enregistrer la transaction
    await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        amount: points,
        type: 'referral_bonus',
        description: `Bonus de parrainage : +${points} points`,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Erreur ajout points bonus:', error)
    throw error
  }
}

/**
 * Récupère les statistiques de parrainage d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<{code: string, referrals: number, totalBonus: number}>}
 */
export async function getReferralStats(userId) {
  try {
    // Récupérer le code de parrainage
    const code = await getReferralCode(userId)

    // Récupérer le nombre de parrainages
    const { data: referralData } = await supabase
      .from('referral_codes')
      .select('id')
      .eq('user_id', userId)
      .single()

    let referralCount = 0
    if (referralData) {
      const { count } = await supabase
        .from('referral_uses')
        .select('*', { count: 'exact', head: true })
        .eq('referral_code_id', referralData.id)

      referralCount = count || 0
    }

    // Calculer le bonus total
    const totalBonus = referralCount * REFERRAL_BONUS_POINTS

    return {
      code,
      referrals: referralCount,
      totalBonus
    }
  } catch (error) {
    console.error('Erreur récupération stats parrainage:', error)
    return {
      code: null,
      referrals: 0,
      totalBonus: 0
    }
  }
}
