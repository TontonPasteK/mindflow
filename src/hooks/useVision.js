import { useState, useCallback } from 'react'
import {
  extractTextFromImage,
  extractTextFromPDF,
  preprocessImage,
  detectDocumentType,
  formatExtractedText,
  analyzeImageQuality,
} from '../services/vision'

/**
 * Hook pour gérer la reconnaissance de documents (Vision/OCR)
 * Permet d'extraire du texte des images et PDFs
 */
export function useVision() {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [quality, setQuality] = useState(null)

  /**
   * Extrait le texte d'une image
   */
  const extractFromImage = useCallback(async (base64Image, mimeType = 'image/jpeg', language = 'fra') => {
    setProcessing(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      // Analyser la qualité de l'image
      const qualityAnalysis = await analyzeImageQuality(base64Image)
      setQuality(qualityAnalysis)

      // Prétraiter l'image si nécessaire
      let processedImage = base64Image
      if (qualityAnalysis.quality === 'poor') {
        setProgress(10)
        processedImage = await preprocessImage(base64Image, {
          grayscale: true,
          contrast: 1.2,
          brightness: 1.1,
          threshold: 128
        })
        // Extraire juste la partie base64
        processedImage = processedImage.split(',')[1]
      }

      // Extraire le texte avec OCR
      setProgress(20)
      const ocrResult = await extractTextFromImage(
        processedImage,
        mimeType,
        language,
        (progress) => setProgress(20 + Math.round(progress * 0.7))
      )

      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'Erreur lors de l\'extraction du texte')
      }

      // Détecter le type de document
      const documentType = detectDocumentType(ocrResult.text)

      // Formater le texte
      const formattedText = formatExtractedText(ocrResult.text, documentType)

      setResult({
        text: formattedText,
        originalText: ocrResult.text,
        confidence: ocrResult.confidence,
        documentType,
        words: ocrResult.words,
        lines: ocrResult.lines,
        quality: qualityAnalysis,
        success: true
      })

      setProgress(100)

      return {
        text: formattedText,
        confidence: ocrResult.confidence,
        documentType,
        success: true
      }
    } catch (err) {
      console.error('Erreur extraction vision:', err)
      setError(err.message || 'Erreur lors de la reconnaissance du document')
      setResult({
        text: '',
        confidence: 0,
        documentType: 'unknown',
        success: false,
        error: err.message
      })
      return {
        text: '',
        confidence: 0,
        documentType: 'unknown',
        success: false,
        error: err.message
      }
    } finally {
      setProcessing(false)
    }
  }, [])

  /**
   * Extrait le texte d'un PDF
   */
  const extractFromPDF = useCallback(async (base64Pdf, language = 'fra') => {
    setProcessing(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      setProgress(10)
      const pdfResult = await extractTextFromPDF(base64Pdf, language, (progress) => {
        setProgress(10 + Math.round(progress * 0.8))
      })

      if (!pdfResult.success) {
        throw new Error(pdfResult.error || 'Erreur lors de l\'extraction du PDF')
      }

      setResult({
        text: pdfResult.text,
        confidence: pdfResult.confidence,
        documentType: 'pdf',
        success: true
      })

      setProgress(100)

      return pdfResult
    } catch (err) {
      console.error('Erreur extraction PDF:', err)
      setError(err.message || 'Erreur lors de la reconnaissance du PDF')
      setResult({
        text: '',
        confidence: 0,
        documentType: 'pdf',
        success: false,
        error: err.message
      })
      return {
        text: '',
        confidence: 0,
        documentType: 'pdf',
        success: false,
        error: err.message
      }
    } finally {
      setProcessing(false)
    }
  }, [])

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setProcessing(false)
    setProgress(0)
    setResult(null)
    setError(null)
    setQuality(null)
  }, [])

  /**
   * Analyse la qualité d'une image sans extraire le texte
   */
  const analyzeQuality = useCallback(async (base64Image) => {
    try {
      const qualityAnalysis = await analyzeImageQuality(base64Image)
      setQuality(qualityAnalysis)
      return qualityAnalysis
    } catch (err) {
      console.error('Erreur analyse qualité:', err)
      setError(err.message)
      return {
        quality: 'poor',
        brightness: 0,
        resolution: 'unknown',
        recommendations: ['Erreur lors de l\'analyse']
      }
    }
  }, [])

  return {
    // État
    processing,
    progress,
    result,
    error,
    quality,

    // Actions
    extractFromImage,
    extractFromPDF,
    analyzeQuality,
    reset,
  }
}
