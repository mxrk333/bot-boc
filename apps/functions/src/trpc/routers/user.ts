/**
 * User router — placeholder CRUD endpoints.
 *
 * These return hard-coded dummy data for now. Replace the handlers
 * with real Firestore / database calls when ready.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc.js'
import { CreateUserSchema, UserSchema } from '@repo/shared'

export const userRouter = router({
  // POST — create a new user (stub)
  create: publicProcedure
    .input(CreateUserSchema)
    .output(UserSchema)
    .mutation(({ input }) => ({
      id: 'dummy-id', // TODO: generate a real ID or use Firestore auto-ID
      email: input.email,
      name: input.name,
    })),

  // GET — fetch a single user by ID (stub)
  getById: publicProcedure
    .input(z.string())
    .output(UserSchema)
    .query(({ input }) => ({
      id: input,
      email: 'test@example.com',
      name: 'Test User',
    })),

  // GET — list all users (stub)
  list: publicProcedure.output(z.array(UserSchema)).query(() => [
    { id: 'user-1', email: 'user1@example.com', name: 'User One' },
    { id: 'user-2', email: 'user2@example.com', name: 'User Two' },
  ]),
})
