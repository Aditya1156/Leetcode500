// ============================================
// Topics Page - Visual topic cards with progress
// ============================================

import store from './data.js';
import { escapeHTML, getTopicColor } from './utils.js';

let rendered = false;

export function renderTopicsPage() {
  if (rendered) return;
  rendered = true;
  const page = document.getElementById('page-topics');
  page.innerHTML = buildHTML();
  bindEvents();
}

export function refreshTopicsPage() {
  rendered = false;
  renderTopicsPage();
}

function buildHTML() {
  return `
    <div class="page-header">
      <h1>Topics</h1>
      <p>Master ${store.topicSummary.length} core DSA topics — click a card to view its problems</p>
    </div>
    <div class="topics-grid">
      ${store.topicSummary.map((t, i) => buildCard(t, i)).join('')}
    </div>
  `;
}

function buildCard(t, index) {
  const color = getTopicColor(index);
  const solved = store.getSolvedByTopic(t.topic);
  const pct = t.total > 0 ? Math.round((solved / t.total) * 100) : 0;
  const patterns = (t.keyPatterns || '').split(',').map(s => s.trim()).filter(Boolean);

  // Difficulty bar segments
  const easyW = t.total > 0 ? ((t.easy / t.total) * 100).toFixed(1) : 0;
  const mediumW = t.total > 0 ? ((t.medium / t.total) * 100).toFixed(1) : 0;
  const hardW = t.total > 0 ? ((t.hard / t.total) * 100).toFixed(1) : 0;

  // SVG ring
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fillLen = (pct / 100) * circ;

  return `
    <div class="topic-card" data-topic="${escapeHTML(t.topic)}" style="--card-accent:${color};animation-delay:${index * 60}ms">
      <div class="topic-card-header">
        <div>
          <div class="topic-card-name">${escapeHTML(t.topic)}</div>
          <div class="topic-card-count">${t.total} problems</div>
        </div>
        <div class="topic-ring-wrap">
          <svg viewBox="0 0 48 48" width="52" height="52">
            <circle cx="24" cy="24" r="${r}" fill="none" stroke="var(--bg-tertiary)" stroke-width="4"/>
            <circle cx="24" cy="24" r="${r}" fill="none" stroke="${color}" stroke-width="4"
              stroke-dasharray="${fillLen} ${circ}" stroke-dashoffset="0"
              transform="rotate(-90 24 24)" stroke-linecap="round"
              style="transition: stroke-dasharray 0.8s ease"/>
          </svg>
          <div class="topic-ring-text">${pct}%</div>
        </div>
      </div>

      <div class="topic-difficulty-bar">
        <div class="seg-easy" style="width:${easyW}%"></div>
        <div class="seg-medium" style="width:${mediumW}%"></div>
        <div class="seg-hard" style="width:${hardW}%"></div>
      </div>

      <div class="topic-diff-stats">
        <span><span class="easy-count">${t.easy}</span> Easy</span>
        <span><span class="medium-count">${t.medium}</span> Med</span>
        <span><span class="hard-count">${t.hard}</span> Hard</span>
        <span style="margin-left:auto;color:var(--accent);font-weight:600">${solved} solved</span>
      </div>

      <div class="topic-patterns">
        ${patterns.slice(0, 6).map(p => `<span class="pattern-pill">${escapeHTML(p)}</span>`).join('')}
        ${patterns.length > 6 ? `<span class="pattern-pill">+${patterns.length - 6}</span>` : ''}
      </div>
    </div>
  `;
}

function bindEvents() {
  document.querySelectorAll('.topic-card').forEach(card => {
    card.addEventListener('click', () => {
      const topic = card.dataset.topic;
      // Navigate to problems page with this topic filtered
      window.location.hash = 'problems';
      // Import dynamically to avoid circular deps
      setTimeout(() => {
        import('./problems.js').then(mod => {
          mod.setTopicFilter(topic);
        });
      }, 100);
    });
  });
}
