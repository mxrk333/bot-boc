import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { db } from '../../lib/firebase' // Ensure your Admin SDK is initialized here
import { GoogleGenerativeAI } from '@google/generative-ai'
// import { FieldValue } from 'firebase-admin/firestore'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const faqRouter = router({
  ask: publicProcedure.input(z.object({ question: z.string() })).mutation(async ({ input }) => {
    const { question } = input

    // 1. Generate Embedding for the User's Question
    // We use 'text-embedding-004' to match the ingestion script
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const embeddingResult = await embeddingModel.embedContent(question)
    const userVector = embeddingResult.embedding.values

    // 2. Firestore Native Vector Search (findNearest)
    // This is the "Hacker Route" secret sauce
    const faqCollection = db.collection('faq_chunks')
    const snapshot = await faqCollection
      .findNearest({
        vectorField: 'vector',
        queryVector: userVector,
        distanceMeasure: 'COSINE',
        limit: 3, // Top 3 most relevant pages
      })
      .get()

    if (snapshot.empty) {
      return { answer: "I couldn't find any relevant BOC documents to answer that.", sources: [] }
    }

    // 3. Prepare the Context for Gemini
    const contextRetrieved = snapshot.docs
      .map(
        doc =>
          `[Source: ${doc.data().metadata.source}, Page: ${doc.data().metadata.page}]\n${doc.data().text}`
      )
      .join('\n\n---\n\n')

    const sources = snapshot.docs.map(doc => ({
      title: doc.data().metadata.source,
      page: doc.data().metadata.page,
    }))

    // 4. Generate the Final Answer using Gemini 2.0 Flash
    const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const systemPrompt = `
        You are the "BOC Balikbayan Assistant." Answer the user's question using ONLY the provided context.
        If the context doesn't contain the answer, say you don't know based on the documents.
        Focus on CMTA, CMO 18-2018 (Balikbayan boxes), and CAO 2-2016 (De Minimis).
        Keep answers concise and professional. Use Markdown.
        
        CONTEXT:
        ${contextRetrieved}
      `

    const result = await chatModel.generateContent([systemPrompt, `Question: ${question}`])
    const answer = result.response.text()

    return {
      answer,
      sources,
    }
  }),
})
