import { router } from './trpc.js'
import { userRouter } from './routers/user.js'
import { botRouter } from './routers/bot.js'

export const appRouter = router({
  user: userRouter,
  bot: botRouter, 
})

export type AppRouter = typeof appRouter
