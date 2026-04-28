/**
 * Service Vision - Reconnaissance de documents et extraction de texte
 * Utilise Tesseract.js pour l'OCR côté client
 */

// Charger Tesseract.js dynamiquement pour éviter les problèmes de bundle
let Tesseract = null

async function loadTesseract() {
  if (Tesseract) return Tesseract

  try {
    // Import dynamique de Tesseract.js
    const module = await import('tesseract.js')
    Tesseract = module.default || module
    return Tesseract
  } catch (error) {
    console.error('Erreur chargement Tesseract.js:', error)
    throw new Error('Impossible de charger Tesseract.js')
  }
}

/**
 * Extrait le texte d'une image en base64
 * @param {string} base64Image - Image en base64 (sans le préfixe data:image/...)
 * @param {string} mimeType - Type MIME de l'image (image/jpeg, image/png, etc.)
 * @param {string} language - Langue de l'OCR (fra, eng, etc.)
 * @param {Function} onProgress - Callback pour la progression (0-100)
 * @returns {Promise<Object>} Résultat de l'OCR avec texte et confiance
 */
export async function extractTextFromImage(base64Image, mimeType = 'image/jpeg', language = 'fra', onProgress = null) {
  try {
    const TesseractLib = await loadTesseract()

    // Construire l'URL data complète
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    // Lancer l'OCR avec Tesseract
    const result = await TesseractLib.recognize(
      dataUrl,
      language,
      {
        logger: (m) => {
          if (onProgress && m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100)
            onProgress(progress)
          }
        }
      }
    )

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words,
      lines: result.data.lines,
      success: true
    }
  } catch (error) {
    console.error('Erreur extraction texte:', error)
    return {
      text: '',
      confidence: 0,
      words: [],
      lines: [],
      success: false,
      error: error.message
    }
  }
}

/**
 * Extrait le texte d'un PDF (première page uniquement)
 * @param {string} base64Pdf - PDF en base64
 * @param {string} language - Langue de l'OCR
 * @param {Function} onProgress - Callback pour la progression
 * @returns {Promise<Object>} Résultat de l'OCR
 */
export async function extractTextFromPDF(base64Pdf, language = 'fra', onProgress = null) {
  try {
    // Pour l'instant, on retourne un message indiquant que le PDF n'est pas supporté
    // L'implémentation complète nécessiterait pdf.js + Tesseract
    return {
      text: '[PDF] La reconnaissance de PDF sera bientôt disponible. Pour l\'instant, utilise des images (JPG, PNG).',
      confidence: 0,
      words: [],
      lines: [],
      success: false,
      error: 'PDF non supporté pour le moment'
    }
  } catch (error) {
    console.error('Erreur extraction PDF:', error)
    return {
      text: '',
      confidence: 0,
      words: [],
      lines: [],
      success: false,
      error: error.message
    }
  }
}

/**
 * Améliore la qualité de l'image avant OCR
 * @param {string} base64Image - Image en base64
 * @param {Object} options - Options d'amélioration
 * @returns {Promise<string>} Image améliorée en base64
 */
export async function preprocessImage(base64Image, options = {}) {
  const {
    grayscale = true,
    contrast = 1.2,
    brightness = 1.1,
    threshold = 128
  } = options

  try {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = img.width
        canvas.height = img.height

        // Dessiner l'image
        ctx.drawImage(img, 0, 0)

        // Obtenir les données de pixels
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let data = imageData.data

        // Appliquer les transformations
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i]
          let g = data[i + 1]
          let b = data[i + 2]

          // Niveaux de gris
          if (grayscale) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b
            r = g = b = gray
          }

          // Contraste et luminosité
          r = ((r - 128) * contrast + 128) * brightness
          g = ((g - 128) * contrast + 128) * brightness
          b = ((b - 128) * contrast + 128) * brightness

          // Seuillage (binarisation)
          if (threshold) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b
            const value = gray > threshold ? 255 : 0
            r = g = b = value
          }

          // Clamp values
          data[i] = Math.max(0, Math.min(255, r))
          data[i + 1] = Math.max(0, Math.min(255, g))
          data[i + 2] = Math.max(0, Math.min(255, b))
        }

        // Mettre à jour le canvas
        ctx.putImageData(imageData, 0, 0)

        // Convertir en base64
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }

      img.onerror = () => reject(new Error('Erreur chargement image'))
      img.src = `data:image/jpeg;base64,${base64Image}`
    })
  } catch (error) {
    console.error('Erreur prétraitement image:', error)
    // En cas d'erreur, retourner l'image originale
    return `data:image/jpeg;base64,${base64Image}`
  }
}

/**
 * Détecte le type de document (texte, tableau, formulaire, etc.)
 * @param {string} text - Texte extrait
 * @returns {string} Type de document détecté
 */
export function detectDocumentType(text) {
  const lowerText = text.toLowerCase()

  // Détection de tableau
  if (lowerText.includes('|') && lowerText.split('|').length > 3) {
    return 'table'
  }

  // Détection de formulaire
  if (lowerText.includes('nom') && lowerText.includes('prénom') && lowerText.includes('date')) {
    return 'form'
  }

  // Détection de liste
  if (lowerText.match(/^\s*[-•]\s+/m)) {
    return 'list'
  }

  // Détection de questions/exercices
  if (lowerText.includes('question') || lowerText.includes('exercice') || lowerText.includes('?')) {
    return 'exercise'
  }

  // Par défaut : texte
  return 'text'
}

/**
 * Formate le texte extrait pour une meilleure lisibilité
 * @param {string} text - Texte brut extrait
 * @param {string} documentType - Type de document
 * @returns {string} Texte formaté
 */
export function formatExtractedText(text, documentType = 'text') {
  // Nettoyer le texte
  let formatted = text
    .replace(/\s+/g, ' ')           // Remplacer les espaces multiples par un seul
    .replace(/\n\s*\n/g, '\n')     // Supprimer les lignes vides multiples
    .trim()

  // Formatage spécifique selon le type
  switch (documentType) {
    case 'table':
      // Conserver la structure du tableau
      return formatted

    case 'exercise':
      // Mettre en évidence les questions
      return formatted.replace(/(question\s*\d*:)/gi, '\n**$1**')

    case 'list':
      // Conserver la structure des listes
      return formatted

    default:
      // Texte standard : paragraphes
      return formatted
  }
}

/**
 * Analyse la qualité de l'image pour l'OCR
 * @param {string} base64Image - Image en base64
 * @returns {Promise<Object>} Analyse de qualité
 */
export async function analyzeImageQuality(base64Image) {
  try {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Calculer la luminosité moyenne
        let totalBrightness = 0
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
          totalBrightness += brightness
        }
        const avgBrightness = totalBrightness / (data.length / 4)

        // Déterminer la qualité
        let quality = 'good'
        let recommendations = []

        if (avgBrightness < 50) {
          quality = 'poor'
          recommendations.push('Image trop sombre - améliorez l\'éclairage')
        } else if (avgBrightness > 200) {
          quality = 'poor'
          recommendations.push('Image trop claire - réduisez la luminosité')
        }

        if (img.width < 800) {
          quality = quality === 'good' ? 'medium' : 'poor'
          recommendations.push('Résolution trop faible - utilisez une image plus grande')
        }

        resolve({
          quality,
          brightness: Math.round(avgBrightness),
          resolution: `${img.width}x${img.height}`,
          recommendations
        })
      }

      img.onerror = () => {
        resolve({
          quality: 'poor',
          brightness: 0,
          resolution: 'unknown',
          recommendations: ['Erreur de chargement de l\'image']
        })
      }

      img.src = `data:image/jpeg;base64,${base64Image}`
    })
  } catch (error) {
    console.error('Erreur analyse qualité:', error)
    return {
      quality: 'poor',
      brightness: 0,
      resolution: 'unknown',
      recommendations: ['Erreur lors de l\'analyse']
    }
  }
}
