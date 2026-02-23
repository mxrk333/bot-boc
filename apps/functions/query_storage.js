import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199";
const app = initializeApp({ projectId: "boc-bot", storageBucket: "boc-bot.firebasestorage.app" });
const bucket = getStorage(app).bucket();

async function run() {
  const [files] = await bucket.getFiles();
  console.log("Files in emulator storage:");
  files.forEach(file => console.log(file.name));
}
run();
