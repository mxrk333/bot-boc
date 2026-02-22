/**
 * Root tRPC router.
 *
 * Merges all feature routers into a single `appRouter`.
 * The `AppRouter` type is re-exported from index.ts so the web app
 * can import it for end-to-end type safety.
 */

import { router } from './trpc.js'
import { userRouter } from './routers/user.js'

export const appRouter = router({
  user: userRouter,
})

export type AppRouter = typeof appRouter
