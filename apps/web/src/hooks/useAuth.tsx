/**
 * Authentication context & hook.
 *
 * Wraps Firebase Auth in a React context so any component can access
 * the current user and auth actions via `useAuth()`.
 *
 * Provides: login, signup, Google OAuth, logout, email verification,
 * and a way to refresh the cached user object.
 */

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
/*  Context shape                                                      */
/* ------------------------------------------------------------------ */

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName?: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  sendVerification: () => Promise<void>
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Subscribe to auth state changes (login / logout / token refresh)
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
    if (displayName) await updateProfile(cred.user, { displayName })
    await sendEmailVerification(cred.user)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const sendVerification = useCallback(async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser)
  }, [])

  /**
   * Reload the user from Firebase (picks up emailVerified etc.) and
   * return the updated user so callers can read fresh values immediately
   * without waiting for a re-render.
   */
  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!auth.currentUser) return null
    await reload(auth.currentUser)
    // Trigger a re-render by setting a new reference
    setUser(Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser))
    return auth.currentUser
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
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
