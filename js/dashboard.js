// ============================================
// Dashboard Page - Stats, Charts, Progress
// ============================================

import store from './data.js';
import { animateValue, getTopicColor, escapeHTML, getDifficultyClass, formatDate, LC_ICON_SVG } from './utils.js';

let rendered = false;

export function renderDashboard() {
  const page = document.getElementById('page-dashboard');
  page.innerHTML = buildHTML();
  animateStats();
  rendered = true;
}

export function refreshDashboard() {
  renderDashboard();
}

function buildHTML() {
  const total = store.metadata.totalProblems;
  const solved = store.getSolvedCount();
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const streak = store.getStreak();
  const byDiff = store.getSolvedByDifficulty();
  const recent = store.getRecentActivity(8);

  return `
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Your DSA journey at a glance</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Problems</div>
        <div class="stat-value" id="stat-total">0</div>
        <div class="stat-sub">${store.metadata.topics.length} topics covered</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Solved</div>
        <div class="stat-value accent-text" id="stat-solved">0</div>
        <div class="stat-sub">${total - solved} remaining</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Completion</div>
        <div class="stat-value success-text" id="stat-pct">0</div>
        <div class="stat-sub">of all problems</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Current Streak</div>
        <div class="stat-value" style="color:var(--medium)" id="stat-streak">0</div>
        <div class="stat-sub">${streak === 1 ? 'day' : 'days'} in a row</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="dashboard-row">
      <!-- Donut Chart -->
      <div class="card">
        <div class="card-title"><span class="dot"></span> Difficulty Distribution</div>
        <div class="donut-container">
          <div class="donut-wrap">
            ${buildDonutSVG(byDiff, solved)}
            <div class="donut-center">
              <div class="donut-center-value">${solved}</div>
              <div class="donut-center-label">solved</div>
            </div>
          </div>
          <div class="donut-legend">
            ${buildLegendItem('Easy', byDiff.easy, store.metadata.totalEasy, 'var(--easy)')}
            ${buildLegendItem('Medium', byDiff.medium, store.metadata.totalMedium, 'var(--medium)')}
            ${buildLegendItem('Hard', byDiff.hard, store.metadata.totalHard, 'var(--hard)')}
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-title"><span class="dot"></span> Recent Activity</div>
        ${recent.length > 0 ? `
          <div class="recent-list">
            ${recent.map(p => `
              <div class="recent-item">
                <span class="badge ${getDifficultyClass(p.difficulty)}" style="min-width:55px;justify-content:center">${escapeHTML(p.difficulty)}</span>
                <div class="recent-item-name">
                  <a href="${escapeHTML(p.link)}" target="_blank" rel="noopener">${LC_ICON_SVG} ${escapeHTML(p.name)}</a>
                </div>
                <span class="recent-item-date">${formatDate(p.dateSolved)}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">&#128640;</div>
            <div class="empty-state-text">Start solving problems to see your activity here!</div>
          </div>
        `}
      </div>
    </div>

    <!-- Topic Progress -->
    <div class="card">
      <div class="card-title"><span class="dot"></span> Topic Progress</div>
      <div class="topic-progress-grid">
        ${store.topicSummary.map((t, i) => {
          const solvedCount = store.getSolvedByTopic(t.topic);
          const pctTopic = t.total > 0 ? Math.round((solvedCount / t.total) * 100) : 0;
          return `
            <div class="topic-progress-item">
              <span class="topic-progress-name" title="${escapeHTML(t.topic)}">${escapeHTML(t.topic)}</span>
              <div class="topic-progress-bar">
                <div class="topic-progress-fill" style="width:${pctTopic}%;background:linear-gradient(90deg, ${getTopicColor(i)}, ${getTopicColor(i)}88)"></div>
              </div>
              <span class="topic-progress-count">${solvedCount}/${t.total}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function buildDonutSVG(byDiff, solved) {
  const total = solved || 1;
  const r = 50;
  const circumference = 2 * Math.PI * r;

  const easyPct = byDiff.easy / total;
  const mediumPct = byDiff.medium / total;
  const hardPct = byDiff.hard / total;

  const easyLen = easyPct * circumference;
  const mediumLen = mediumPct * circumference;
  const hardLen = hardPct * circumference;

  const easyOffset = 0;
  const mediumOffset = easyLen;
  const hardOffset = easyLen + mediumLen;

  if (solved === 0) {
    return `
      <svg class="donut-svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--bg-tertiary)" stroke-width="10"/>
      </svg>
    `;
  }

  return `
    <svg class="donut-svg" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--bg-tertiary)" stroke-width="10"/>
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--easy)" stroke-width="10"
        stroke-dasharray="${easyLen} ${circumference}" stroke-dashoffset="0"
        transform="rotate(-90 60 60)" stroke-linecap="round"
        style="transition: stroke-dasharray 0.8s ease"/>
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--medium)" stroke-width="10"
        stroke-dasharray="${mediumLen} ${circumference}" stroke-dashoffset="${-mediumOffset}"
        transform="rotate(-90 60 60)" stroke-linecap="round"
        style="transition: stroke-dasharray 0.8s ease"/>
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--hard)" stroke-width="10"
        stroke-dasharray="${hardLen} ${circumference}" stroke-dashoffset="${-hardOffset}"
        transform="rotate(-90 60 60)" stroke-linecap="round"
        style="transition: stroke-dasharray 0.8s ease"/>
    </svg>
  `;
}

function buildLegendItem(label, solved, total, color) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return `
    <div class="legend-item">
      <div class="legend-dot" style="background:${color}"></div>
      <div class="legend-info">
        <div class="legend-label">${label}</div>
        <div class="legend-count">${solved} / ${total} solved</div>
        <div class="legend-bar">
          <div class="legend-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>
    </div>
  `;
}

function animateStats() {
  const total = store.metadata.totalProblems;
  const solved = store.getSolvedCount();
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const streak = store.getStreak();

  const elTotal = document.getElementById('stat-total');
  const elSolved = document.getElementById('stat-solved');
  const elPct = document.getElementById('stat-pct');
  const elStreak = document.getElementById('stat-streak');

  if (elTotal) animateValue(elTotal, 0, total, 1200);
  if (elSolved) animateValue(elSolved, 0, solved, 1200);
  if (elPct) {
    const startTime = performance.now();
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / 1200, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      elPct.textContent = Math.round(pct * ease) + '%';
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
  if (elStreak) animateValue(elStreak, 0, streak, 800);
}
