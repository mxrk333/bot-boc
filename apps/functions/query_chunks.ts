import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
initializeApp({ projectId: 'boc-bot' })
const db = getFirestore()

async function run() {
  try {
    const snap = await db.collection('faq_chunks').limit(5).get()
    snap.docs.forEach((doc, i) => {
      console.log(`Doc ${i + 1} metadata:`, doc.data().metadata)
    })
  } catch (err) {
    console.error('Error:', err)
  }
}

run()
