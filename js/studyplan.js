// ============================================
// Study Plan Page - 6-Month Timeline View
// ============================================

import store from './data.js';
import { escapeHTML, showToast } from './utils.js';

let rendered = false;

export function renderStudyPlanPage() {
  if (rendered) return;
  rendered = true;
  const page = document.getElementById('page-studyplan');
  page.innerHTML = buildHTML();
  bindEvents();
}

export function refreshStudyPlanPage() {
  rendered = false;
  renderStudyPlanPage();
}

function buildHTML() {
  // Group study plan entries by week
  const weeks = [];
  let currentWeek = null;

  for (let i = 0; i < store.studyPlan.length; i++) {
    const sp = store.studyPlan[i];
    if (!currentWeek || currentWeek.name !== sp.week) {
      currentWeek = { name: sp.week, days: [], topicFocus: sp.topicFocus };
      weeks.push(currentWeek);
    }
    currentWeek.days.push({ ...sp, index: i });
  }

  const totalSessions = store.studyPlan.length;
  const completedSessions = store.studyPlan.filter(s => s.status === 'completed').length;

  return `
    <div class="page-header">
      <h1>Study Plan</h1>
      <p>6-month roadmap &mdash; ${completedSessions} of ${totalSessions} sessions completed (${totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0}%)</p>
    </div>
    <div class="studyplan-container">
      ${weeks.map((w, wi) => buildWeek(w, wi)).join('')}
    </div>
  `;
}

function buildWeek(week, weekIndex) {
  const completedDays = week.days.filter(d => d.status === 'completed').length;
  const totalDays = week.days.length;
  const allDone = completedDays === totalDays;
  const someInProgress = completedDays > 0 && !allDone;

  const dotClass = allDone ? 'completed' : someInProgress ? 'in-progress' : '';

  return `
    <div class="week-group" data-week="${weekIndex}">
      <div class="week-header" data-toggle-week="${weekIndex}">
        <div class="week-dot ${dotClass}"></div>
        <span class="week-name">${escapeHTML(week.name)}</span>
        <span class="week-topic-badge">${escapeHTML(week.topicFocus)}</span>
        <span class="week-progress">${completedDays}/${totalDays}</span>
        <svg class="week-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="week-body" id="week-body-${weekIndex}">
        ${week.days.map(d => buildDay(d)).join('')}
      </div>
    </div>
  `;
}

function buildDay(day) {
  const isCompleted = day.status === 'completed';
  return `
    <div class="day-block">
      <div class="day-label">${escapeHTML(day.day)}</div>
      <div class="day-content">
        <div class="day-problems">${escapeHTML(day.problems)}</div>
        <div class="day-goal">${escapeHTML(day.goal)}</div>
        <div class="day-status">
          <button class="day-status-btn ${isCompleted ? 'completed' : ''}" data-sp-index="${day.index}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            ${isCompleted ? 'Completed' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  // Week toggle
  document.querySelectorAll('.week-header').forEach(header => {
    header.addEventListener('click', () => {
      const weekIdx = header.dataset.toggleWeek;
      const body = document.getElementById(`week-body-${weekIdx}`);
      header.classList.toggle('open');
      body.classList.toggle('open');
    });
  });

  // Day status toggle
  document.querySelectorAll('.day-status-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.spIndex);
      const sp = store.toggleStudyPlanStatus(index);
      if (sp) {
        const isCompleted = sp.status === 'completed';
        btn.classList.toggle('completed', isCompleted);
        btn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          ${isCompleted ? 'Completed' : 'Mark Complete'}
        `;
        // Update week dot
        const weekGroup = btn.closest('.week-group');
        if (weekGroup) updateWeekDot(weekGroup);
        showToast(isCompleted ? 'Session marked as completed!' : 'Session marked as pending', isCompleted ? 'success' : 'info');
      }
    });
  });

  // Auto-open first incomplete week
  const firstIncomplete = document.querySelector('.week-dot:not(.completed)');
  if (firstIncomplete) {
    const header = firstIncomplete.closest('.week-header');
    if (header) header.click();
  }
}

function updateWeekDot(weekGroup) {
  const btns = weekGroup.querySelectorAll('.day-status-btn');
  const total = btns.length;
  const completed = weekGroup.querySelectorAll('.day-status-btn.completed').length;
  const dot = weekGroup.querySelector('.week-dot');
  const progressEl = weekGroup.querySelector('.week-progress');

  dot.className = 'week-dot';
  if (completed === total) dot.classList.add('completed');
  else if (completed > 0) dot.classList.add('in-progress');

  if (progressEl) progressEl.textContent = `${completed}/${total}`;
}
