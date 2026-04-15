/**
 * Vercel Serverless Function — /api/create-checkout
 * Crée un checkout Lemon Squeezy et retourne l'URL de paiement.
 *
 * POST body: { userId, email }
 * Returns:   { url }
 */

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

  const { userId, email } = body
  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing userId or email' })
  }

  const apiKey    = process.env.LEMONSQUEEZY_API_KEY
  const storeId   = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID

  if (!apiKey || !storeId || !variantId) {
    console.error('[create-checkout] Variables Lemon Squeezy manquantes')
    return res.status(500).json({ error: 'Configuration paiement incomplète' })
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept':        'application/vnd.api+json',
        'Content-Type':  'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email,
              custom: { user_id: userId },
            },
            product_options: {
              redirect_url: `${baseUrl}/success`,
            },
          },
          relationships: {
            store:   { data: { type: 'stores',   id: String(storeId) } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errMsg = data.errors?.[0]?.detail || `Lemon Squeezy error ${response.status}`
      console.error('[create-checkout] API error:', errMsg)
      return res.status(500).json({ error: errMsg })
    }

    const url = data.data?.attributes?.url
    if (!url) {
      console.error('[create-checkout] URL absente dans la réponse:', JSON.stringify(data))
      return res.status(500).json({ error: 'Checkout URL introuvable' })
    }

    console.log('[create-checkout] Checkout créé pour userId:', userId)
    return res.status(200).json({ url })
  } catch (err) {
    console.error('[create-checkout] Erreur:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
