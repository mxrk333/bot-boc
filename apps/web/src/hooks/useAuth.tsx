import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendEmailVerification,
  reload,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

/* ------------------------------------------------------------------ */
/*  Context shape                                                     */
/* ------------------------------------------------------------------ */

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName?: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  sendVerification: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    // Send verification email immediately after signup
    await sendEmailVerification(cred.user)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  /** Resend the email verification link */
  const sendVerification = useCallback(async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
    }
  }, [])

  /** Reload user from Firebase to pick up emailVerified changes */
  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser)
      // Force a re-render with the updated user object
      setUser({ ...auth.currentUser } as User)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        sendVerification,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
