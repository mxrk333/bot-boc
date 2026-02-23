import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll } from "firebase/storage";

const firebaseConfig = {
  projectId: "boc-bot",
  storageBucket: "boc-bot.firebasestorage.app", // Guessing based on the URL in error
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

listAll(ref(storage, "pdfs"))
  .then(res => {
    console.log("PDFs Folder:");
    res.items.forEach(item => console.log(item.name));
  })
  .catch(e => console.error("Error reading pdfs:", e.message));

listAll(ref(storage, "boc-pdfs"))
  .then(res => {
    console.log("boc-pdfs Folder:");
    res.items.forEach(item => console.log(item.name));
  })
  .catch(e => console.error("Error reading boc-pdfs:", e.message));
  
listAll(ref(storage, ""))
  .then(res => {
    console.log("Root Folder:");
    res.items.forEach(item => console.log(item.name));
  })
  .catch(e => console.error("Error reading root:", e.message));
