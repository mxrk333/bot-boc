// functions/src/env.ts
import { defineString } from 'firebase-functions/params'

const projectId = defineString('PROJECT_ID')
const location = defineString('LOCATION')
const vectorIndex = defineString('VECTOR_INDEX_RESOURCE_NAME')
const vectorEndpoint = defineString('VECTOR_ENDPOINT_RESOURCE_NAME')
const gcsBucket = defineString('GCS_BUCKET') // ← added

export const ENV = {
  projectId: projectId.value(),
  location: location.value() || 'us-central1',
  vectorIndexResourceName: vectorIndex.value(),
  vectorEndpointResourceName: vectorEndpoint.value(),
  gcsBucket: gcsBucket.value(), // ← added
  embeddingModel: 'text-embedding-004', // ← changed (gemini-embedding-001 is not a valid embedding model ID)
  chatModel: 'gemini-2.0-flash', // ← changed from 2.5 (not released yet)
}
