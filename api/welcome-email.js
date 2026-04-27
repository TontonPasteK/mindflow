/**
 * Vercel Edge Function — /api/welcome-email
 * Envoie un email de bienvenue aux nouveaux parents
 *
 * POST body: { email, prenom }
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { email, prenom } = body
  if (!email || !prenom) {
    return res.status(400).json({ error: 'Missing email or prenom' })
  }

  try {
    // Utiliser Supabase Auth pour envoyer l'email
    const { error } = await supabase.auth.admin.sendEmail({
      email,
      template: 'welcome_email',
      data: {
        prenom,
        app_url: 'https://evokia-lime.vercel.app'
      }
    })

    if (error) throw error

    console.log('[welcome-email] Email envoyé à:', email)
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[welcome-email] Erreur:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
