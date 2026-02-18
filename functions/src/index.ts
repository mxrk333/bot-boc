import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

// Example callable function
export const queryVector = functions.https.onCall(async request => {
  const userQuery = request.data.query

  // TODO: Call Vertex AI API to get vector response
  const response = 'This will be your RAG answer'

  console.log('Query received:', userQuery)

  return { answer: response }
})
