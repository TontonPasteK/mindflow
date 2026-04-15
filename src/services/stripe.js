import { loadStripe } from '@stripe/stripe-js'

let stripePromise = null

function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

export async function redirectToCheckout(userId, email) {
  const response = await fetch('/api/stripe-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Erreur lors de la création du paiement')
  }

  const { sessionId } = await response.json()
  const stripe = await getStripe()
  const { error } = await stripe.redirectToCheckout({ sessionId })
  if (error) throw error
}

export async function createPortalSession(userId) {
  const response = await fetch('/api/stripe-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) throw new Error('Erreur portail')
  const { url } = await response.json()
  window.location.href = url
}
