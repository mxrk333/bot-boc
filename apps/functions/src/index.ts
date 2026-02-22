/**
 * Firebase Cloud Functions — entry point.
 *
 * Exports:
 *  - generateResponse : HTTPS callable that forwards a user query to Gemini AI
 *  - appRouter / AppRouter : tRPC router + its type (consumed by the web app)
 */

import { onRequest } from 'firebase-functions/v2/https'
import { GoogleGenAI } from '@google/genai'

// Re-export tRPC router so the web app can import the type via @repo/functions
export { appRouter, type AppRouter } from './trpc/router.js'

/* ------------------------------------------------------------------ */
/*  generateResponse — Gemini AI HTTP function                        */
/* ------------------------------------------------------------------ */

const MAX_RETRIES = 2

export const generateResponse = onRequest(
  { cors: true, region: 'asia-southeast1', secrets: ['GOOGLE_API_KEY'] },
  async (req, res) => {
    const userQuery = req.body.query

    if (!userQuery) {
      res.json({ answer: 'No query provided.' })
      return
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      res.status(500).json({ answer: 'Gemini server missing API key' })
      return
    }

    const ai = new GoogleGenAI({ apiKey })

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: userQuery,
        })

        const answer = result.text ?? ''
        console.log('Query received:', userQuery)
        console.log('Gemini response:', answer)

        res.json({ answer })
        return
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        const isRateLimit = message.includes('429') || message.includes('quota')

        // Retry with exponential back-off on rate-limit errors
        if (isRateLimit && attempt < MAX_RETRIES) {
          const delay = (attempt + 1) * 15_000 // 15 s, 30 s
          console.warn(
            `Rate limited (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay / 1000}s...`
          )
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        console.error('Gemini AI error:', error)
        res.status(isRateLimit ? 429 : 500).json({ answer: `Gemini AI error: ${message}` })
        return
      }
    }
  }
)
