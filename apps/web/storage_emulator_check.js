import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll } from "firebase/storage";
import { connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  projectId: "boc-bot",
  storageBucket: "boc-bot.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
connectStorageEmulator(storage, "localhost", 9199);

listAll(ref(storage, "boc-pdfs"))
  .then(res => {
    console.log("boc-pdfs Folder in Emulator:");
    res.items.forEach(item => console.log(item.name));
  })
  .catch(e => console.error("Error reading boc-pdfs:", e.message));
