// ============================================
// Firebase Configuration
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyCgNBSz_hoU7UPmFyF69QIhMUgeklsRLxo",
  authDomain: "polaroid-printer-pro.firebaseapp.com",
  projectId: "polaroid-printer-pro",
  storageBucket: "polaroid-printer-pro.firebasestorage.app",
  messagingSenderId: "967814761048",
  appId: "1:967814761048:web:f2453a8ce3dfcecaa5982d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
