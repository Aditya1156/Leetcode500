// ============================================
// Firestore Database Layer
// Handles all reads/writes to Firebase
// Falls back to localStorage when offline
// ============================================

import { db, auth, googleProvider } from './firebase-config.js';
import {
  doc, getDoc, setDoc
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import {
  signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';

class FirebaseDB {
  constructor() {
    this.user = null;
    this._authListeners = [];
    this._initAuth();
  }

  // --- Auth ---
  _initAuth() {
    // Check for redirect result on page load
    getRedirectResult(auth).catch(err => {
      console.error('Redirect result error:', err);
    });

    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this._authListeners.forEach(fn => fn(user));
    });
  }

  onAuthChange(fn) {
    this._authListeners.push(fn);
    // onAuthStateChanged in _initAuth() fires with current state automatically
  }

  async signIn() {
    try {
      await signInWithRedirect(auth, googleProvider);
      // User will be redirected to Google sign-in
      // On return, getRedirectResult in _initAuth will handle the result
    } catch (err) {
      console.error('Sign-in failed:', err);
      throw err;
    }
  }

  async signOutUser() {
    await signOut(auth);
    this.user = null;
  }

  get isSignedIn() {
    return !!this.user;
  }

  get uid() {
    return this.user?.uid || null;
  }

  get userDisplayName() {
    return this.user?.displayName || '';
  }

  get userPhoto() {
    return this.user?.photoURL || '';
  }

  get userEmail() {
    return this.user?.email || '';
  }

  // --- Firestore document path ---
  _docRef() {
    if (!this.uid) return null;
    return doc(db, 'users', this.uid, 'data', 'progress');
  }

  // --- Load progress from Firestore ---
  async loadProgress() {
    const ref = this._docRef();
    if (!ref) return null;
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      console.error('Firestore load failed:', err);
      return null;
    }
  }

  // --- Save full progress to Firestore ---
  async saveProgress(data) {
    const ref = this._docRef();
    if (!ref) return;
    try {
      await setDoc(ref, {
        ...data,
        lastUpdated: new Date().toISOString(),
        userEmail: this.userEmail
      });
    } catch (err) {
      console.error('Firestore save failed:', err);
    }
  }

  // --- Load base app data (problems, studyPlan, topicSummary, metadata) from Firestore ---
  async loadAppData() {
    try {
      // Load metadata first to get chunk count
      const metaSnap = await getDoc(doc(db, 'appData', 'metadata'));
      if (!metaSnap.exists()) return null;
      const metadata = metaSnap.data();

      // Load all problem chunks
      let problems = [];
      let chunkIdx = 0;
      while (true) {
        const snap = await getDoc(doc(db, 'appData', `problems_${chunkIdx}`));
        if (!snap.exists()) break;
        problems = problems.concat(snap.data().problems);
        chunkIdx++;
      }

      // Load study plan and topic summary
      const [spSnap, tsSnap] = await Promise.all([
        getDoc(doc(db, 'appData', 'studyPlan')),
        getDoc(doc(db, 'appData', 'topicSummary'))
      ]);

      return {
        problems,
        studyPlan: spSnap.exists() ? spSnap.data().studyPlan : [],
        topicSummary: tsSnap.exists() ? tsSnap.data().topicSummary : [],
        metadata
      };
    } catch (err) {
      console.error('Failed to load app data from Firestore:', err);
      return null;
    }
  }

}

const firebaseDB = new FirebaseDB();
export default firebaseDB;
