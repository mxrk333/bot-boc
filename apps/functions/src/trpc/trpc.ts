/**
 * tRPC base setup.
 *
 * Creates the core tRPC instance and exports the building blocks
 * used by every router file:
 *  - router           — defines a group of procedures
 *  - publicProcedure  — a procedure with no auth middleware
 *  - createCallerFactory — for server-side testing without HTTP
 */

import { initTRPC } from '@trpc/server'

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory
