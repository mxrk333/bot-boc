import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Prevent duplicate initialization
export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Auth
export const auth: Auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Firestore
export const db: Firestore = getFirestore(app)

// Storage
import { getStorage, FirebaseStorage } from 'firebase/storage'
export const storage: FirebaseStorage = getStorage(app)

// Functions (region must match the deployed function region)
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions'
export const functions: Functions = getFunctions(app, 'asia-southeast1')

// Connect to emulator in development
if (location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001)
}

// Analytics (safe)
export let analytics: Analytics | undefined
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) analytics = getAnalytics(app)
  })
}
