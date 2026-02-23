import type { Request } from 'firebase-functions/v2/https'
import type { Response } from 'express'

export async function createContext({ req, res }: { req: Request; res: Response }) {
  return {
    req,
    res,
  }
}

// Modern way: Directly export the return type of the function
export type Context = Awaited<ReturnType<typeof createContext>>
