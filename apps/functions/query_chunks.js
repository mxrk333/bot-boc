const { initializeApp } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

const app = initializeApp({ projectId: 'boc-bot' });
const storage = getStorage(app);
const bucket = storage.bucket();

async function run() {
  const [files] = await bucket.getFiles({ prefix: 'boc-pdfs/' });
  console.log('boc-pdfs/ files:');
  files.forEach(file => {
    console.log(file.name);
  });
  const [files2] = await bucket.getFiles({ prefix: 'pdfs/' });
  console.log('pdfs/ files:');
  files2.forEach(file => {
    console.log(file.name);
  });
  
  const [allFiles] = await bucket.getFiles();
  console.log('\nAll files in bucket:');
  allFiles.forEach(file => {
    console.log(file.name);
  });
}
run();
