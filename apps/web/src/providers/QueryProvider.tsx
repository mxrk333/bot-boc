/**
 * Combined tRPC + React-Query provider.
 *
 * Wraps the app so that both `trpc.*.useQuery()` hooks and
 * standalone `useQuery()` calls share the same query client.
 */

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import { trpc, trpcClient } from '../lib/trpc'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
