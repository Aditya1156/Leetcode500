import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCgNBSz_hoU7UPmFyF69QIhMUgeklsRLxo",
  authDomain: "polaroid-printer-pro.firebaseapp.com",
  projectId: "polaroid-printer-pro",
  storageBucket: "polaroid-printer-pro.firebasestorage.app",
  messagingSenderId: "967814761048",
  appId: "1:967814761048:web:f2453a8ce3dfcecaa5982d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const data = JSON.parse(readFileSync('./data.json', 'utf-8'));

console.log(`Loaded: ${data.problems.length} problems, ${data.studyPlan.length} study plan entries, ${data.topicSummary.length} topics`);

// Upload problems in chunks of 200
const chunkSize = 200;
const chunks = [];
for (let i = 0; i < data.problems.length; i += chunkSize) {
  chunks.push(data.problems.slice(i, i + chunkSize));
}

console.log(`Uploading ${chunks.length} problem chunks...`);
for (let i = 0; i < chunks.length; i++) {
  await setDoc(doc(db, 'appData', `problems_${i}`), {
    problems: chunks[i],
    chunkIndex: i,
    totalChunks: chunks.length
  });
  console.log(`  Chunk ${i + 1}/${chunks.length} (${chunks[i].length} problems)`);
}

console.log('Uploading study plan...');
await setDoc(doc(db, 'appData', 'studyPlan'), { studyPlan: data.studyPlan });
console.log(`  ${data.studyPlan.length} entries`);

console.log('Uploading topic summary...');
await setDoc(doc(db, 'appData', 'topicSummary'), { topicSummary: data.topicSummary });
console.log(`  ${data.topicSummary.length} topics`);

console.log('Uploading metadata...');
await setDoc(doc(db, 'appData', 'metadata'), {
  ...data.metadata,
  uploadedAt: new Date().toISOString()
});

console.log('\n=== UPLOAD COMPLETE ===');
process.exit(0);
