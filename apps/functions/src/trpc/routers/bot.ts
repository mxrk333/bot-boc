import { router, publicProcedure } from '../trpc.js'
import { z } from 'zod'
import { db } from '../../lib/firebase.js'
import { VertexAI } from '@google-cloud/vertexai'
import { TRPCError } from '@trpc/server'
import { GoogleAuth } from 'google-auth-library'

const project = process.env.GCLOUD_PROJECT || 'boc-bot'
const location = 'us-central1'
const vertexAI = new VertexAI({ project, location })

/* ------------------------------------------------------------------ */
/*  Auth helper — gets ADC access token for REST calls                */
/* ------------------------------------------------------------------ */

async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  if (!token.token) throw new Error('Failed to get access token')
  return token.token
}

/* ------------------------------------------------------------------ */
/*  Retry helper — handles 429 quota errors from Vertex AI            */
/* ------------------------------------------------------------------ */

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 15000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const errorObj = err as Record<string, unknown>
      const is429 =
        (errorObj?.stackTrace as { code?: number })?.code === 429 || errorObj?.code === 429

      if (is429 && i < retries - 1) {
        const wait = delayMs * (i + 1)
        console.log(`⏳ Rate limited, retrying in ${wait / 1000}s... (attempt ${i + 1}/${retries})`)
        await new Promise(res => setTimeout(res, wait))
      } else {
        throw err
      }
    }
  }
  throw new Error('Max retries exceeded')
}

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

export const botRouter = router({
  ask: publicProcedure
    .input(
      z.object({
        query: z.string(),
        image: z.string().optional(), // base64 encoded image
        history: z
          .array(
            z.object({
              role: z.enum(['user', 'model']),
              text: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log('📥 RECEIVED QUERY:', input.query)

      try {
        let imageDescription = ''
        let searchQuery = input.query

        // If image is provided, identify it with Gemini Vision first
        if (input.image) {
          console.log('🖼️ Image received, identifying with Gemini Vision...')
          const visionModel = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
          const visionResult = await withRetry(() =>
            visionModel.generateContent({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'image/jpeg',
                        data: input.image!,
                      },
                    },
                    {
                      text: `Look at this image and identify the item.
                      Return ONLY a JSON object in this exact format, no markdown, no backticks:
                      {"item": "item name here", "category": "category here"}`,
                    },
                  ],
                },
              ],
            })
          )

          const visionText = visionResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          console.log('🔍 Vision raw response:', visionText)

          try {
            const parsed = JSON.parse(visionText.trim())
            imageDescription = `${parsed.item} (${parsed.category})`
            // Combine image item + user query for richer vector search
            searchQuery = `${parsed.item} ${input.query} balikbayan tariff rate`
            console.log('✅ Identified item:', imageDescription)
          } catch {
            // If JSON parse fails, just use the raw vision text
            imageDescription = visionText.trim()
            searchQuery = `${imageDescription} ${input.query}`
            console.log('⚠️ Could not parse vision JSON, using raw text:', imageDescription)
          }
        }
        // Use REST API directly for embeddings (more reliable than SDK)
        const accessToken = await getAccessToken()
        const embedResponse = await withRetry(() =>
          fetch(
            `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/text-embedding-004:predict`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                instances: [{ content: searchQuery }], // 👈 uses enriched search query
              }),
            }
          ).then(res => res.json())
        )

        const queryVector = embedResponse?.predictions?.[0]?.embeddings?.values

        if (!queryVector || queryVector.length === 0) {
          throw new Error('Failed to generate embedding vector.')
        }

        console.log('Vector length:', queryVector.length)

        const collectionRef = db.collection('faq_chunks')
        const snapshot = await collectionRef
          .findNearest({
            vectorField: 'vector',
            queryVector: queryVector,
            distanceMeasure: 'COSINE',
            limit: 5,
          })
          .get()

        // Extract unique sources from chunk metadata for attribution
        const sourcesMap = new Map<string, { name: string; url: string }>()
        const contextText = snapshot.docs
          .map(doc => {
            const data = doc.data()
            const sourceName = data.metadata?.source || data.source || 'BOC Official Document'
            const sourceUrl = data.metadata?.url || data.url || ''
            if (sourceName && !sourcesMap.has(sourceName)) {
              sourcesMap.set(sourceName, { name: sourceName, url: sourceUrl })
            }
            return `--- SOURCE: ${sourceName} ---\n${data.text}`
          })
          .join('\n\n')

        const sources = Array.from(sourcesMap.values())

        const chatModel = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const formattedHistory =
          input.history
            ?.map(h => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`)
            .join('\n') || 'No previous history.'

        const prompt = `
          You are an expert Philippine Bureau of Customs (BOC) Assistant. 
          Answer the user's question based ONLY on the provided CONTEXT.

          LANGUAGE & STYLE RULES:
          1. Detect the language of the user's question and reply in that same language only. Never give two versions of the same answer.
          2. If the user asks in Tagalog or Taglish, reply only in friendly Taglish. Do not also provide an English version.
          3. If the user asks in English, reply only in English with a professional and authoritative tone. Do not also provide a Taglish version.

          ${imageDescription ? `IDENTIFIED ITEM FROM IMAGE: ${imageDescription}` : ''}

          --- CHAT HISTORY ---
          ${formattedHistory}

          --- CONTEXT FROM BOC LAWS ---
          ${contextText}

          USER QUESTION: 
          ${input.query}
          
          BOC ASSISTANT ANSWER:
        `

        // 👇 Also wrapped the main generation call for safety
        const result = await withRetry(() => chatModel.generateContent(prompt))

        const answer =
          result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Pasensya na, hindi ko mahanap ang impormasyon na yan.'

        console.log('📤 BOT ANSWERED:', answer.substring(0, 50) + '...')

        return { answer, sources }
      } catch (err) {
        console.error('❌ BOT ROUTER ERROR:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error during AI processing',
        })
      }
    }),
})
