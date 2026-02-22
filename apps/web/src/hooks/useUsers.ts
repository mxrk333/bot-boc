/**
 * tRPC-powered hooks for the User endpoints.
 *
 * These wrap the auto-generated tRPC React-Query hooks so components
 * don't need to import `trpc` directly. Requires <QueryProvider> in
 * the component tree.
 */

import { trpc } from '../lib/trpc'

export function useUsers() {
  return trpc.user.list.useQuery()
}

export function useUser(id: string) {
  return trpc.user.getById.useQuery(id)
}

export function useCreateUser() {
  return trpc.user.create.useMutation()
}
