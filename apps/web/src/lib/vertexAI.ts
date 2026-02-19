/**
 * Sends a query to the Vertex AI Cloud Function and returns the AI-generated answer.
 *
 * In dev, Vite proxies /generateResponse to the Firebase emulator.
 * In production, Firebase Hosting rewrites /generateResponse to the Cloud Function.
 *
 * @param query - The user's question or prompt to send to Vertex AI.
 * @returns The AI-generated answer string.
 */
export async function askVertexAI(query: string): Promise<string> {
  const response = await fetch('/generateResponse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  const text = await response.text()
  let data: { answer?: string }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(
      response.ok
        ? 'Invalid response from server'
        : `Server error (${response.status}). Please try again later.`
    )
  }

  if (!response.ok) {
    throw new Error(data.answer || `HTTP error! Status: ${response.status}`)
  }

  return data.answer ?? ''
}
