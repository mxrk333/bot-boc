/**
 * Firebase SDK initialisation.
 *
 * All Firebase services used by the app are initialised here and
 * exported as singletons. Import from this file rather than calling
 * getAuth() / getFirestore() etc. elsewhere.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getFunctions, type Functions } from 'firebase/functions'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

/* ------------------------------------------------------------------ */
/*  Config (pulled from Vite env vars at build time)                  */
/* ------------------------------------------------------------------ */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/* ------------------------------------------------------------------ */
/*  App instance (prevents duplicate init on hot-reload)              */
/* ------------------------------------------------------------------ */

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

/* ------------------------------------------------------------------ */
/*  Service singletons                                                */
/* ------------------------------------------------------------------ */

export const auth: Auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export const db: Firestore = getFirestore(app)

export const storage: FirebaseStorage = getStorage(app)

// Region must match where the Cloud Functions are deployed
export const functions: Functions = getFunctions(app, 'asia-southeast1')

/* ------------------------------------------------------------------ */
/*  Analytics (only initialised when the browser supports it)         */
/* ------------------------------------------------------------------ */

export let analytics: Analytics | undefined
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) analytics = getAnalytics(app)
  })
}
