// API endpoint pour envoyer les rapports hebdomadaires aux parents
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { parentEmail, childName, report } = req.body

    if (!parentEmail || !childName || !report) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Utiliser Resend pour envoyer l'email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Evokia <contact@evokia.fr>',
        to: parentEmail,
        subject: report.subject,
        html: report.html,
        text: report.text
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const data = await response.json()

    return res.status(200).json({
      success: true,
      messageId: data.id
    })
  } catch (error) {
    console.error('Error sending weekly report:', error)
    return res.status(500).json({
      error: 'Failed to send weekly report',
      message: error.message
    })
  }
}
