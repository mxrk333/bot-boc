/**
 * Shared React-Query client.
 *
 * Used by both the tRPC provider and any standalone useQuery hooks.
 * Stale time is set to 5 min so repeat navigations don't re-fetch
 * immediately, and retry is capped at 1 to fail fast during dev.
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})
