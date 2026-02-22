import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize only if not already initialized
if (!getApps().length) {
  initializeApp()
}

export const db = getFirestore()
