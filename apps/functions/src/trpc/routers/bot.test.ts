import { describe, it, expect, vi, beforeEach } from 'vitest'
import { appRouter } from '../router'
import { createCallerFactory } from '../trpc'

// 1. Mock Google Auth Library (The getAccessToken helper)
vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getClient: vi.fn().mockResolvedValue({
      getAccessToken: vi.fn().mockResolvedValue({ token: 'fake-token-123' }),
    }),
  })),
}))

// 2. Mock Firebase/Firestore (The findNearest search)
vi.mock('../../lib/firebase.js', () => ({
  db: {
    collection: vi.fn(() => ({
      findNearest: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              data: () => ({
                text: 'BOC Rules for Balikbayan boxes...',
                metadata: {
                  source:
                    'CMO-18-2018_GUIDELINES_ON_THE_IMPLEMENTATION_OF_CAO_NO_1_2018_ON_AMENDED_RULES_ON_BALIKBAYAN_BOXES',
                  page: 1,
                },
              }),
            },
          ],
        }),
      })),
    })),
  },
}))

// 3. Mock Vertex AI SDK (Vision and Chat parts)
vi.mock('@google-cloud/vertexai', () => ({
  VertexAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          candidates: [{ content: { parts: [{ text: 'Mocked AI Answer' }] } }],
        },
      }),
    }),
  })),
}))

// 4. Mock Global Fetch (The Embedding REST call)
global.fetch = vi.fn().mockResolvedValue({
  json: () =>
    Promise.resolve({
      predictions: [
        {
          embeddings: { values: new Array(768).fill(0.1) },
        },
      ],
    }),
})

const createCaller = createCallerFactory(appRouter)
const caller = createCaller({})

describe('botRouter', () => {
  it('should successfully answer a text query', async () => {
    const result = await caller.bot.ask({
      query: 'What are the rules for balikbayan boxes?',
      history: [],
    })

    expect(result.answer).toBe('Mocked AI Answer')
    expect(result.sources.length).toBeGreaterThan(0)
    expect(result.sources[0].name).toContain('CMO 18-2018')
  })

  it('fails if the query is empty string (Zod validation)', async () => {
    // This doesn't even hit your logic, Zod stops it at the door
    await expect(caller.bot.ask({ query: '' } as any)).rejects.toThrow()
  })

  it('successfully handles image input (Vision + RAG)', async () => {
    const result = await caller.bot.ask({
      query: 'How much is the tax for this?',
      image: 'base64-string-here',
      history: [],
    })

    expect(result.answer).toBe('Mocked AI Answer')
    expect(global.fetch).toHaveBeenCalled() // Proves it tried to get embeddings
  })
})
