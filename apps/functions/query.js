const admin = require('firebase-admin')
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
admin.initializeApp({ projectId: 'boc-bot' })
async function run() {
  const db = admin.firestore()
  const snap = await db.collection('faq_chunks').limit(1).get()
  snap.forEach(doc => console.log(doc.data().metadata))
  process.exit(0)
}
run()
