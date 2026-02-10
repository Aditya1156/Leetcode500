// ============================================
// App - Router, Theme, Search Modal, Auth, Init
// ============================================

import store from './data.js';
import firebaseDB from './db.js';
import { renderDashboard, refreshDashboard } from './dashboard.js';
import { renderProblemsPage, refreshProblemsTable, resetProblemsPage } from './problems.js';
import { renderTopicsPage, refreshTopicsPage } from './topics.js';
import { renderStudyPlanPage, refreshStudyPlanPage } from './studyplan.js';
import { debounce, escapeHTML, getDifficultyClass, showToast, LC_ICON_SVG } from './utils.js';

const LS_THEME_KEY = 'lc-tracker-theme';

// ============================================
// Router
// ============================================
const pages = {
  dashboard: { render: renderDashboard, el: null },
  problems: { render: renderProblemsPage, el: null },
  studyplan: { render: renderStudyPlanPage, el: null },
  topics: { render: renderTopicsPage, el: null },
};

function navigate() {
  const hash = location.hash.slice(1) || 'dashboard';
  const page = pages[hash] ? hash : 'dashboard';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });

  if (pages[page]) pages[page].render();
  document.querySelector('.nav-links')?.classList.remove('mobile-open');
}

// ============================================
// Theme
// ============================================
function initTheme() {
  const saved = localStorage.getItem(LS_THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcons(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(LS_THEME_KEY, next);
  updateThemeIcons(next);
}

function updateThemeIcons(theme) {
  document.querySelectorAll('.icon-moon').forEach(el => {
    el.classList.toggle('hidden', theme !== 'dark');
  });
  document.querySelectorAll('.icon-sun').forEach(el => {
    el.classList.toggle('hidden', theme === 'dark');
  });
  const themeSwitch = document.getElementById('sidebar-theme-switch');
  if (themeSwitch) themeSwitch.checked = theme === 'light';
  const themeLabel = document.getElementById('sidebar-theme-label');
  if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
}

// ============================================
// Search Modal
// ============================================
let searchResults = [];
let searchActiveIndex = -1;

function openSearchModal() {
  const modal = document.getElementById('search-modal');
  modal.classList.remove('hidden');
  const input = document.getElementById('global-search');
  input.value = '';
  input.focus();
  document.getElementById('search-results').innerHTML = '';
  searchResults = [];
  searchActiveIndex = -1;
}

function closeSearchModal() {
  document.getElementById('search-modal').classList.add('hidden');
}

function handleSearchInput(query) {
  const resultsEl = document.getElementById('search-results');
  if (!query.trim()) {
    resultsEl.innerHTML = '';
    searchResults = [];
    searchActiveIndex = -1;
    return;
  }

  const q = query.toLowerCase();
  searchResults = store.problems.filter(p => {
    const haystack = `${p.name} ${p.lcNumber} ${p.pattern} ${p.topic} ${p.keyInsight}`.toLowerCase();
    return haystack.includes(q);
  }).slice(0, 12);

  searchActiveIndex = -1;

  if (searchResults.length === 0) {
    resultsEl.innerHTML = '<div class="search-no-results">No problems found</div>';
    return;
  }

  resultsEl.innerHTML = searchResults.map((p, i) => `
    <div class="search-result-item" data-index="${i}" data-link="${escapeHTML(p.link)}">
      <span class="search-result-num">LC ${escapeHTML(p.lcNumber)}</span>
      <span class="badge ${getDifficultyClass(p.difficulty)}" style="min-width:50px;justify-content:center;font-size:0.68rem">${escapeHTML(p.difficulty)}</span>
      <span class="search-result-name">${escapeHTML(p.name)}</span>
      <span class="search-result-topic">${escapeHTML(p.topic)}</span>
    </div>
  `).join('');
}

function handleSearchKeydown(e) {
  const items = document.querySelectorAll('.search-result-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchActiveIndex = Math.min(searchActiveIndex + 1, items.length - 1);
    updateSearchActive(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchActiveIndex = Math.max(searchActiveIndex - 1, 0);
    updateSearchActive(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (searchActiveIndex >= 0 && searchResults[searchActiveIndex]) {
      window.open(searchResults[searchActiveIndex].link, '_blank');
      closeSearchModal();
    }
  } else if (e.key === 'Escape') {
    closeSearchModal();
  }
}

function updateSearchActive(items) {
  items.forEach((item, i) => {
    item.classList.toggle('active', i === searchActiveIndex);
    if (i === searchActiveIndex) item.scrollIntoView({ block: 'nearest' });
  });
}

// ============================================
// Auth - Google Sign In / Out
// ============================================
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

function setAvatarWithFallback(imgEl, fallbackEl, photoURL, displayName) {
  const initials = getInitials(displayName);
  if (fallbackEl) fallbackEl.textContent = initials;

  if (photoURL) {
    imgEl.src = photoURL;
    imgEl.alt = displayName || '';
    imgEl.classList.remove('hidden');
    fallbackEl?.classList.add('hidden');
    imgEl.onerror = () => {
      imgEl.classList.add('hidden');
      fallbackEl?.classList.remove('hidden');
    };
  } else {
    imgEl.classList.add('hidden');
    fallbackEl?.classList.remove('hidden');
  }
}

function updateAuthUI(user) {
  const signInBtn = document.getElementById('sign-in-btn');
  const userProfile = document.getElementById('user-profile');
  const avatar = document.getElementById('user-avatar');
  const avatarFallback = document.getElementById('user-avatar-fallback');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarAvatarFallback = document.getElementById('sidebar-avatar-fallback');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');

  if (user) {
    signInBtn?.classList.add('hidden');
    userProfile?.classList.remove('hidden');
    if (avatar) setAvatarWithFallback(avatar, avatarFallback, user.photoURL, user.displayName);
    if (sidebarAvatar) setAvatarWithFallback(sidebarAvatar, sidebarAvatarFallback, user.photoURL, user.displayName);
    if (userName) userName.textContent = user.displayName || 'User';
    if (userEmail) userEmail.textContent = user.email || '';
  } else {
    signInBtn?.classList.remove('hidden');
    userProfile?.classList.add('hidden');
    closeSidebar();
  }
}

function openSidebar() {
  const sidebar = document.getElementById('profile-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  sidebar?.classList.add('open');
  backdrop?.classList.remove('hidden');
  setTimeout(() => backdrop?.classList.add('open'), 10);
}

function closeSidebar() {
  const sidebar = document.getElementById('profile-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  sidebar?.classList.remove('open');
  backdrop?.classList.remove('open');
  setTimeout(() => backdrop?.classList.add('hidden'), 300);
}

function showSyncIndicator(syncing) {
  const indicator = document.getElementById('sync-indicator');
  if (!indicator) return;
  if (syncing) {
    indicator.classList.remove('hidden');
    indicator.classList.add('syncing');
  } else {
    indicator.classList.remove('syncing');
    indicator.classList.remove('hidden');
  }
}

async function handleSignIn() {
  try {
    await firebaseDB.signIn();
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showToast('Sign-in failed. Please try again.', 'info');
    }
  }
}

function confirmSignOut() {
  closeSidebar();
  const modal = document.getElementById('logout-modal');
  if (modal) modal.classList.remove('hidden');
}

function dismissLogoutModal() {
  const modal = document.getElementById('logout-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleSignOut() {
  dismissLogoutModal();
  await firebaseDB.signOutUser();
  document.getElementById('sync-indicator')?.classList.add('hidden');
  store.clearUserProgress();
  resetProblemsPage();
}

// ============================================
// Data change listener
// ============================================
function onDataChanged() {
  refreshDashboard();
  refreshTopicsPage();
}

// ============================================
// Bind app event listeners (called once on first auth)
// ============================================
let appEventsBound = false;

function bindAppEventListeners() {
  if (appEventsBound) return;
  appEventsBound = true;

  // Router
  window.addEventListener('hashchange', navigate);

  // Theme toggle (navbar)
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  // Search
  document.getElementById('search-trigger')?.addEventListener('click', openSearchModal);
  document.querySelector('.modal-backdrop')?.addEventListener('click', closeSearchModal);
  document.getElementById('global-search')?.addEventListener('input', debounce(e => {
    handleSearchInput(e.target.value);
  }, 150));
  document.getElementById('global-search')?.addEventListener('keydown', handleSearchKeydown);

  // Search result click (delegated)
  document.getElementById('search-results')?.addEventListener('click', e => {
    const item = e.target.closest('.search-result-item');
    if (item) {
      const link = item.dataset.link;
      if (link) window.open(link, '_blank');
      closeSearchModal();
    }
  });

  // Ctrl+K global shortcut
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const modal = document.getElementById('search-modal');
      if (modal.classList.contains('hidden')) openSearchModal();
      else closeSearchModal();
    }
    if (e.key === 'Escape') {
      closeSearchModal();
    }
  });

  // Auth (navbar)
  document.getElementById('sign-in-btn')?.addEventListener('click', handleSignIn);
  document.getElementById('sign-out-btn')?.addEventListener('click', confirmSignOut);
  document.getElementById('navbar-logout-btn')?.addEventListener('click', confirmSignOut);

  // Profile sidebar
  document.getElementById('sidebar-trigger')?.addEventListener('click', openSidebar);
  document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);
  document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);

  // Sidebar theme toggle
  document.getElementById('sidebar-theme-switch')?.addEventListener('change', toggleTheme);

  // Logout confirmation modal
  document.getElementById('logout-confirm-btn')?.addEventListener('click', handleSignOut);
  document.getElementById('logout-cancel-btn')?.addEventListener('click', dismissLogoutModal);
  document.getElementById('logout-modal')?.querySelector('.modal-backdrop')?.addEventListener('click', dismissLogoutModal);

  // Listen for data changes
  store.on('data-changed', onDataChanged);
}

// ============================================
// Auth Gating - Show landing or app based on auth
// ============================================
let appInitialized = false;

function setupAuthGating() {
  const landingPage = document.getElementById('landing-page');
  const navbar = document.getElementById('navbar');
  const app = document.getElementById('app');
  const mobileTabBar = document.getElementById('mobile-tab-bar');

  firebaseDB.onAuthChange(async (user) => {
    const loadingOverlay = document.getElementById('auth-loading');

    if (user) {
      // --- User is signed in: show the app ---
      landingPage.classList.add('hidden');
      navbar.classList.remove('hidden');
      app.classList.remove('hidden');
      mobileTabBar?.classList.remove('hidden');

      if (!appInitialized) {
        // First time: load data and initialize the full app
        try {
          showSyncIndicator(true);
          await store.init();
          await store.syncFromCloud();
          showSyncIndicator(false);

          bindAppEventListeners();
          navigate();
          appInitialized = true;

          showToast(`Welcome, ${user.displayName?.split(' ')[0]}!`, 'success');
        } catch (err) {
          console.error('App init failed:', err);
          showToast('Failed to load data. Please refresh.', 'info');
        }
      } else {
        // Returning after sign-out: re-sync with cloud
        try {
          showSyncIndicator(true);
          await store.syncFromCloud();
          showSyncIndicator(false);
          navigate();
          showToast(`Welcome back, ${user.displayName?.split(' ')[0]}!`, 'success');
        } catch (err) {
          showSyncIndicator(false);
          showToast('Sync failed. Please try again.', 'info');
        }
      }

      updateAuthUI(user);

    } else {
      // --- User is NOT signed in: show landing page ---
      navbar.classList.add('hidden');
      app.classList.add('hidden');
      mobileTabBar?.classList.add('hidden');
      landingPage.classList.remove('hidden');

      updateAuthUI(null);
    }

    // Remove loading overlay after first auth check
    if (loadingOverlay && !loadingOverlay.classList.contains('fade-out')) {
      loadingOverlay.classList.add('fade-out');
      setTimeout(() => loadingOverlay.remove(), 400);
    }
  });
}

// ============================================
// Init
// ============================================
function init() {
  initTheme();

  // Landing page bindings (always available)
  document.getElementById('landing-sign-in-btn')?.addEventListener('click', handleSignIn);
  document.getElementById('landing-theme-toggle')?.addEventListener('click', toggleTheme);

  // Auth gating handles everything else
  setupAuthGating();
}

init();
