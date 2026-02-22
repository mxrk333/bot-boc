// No need to import inferAsyncReturnType anymore
export async function createContext({ req, res }: { req: any; res: any }) {
  return {
    req,
    res,
  }
}

// Modern way: Directly export the return type of the function
export type Context = Awaited<ReturnType<typeof createContext>>
