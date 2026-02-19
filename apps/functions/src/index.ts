// Firebase Functions entry point
// This file serves as the entry point for Firebase Cloud Functions

import { onRequest } from 'firebase-functions/v2/https'
import { VertexAI } from '@google-cloud/vertexai'

export { appRouter, type AppRouter } from './trpc/router.js'

const project = process.env.GCLOUD_PROJECT || 'boc-bot'
const functionRegion = 'asia-southeast1'
const vertexLocation = 'us-central1'

// Gemini AI - generateResponse HTTP function
export const generateResponse = onRequest({ cors: true, region: functionRegion }, async (req, res) => {
  const userQuery = req.body.query

  if (!userQuery) {
    res.json({ answer: 'No query provided.' })
    return
  }

  const vertexAI = new VertexAI({ project, location: vertexLocation })
  const model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(userQuery)
      const answer = result.response?.candidates?.[0]?.content?.parts
        ?.map(part => part.text)
        .join('') ?? ''

      console.log('Query received:', userQuery)
      console.log('Gemini response:', answer)

      res.json({ answer })
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      const isRateLimit = message.includes('429') || message.includes('quota')

      if (isRateLimit && attempt < maxRetries) {
        const delay = (attempt + 1) * 15_000 // 15s, 30s
        console.warn(`Rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      console.error('Gemini AI error:', error)
      const status = isRateLimit ? 429 : 500
      res.status(status).json({ answer: `Gemini AI error: ${message}` })
      return
    }
  }
})
