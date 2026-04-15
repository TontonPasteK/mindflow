/**
 * Vercel Serverless Function — /api/lemonsqueezy-webhook
 * Reçoit les événements Lemon Squeezy et met à jour le plan dans Supabase.
 *
 * Événements gérés :
 *   subscription_created → plan = 'premium'
 *   subscription_resumed  → plan = 'premium'
 *   subscription_expired  → plan = 'free'
 *   subscription_cancelled → pas d'action immédiate (accès jusqu'à la fin de période)
 *
 * Ajouter LEMONSQUEEZY_WEBHOOK_SECRET dans Vercel env + dans le dashboard LS.
 */

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Lit le body brut du stream (nécessaire pour vérification signature)
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  let rawBody
  try {
    rawBody = await getRawBody(req)
  } catch {
    return res.status(400).json({ error: 'Cannot read body' })
  }

  // ── Vérification signature HMAC-SHA256 ───────────────────────────────────
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (secret) {
    const signature = req.headers['x-signature'] || ''
    const digest = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    if (signature !== digest) {
      console.warn('[ls-webhook] Signature invalide')
      return res.status(400).json({ error: 'Invalid signature' })
    }
  } else {
    console.warn('[ls-webhook] LEMONSQUEEZY_WEBHOOK_SECRET non défini — vérification ignorée')
  }

  let event
  try {
    event = JSON.parse(rawBody.toString())
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const eventName  = event.meta?.event_name
  const customData = event.meta?.custom_data        // { user_id: '...' }
  const userId     = customData?.user_id

  console.log('[ls-webhook] Événement reçu:', eventName, '| userId:', userId)

  try {
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_resumed': {
        if (!userId) { console.warn('[ls-webhook] user_id absent'); break }
        const { error } = await supabase
          .from('users')
          .update({ plan: 'premium' })
          .eq('id', userId)
        if (error) throw error
        console.log('[ls-webhook] Plan → premium pour', userId)
        break
      }

      case 'subscription_expired': {
        if (!userId) { console.warn('[ls-webhook] user_id absent'); break }
        const { error } = await supabase
          .from('users')
          .update({ plan: 'free' })
          .eq('id', userId)
        if (error) throw error
        console.log('[ls-webhook] Plan → free pour', userId)
        break
      }

      case 'subscription_cancelled':
        // L'accès reste actif jusqu'à la fin de la période payée.
        // subscription_expired gérera la rétrogradation le moment venu.
        console.log('[ls-webhook] Annulation enregistrée (pas d\'action immédiate)')
        break

      default:
        console.log('[ls-webhook] Événement ignoré:', eventName)
    }
  } catch (err) {
    console.error('[ls-webhook] Erreur Supabase:', err.message)
    return res.status(500).json({ error: 'DB update failed' })
  }

  return res.status(200).json({ received: true })
}

// Body parser désactivé pour lire le stream brut (requis pour HMAC)
export const config = {
  api: { bodyParser: false },
}
