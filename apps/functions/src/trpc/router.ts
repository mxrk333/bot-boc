/**
 * Root tRPC router.
 *
 * Merges all feature routers into a single `appRouter`.
 * The `AppRouter` type is re-exported from index.ts so the web app
 * can import it for end-to-end type safety.
 */

import { router } from './trpc.js'
import { userRouter } from './routers/user.js'
import { botRouter } from './routers/bot.js'

export const appRouter = router({
  user: userRouter,
  bot: botRouter, 
})

export type AppRouter = typeof appRouter
