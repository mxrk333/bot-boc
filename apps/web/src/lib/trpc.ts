/**
 * tRPC client setup for React.
 *
 * `trpc`       — the React-Query hooks (trpc.user.list.useQuery(), etc.)
 * `trpcClient` — the underlying HTTP client that talks to the functions app
 *
 * Both are consumed by QueryProvider to wire everything together.
 */

import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@repo/functions/router'

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL,
    }),
  ],
})
