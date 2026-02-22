/**
 * Client wrapper for the Gemini AI Cloud Function.
 *
 * In dev  → Vite proxies /generateResponse to the Cloud Function URL.
 * In prod → Firebase Hosting rewrites /generateResponse to the function.
 */

export async function askVertexAI(query: string): Promise<string> {
  const response = await fetch('/generateResponse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  // Read the body once as text so we can safely attempt JSON parsing
  const text = await response.text()

  let data: { answer?: string }
  try {
    data = JSON.parse(text)
  } catch {
    return [
      '**[Error]**',
      "I'm your AI guide! The backend isn't reachable right now.",
      '',
      '*Please ensure you have internet access and the production server is up.*',
    ].join('\n')
  }

  // Surface server-side errors as user-visible markdown
  if (!response.ok) {
    return `**[Error]**\nBackend error: \`${data.answer || response.statusText}\``
  }

  return data.answer ?? ''
}
