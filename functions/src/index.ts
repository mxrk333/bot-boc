import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'

admin.initializeApp()

// Enable CORS for all origins
const corsHandler = cors({ origin: true })

// Cloud Function for Vertex AI query
export const generateResponse = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      const query = req.body.query
      if (!query) {
        return res.status(400).json({ error: 'Query is required' })
      }

      console.log('Received query:', query)

      // TODO: Replace this with actual Vertex AI API call
      // Example:
      // const vertexResponse = await vertexAiClient.someMethod(query)
      const vertexResponse = `AI response for: "${query}"`

      return res.json({ answer: vertexResponse })
    } catch (err) {
      console.error('Error in generateResponse:', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })
})
