// ============================================
// Data Store - Central data management layer
// Syncs with Firebase Firestore + localStorage cache
// ============================================

import firebaseDB from './db.js';

const LS_STATUS_KEY = 'lc-tracker-status';
const LS_STUDYPLAN_KEY = 'lc-tracker-studyplan';
const LS_NOTES_KEY = 'lc-tracker-notes';
const LS_APPDATA_KEY = 'lc-tracker-appdata';

class DataStore {
  constructor() {
    this.problems = [];
    this.studyPlan = [];
    this.topicSummary = [];
    this.metadata = {};
    this._listeners = {};
  }

  // --- Event emitter ---
  on(event, fn) {
    (this._listeners[event] ??= []).push(fn);
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }

  // --- Load data from Firestore (with localStorage cache) ---
  async init() {
    // Try localStorage cache first for instant load
    const cached = this._getLS(LS_APPDATA_KEY);
    let json = null;

    // Load from Firestore
    try {
      const firestoreData = await firebaseDB.loadAppData();
      if (firestoreData && firestoreData.problems.length > 0) {
        json = firestoreData;
        // Cache for next time
        this._setLS(LS_APPDATA_KEY, json);
      }
    } catch (err) {
      console.warn('Firestore load failed, trying cache:', err);
    }

    // Fall back to localStorage cache
    if (!json && cached) {
      json = cached;
      console.log('Loaded from localStorage cache');
    }

    // Last resort: try data.json (for first-time setup before upload)
    if (!json) {
      try {
        const res = await fetch('./data.json');
        if (res.ok) {
          json = await res.json();
          console.log('Loaded from data.json fallback');
        }
      } catch (e) {
        console.warn('data.json fallback also failed');
      }
    }

    if (!json) {
      throw new Error('No data available. Please run admin-upload.html to upload data to Firestore first.');
    }

    this.problems = json.problems;
    this.studyPlan = json.studyPlan;
    this.topicSummary = json.topicSummary;
    this.metadata = json.metadata;

    // User progress is loaded via syncFromCloud() after init()
    this.emit('ready');
  }

  // --- Called after sign-in: load user progress from Firestore ---
  async syncFromCloud() {
    const cloudData = await firebaseDB.loadProgress();
    if (cloudData) {
      // Cloud data exists - apply it
      if (cloudData.status) this._setLS(LS_STATUS_KEY, cloudData.status);
      if (cloudData.notes) this._setLS(LS_NOTES_KEY, cloudData.notes);
      if (cloudData.studyPlan) this._setLS(LS_STUDYPLAN_KEY, cloudData.studyPlan);

      this._resetToBase();
      this._mergeFromObject(
        cloudData.status || {},
        cloudData.notes || {},
        cloudData.studyPlan || {}
      );
      this.emit('data-changed');
      this.emit('sync-complete', 'downloaded');
    } else {
      // No cloud data — check if there's local progress to migrate
      const localStatus = this._getLS(LS_STATUS_KEY);
      const localNotes = this._getLS(LS_NOTES_KEY);
      const localStudyPlan = this._getLS(LS_STUDYPLAN_KEY);

      if (localStatus || localNotes || localStudyPlan) {
        this._mergeFromObject(localStatus, localNotes, localStudyPlan);
        await this._pushToCloud();
        this.emit('data-changed');
        this.emit('sync-complete', 'migrated');
      } else {
        // Fresh user, no data anywhere
        this.emit('sync-complete', 'fresh');
      }
    }
  }

  // Reset problems/studyPlan to their original JSON state before re-merging
  _resetToBase() {
    for (const p of this.problems) {
      p.status = 'unsolved';
      p.dateSolved = null;
      p.notes = '';
    }
    for (const sp of this.studyPlan) {
      sp.status = 'pending';
    }
  }

  _mergeFromObject(statusObj, notesObj, studyPlanObj) {
    if (statusObj) {
      for (const p of this.problems) {
        if (statusObj[p.id]) {
          p.status = statusObj[p.id].status || p.status;
          p.dateSolved = statusObj[p.id].dateSolved || p.dateSolved;
        }
      }
    }
    if (notesObj) {
      for (const p of this.problems) {
        if (notesObj[p.id] !== undefined) {
          p.notes = notesObj[p.id];
        }
      }
    }
    if (studyPlanObj) {
      for (let i = 0; i < this.studyPlan.length; i++) {
        if (studyPlanObj[i]) {
          this.studyPlan[i].status = studyPlanObj[i];
        }
      }
    }
  }

  // Push current localStorage state to Firestore
  async _pushToCloud() {
    if (!firebaseDB.isSignedIn) return;
    await firebaseDB.saveProgress({
      status: this._getLS(LS_STATUS_KEY) || {},
      notes: this._getLS(LS_NOTES_KEY) || {},
      studyPlan: this._getLS(LS_STUDYPLAN_KEY) || {}
    });
  }

  // Debounced cloud sync after any change
  _scheduleCloudSync() {
    if (!firebaseDB.isSignedIn) return;
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this._pushToCloud(), 2000);
  }

  _getLS(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  }

  _setLS(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // --- Problem status ---
  toggleStatus(problemId) {
    const p = this.problems.find(x => x.id === problemId);
    if (!p) return;
    const wasSolved = p.status === 'solved';
    p.status = wasSolved ? 'unsolved' : 'solved';
    p.dateSolved = wasSolved ? null : new Date().toISOString().split('T')[0];

    const saved = this._getLS(LS_STATUS_KEY) || {};
    saved[problemId] = { status: p.status, dateSolved: p.dateSolved };
    this._setLS(LS_STATUS_KEY, saved);
    this.emit('status-changed', p);
    this._scheduleCloudSync();
    return p;
  }

  // --- Notes ---
  updateNotes(problemId, text) {
    const p = this.problems.find(x => x.id === problemId);
    if (!p) return;
    p.notes = text;
    const saved = this._getLS(LS_NOTES_KEY) || {};
    saved[problemId] = text;
    this._setLS(LS_NOTES_KEY, saved);
    this._scheduleCloudSync();
  }

  // --- Study plan status ---
  toggleStudyPlanStatus(index) {
    const sp = this.studyPlan[index];
    if (!sp) return;
    sp.status = sp.status === 'completed' ? 'pending' : 'completed';
    const saved = this._getLS(LS_STUDYPLAN_KEY) || {};
    saved[index] = sp.status;
    this._setLS(LS_STUDYPLAN_KEY, saved);
    this.emit('studyplan-changed', { index, status: sp.status });
    this._scheduleCloudSync();
    return sp;
  }

  // --- Computed stats ---
  getSolvedCount() {
    return this.problems.filter(p => p.status === 'solved').length;
  }

  getSolvedByDifficulty() {
    const result = { easy: 0, medium: 0, hard: 0 };
    for (const p of this.problems) {
      if (p.status === 'solved') {
        const d = (p.difficulty || '').toLowerCase();
        if (result[d] !== undefined) result[d]++;
      }
    }
    return result;
  }

  getSolvedByTopic(topic) {
    return this.problems.filter(p => p.topic === topic && p.status === 'solved').length;
  }

  getTotalByTopic(topic) {
    return this.problems.filter(p => p.topic === topic).length;
  }

  getStreak() {
    const dates = this.problems
      .filter(p => p.status === 'solved' && p.dateSolved)
      .map(p => p.dateSolved)
      .filter(d => d && d !== 'None' && d !== 'null');
    if (dates.length === 0) return 0;

    const unique = [...new Set(dates)].sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    if (unique[0] !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (unique[0] !== yesterday) return 0;
    }

    let streak = 1;
    for (let i = 1; i < unique.length; i++) {
      const prev = new Date(unique[i - 1]);
      const curr = new Date(unique[i]);
      const diff = (prev - curr) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }

  getRecentActivity(limit = 10) {
    return this.problems
      .filter(p => p.status === 'solved' && p.dateSolved && p.dateSolved !== 'None')
      .sort((a, b) => (b.dateSolved || '').localeCompare(a.dateSolved || ''))
      .slice(0, limit);
  }

  // --- Export all progress as JSON ---
  exportProgress() {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      status: this._getLS(LS_STATUS_KEY) || {},
      notes: this._getLS(LS_NOTES_KEY) || {},
      studyPlan: this._getLS(LS_STUDYPLAN_KEY) || {},
      theme: localStorage.getItem('lc-tracker-theme') || 'dark'
    }, null, 2);
  }

  // --- Import progress from JSON ---
  importProgress(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data || !data.version) throw new Error('Invalid backup file');

    if (data.status) this._setLS(LS_STATUS_KEY, data.status);
    if (data.notes) this._setLS(LS_NOTES_KEY, data.notes);
    if (data.studyPlan) this._setLS(LS_STUDYPLAN_KEY, data.studyPlan);
    if (data.theme) localStorage.setItem('lc-tracker-theme', data.theme);

    this._resetToBase();
    this._mergeFromObject(data.status, data.notes, data.studyPlan);
    this.emit('data-changed');
    this.emit('import-complete');
    this._scheduleCloudSync();
  }

  // --- Flush pending cloud sync immediately ---
  flushSync() {
    if (this._syncTimer) {
      clearTimeout(this._syncTimer);
      this._syncTimer = null;
      this._pushToCloud();
    }
  }

  // --- Clear user progress on sign-out ---
  clearUserProgress() {
    this._resetToBase();
    localStorage.removeItem(LS_STATUS_KEY);
    localStorage.removeItem(LS_NOTES_KEY);
    localStorage.removeItem(LS_STUDYPLAN_KEY);
    this.emit('data-changed');
  }

  getFilteredProblems({ topic, difficulty, status, priority, pattern, search } = {}) {
    return this.problems.filter(p => {
      if (topic && p.topic !== topic) return false;
      if (difficulty && p.difficulty !== difficulty) return false;
      if (status === 'solved' && p.status !== 'solved') return false;
      if (status === 'unsolved' && p.status !== 'unsolved') return false;
      if (priority && p.priority !== priority) return false;
      if (pattern && p.pattern !== pattern) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${p.name} ${p.lcNumber} ${p.pattern} ${p.topic} ${p.keyInsight} ${p.notes || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }
}

// Singleton
const store = new DataStore();
export default store;
