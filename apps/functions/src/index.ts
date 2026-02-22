import { onRequest } from 'firebase-functions/v2/https'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from './trpc/router.js'
import { createContext } from './trpc/context.js'

export const api = onRequest(
  {
    cors: true,
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (req, res) => {
    // 🛡️ MANUAL CORS FIX:
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, trpc-batch')

    // Handle Preflight request
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    // 🎯 THE FIX: In the emulator, req.url is usually "/trpc/bot.ask..."
    // We point the Request object to localhost so the fetch adapter can parse it.
    const fullUrl = `http://localhost${req.url}`

    try {
      return fetchRequestHandler({
        // 🎯 THE MATCH: This tells tRPC to strip "/trpc" and find "bot.ask"
        endpoint: '/trpc',
        req: new Request(fullUrl, {
          method: req.method,
          headers: req.headers as any,
          body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? (req.rawBody as BodyInit) : null,
        }),
        router: appRouter,
        createContext: () => createContext({ req, res }),
      }).then(async response => {
        res.status(response.status)
        response.headers.forEach((v, k) => res.setHeader(k, v))
        res.send(await response.text())
      })
    } catch (error) {
      console.error('tRPC Error:', error)
      res.status(500).send('Internal Server Error')
    }
  }
)
