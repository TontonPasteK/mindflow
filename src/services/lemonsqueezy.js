/**
 * Client-side service — Lemon Squeezy checkout
 * Appelle /api/create-checkout et redirige vers la page de paiement.
 */

export async function redirectToCheckout(userId, email) {
  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Erreur lors de la création du paiement')
  }

  const { url } = await response.json()
  if (!url) throw new Error('URL de paiement introuvable')

  window.location.href = url
}
