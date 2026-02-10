// ============================================
// Problems Page - Table, Filters, Sort, Status
// ============================================

import store from './data.js';
import { debounce, escapeHTML, getDifficultyClass, getPriorityClass, showToast, LC_ICON_SVG } from './utils.js';

let currentFilters = { topic: '', difficulty: '', status: '', priority: '', pattern: '', search: '' };
let sortState = { column: 'id', direction: 'asc' };
let rendered = false;

function updateActiveFilterCount() {
  const count = ['topic', 'difficulty', 'status', 'priority', 'pattern'].filter(k => currentFilters[k]).length;
  const el = document.getElementById('filter-active-count');
  if (el) el.textContent = count > 0 ? count : '';
}

export function renderProblemsPage() {
  if (rendered) return;
  rendered = true;
  const page = document.getElementById('page-problems');
  page.innerHTML = buildHTML();
  bindEvents();
  renderTable();
}

export function refreshProblemsTable() {
  renderTable();
}

export function resetProblemsPage() {
  rendered = false;
}

export function setTopicFilter(topic) {
  currentFilters.topic = topic;
  const sel = document.getElementById('filter-topic');
  if (sel) sel.value = topic;
  renderTable();
}

function buildHTML() {
  const topics = store.metadata.topics || [];
  const priorities = store.metadata.priorities || [];
  const patterns = store.metadata.patterns || [];

  return `
    <div class="page-header">
      <h1>Problems</h1>
      <p>Track your progress across ${store.metadata.totalProblems} DSA problems</p>
    </div>

    <div class="filter-bar">
      <div class="filter-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="filter-search-input" placeholder="Search problems..." autocomplete="off">
      </div>
      <button class="filter-toggle-btn" id="filter-toggle-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/></svg>
        Filters <span class="filter-active-count" id="filter-active-count"></span>
      </button>
      <span class="filter-count" id="filter-count"></span>
      <div class="filter-options" id="filter-options">
        <select id="filter-topic" class="filter-select">
          <option value="">All Topics</option>
          ${topics.map(t => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('')}
        </select>
        <select id="filter-difficulty" class="filter-select">
          <option value="">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select id="filter-status" class="filter-select">
          <option value="">All Status</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Unsolved</option>
        </select>
        <select id="filter-priority" class="filter-select">
          <option value="">All Priority</option>
          ${priorities.map(p => `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`).join('')}
        </select>
        <select id="filter-pattern" class="filter-select">
          <option value="">All Patterns</option>
          ${patterns.map(p => `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`).join('')}
        </select>
        <button class="filter-btn" id="clear-filters-btn">Clear</button>
      </div>
    </div>

    <div class="problems-table-wrap">
      <table class="problems-table">
        <thead>
          <tr>
            <th data-sort="id" class="sorted" style="width:50px"># <span class="sort-arrow">▲</span></th>
            <th data-sort="lcNumber" style="width:60px">LC# <span class="sort-arrow">▲</span></th>
            <th data-sort="name">Problem <span class="sort-arrow">▲</span></th>
            <th data-sort="difficulty" style="width:90px">Diff <span class="sort-arrow">▲</span></th>
            <th data-sort="topic" style="width:150px">Topic <span class="sort-arrow">▲</span></th>
            <th style="width:130px">Pattern</th>
            <th data-sort="priority" style="width:110px">Priority <span class="sort-arrow">▲</span></th>
            <th style="width:60px">Status</th>
            <th style="width:40px"></th>
          </tr>
        </thead>
        <tbody id="problems-tbody"></tbody>
      </table>
    </div>
  `;
}

function renderTable() {
  const filtered = store.getFilteredProblems(currentFilters);
  const sorted = sortProblems(filtered);

  const tbody = document.getElementById('problems-tbody');
  const count = document.getElementById('filter-count');
  if (count) count.textContent = `Showing ${sorted.length} of ${store.metadata.totalProblems}`;

  const fragment = document.createDocumentFragment();

  for (const p of sorted) {
    // Main row
    const tr = document.createElement('tr');
    tr.className = p.status === 'solved' ? 'solved-row' : '';
    tr.dataset.id = p.id;
    tr.innerHTML = `
      <td>${p.id}</td>
      <td><span style="color:var(--text-muted)">${escapeHTML(p.lcNumber)}</span></td>
      <td>
        <a href="${escapeHTML(p.link)}" target="_blank" rel="noopener" class="problem-link">
          ${LC_ICON_SVG}
          ${escapeHTML(p.name)}
        </a>
      </td>
      <td><span class="badge ${getDifficultyClass(p.difficulty)}">${escapeHTML(p.difficulty)}</span></td>
      <td><span class="badge badge-topic">${escapeHTML(p.topic)}</span></td>
      <td><span style="font-size:0.78rem;color:var(--text-secondary)">${escapeHTML(p.pattern)}</span></td>
      <td><span class="badge ${getPriorityClass(p.priority)}">${escapeHTML(p.priority)}</span></td>
      <td>
        <div class="status-toggle">
          <button class="status-btn ${p.status === 'solved' ? 'checked' : ''}" data-id="${p.id}" title="${p.status === 'solved' ? 'Mark unsolved' : 'Mark solved'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </td>
      <td>
        <button class="expand-btn" data-expand="${p.id}" title="Show details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </td>
    `;
    fragment.appendChild(tr);

    // Expand row
    const expandTr = document.createElement('tr');
    expandTr.className = 'expand-row';
    expandTr.id = `expand-${p.id}`;
    expandTr.innerHTML = `
      <td colspan="9">
        <div class="expand-content">
          <div class="expand-section">
            <div class="expand-label">Key Insight</div>
            <div class="expand-text">${escapeHTML(p.keyInsight) || '<span style="color:var(--text-muted)">No insight recorded</span>'}</div>
          </div>
          <div class="expand-section">
            <div class="expand-label">Notes</div>
            <textarea class="notes-textarea" data-notes-id="${p.id}" placeholder="Add your notes here...">${escapeHTML(p.notes || '')}</textarea>
          </div>
          ${p.dateSolved && p.dateSolved !== 'None' ? `<div class="expand-section"><div class="expand-label">Date Solved</div><div class="expand-text">${escapeHTML(p.dateSolved)}</div></div>` : ''}
        </div>
      </td>
    `;
    fragment.appendChild(expandTr);
  }

  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}

function sortProblems(problems) {
  const { column, direction } = sortState;
  const dir = direction === 'asc' ? 1 : -1;
  const diffMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
  const prioMap = { 'Must Do': 1, 'Good Practice': 2, 'Revision': 3, 'Hard Practice': 4 };

  return [...problems].sort((a, b) => {
    let av, bv;
    switch (column) {
      case 'id': av = a.id; bv = b.id; break;
      case 'lcNumber': av = parseInt(a.lcNumber) || 0; bv = parseInt(b.lcNumber) || 0; break;
      case 'name': return dir * a.name.localeCompare(b.name);
      case 'difficulty': av = diffMap[a.difficulty] || 0; bv = diffMap[b.difficulty] || 0; break;
      case 'topic': return dir * a.topic.localeCompare(b.topic);
      case 'priority': av = prioMap[a.priority] || 99; bv = prioMap[b.priority] || 99; break;
      default: av = a.id; bv = b.id;
    }
    return dir * (av - bv);
  });
}

function bindEvents() {
  // Filters
  const searchInput = document.getElementById('filter-search-input');
  searchInput.addEventListener('input', debounce(e => {
    currentFilters.search = e.target.value;
    renderTable();
  }, 200));

  for (const id of ['filter-topic', 'filter-difficulty', 'filter-status', 'filter-priority', 'filter-pattern']) {
    document.getElementById(id).addEventListener('change', e => {
      const key = id.replace('filter-', '');
      currentFilters[key] = e.target.value;
      updateActiveFilterCount();
      renderTable();
    });
  }

  document.getElementById('clear-filters-btn').addEventListener('click', () => {
    currentFilters = { topic: '', difficulty: '', status: '', priority: '', pattern: '', search: '' };
    document.getElementById('filter-search-input').value = '';
    for (const id of ['filter-topic', 'filter-difficulty', 'filter-status', 'filter-priority', 'filter-pattern']) {
      document.getElementById(id).value = '';
    }
    updateActiveFilterCount();
    renderTable();
  });

  // Mobile filter toggle
  document.getElementById('filter-toggle-btn').addEventListener('click', () => {
    const options = document.getElementById('filter-options');
    const btn = document.getElementById('filter-toggle-btn');
    options.classList.toggle('open');
    btn.classList.toggle('active');
  });

  // Hide filter bar on scroll down, show on scroll up (mobile only)
  if (window.innerWidth <= 768) {
    let lastScrollY = window.scrollY;
    const filterBar = document.querySelector('#page-problems .filter-bar');
    if (filterBar) {
      window.addEventListener('scroll', () => {
        const currentY = window.scrollY;
        if (currentY > lastScrollY && currentY > 120) {
          filterBar.classList.add('scroll-hidden');
        } else {
          filterBar.classList.remove('scroll-hidden');
        }
        lastScrollY = currentY;
      }, { passive: true });
    }
  }

  // Sort
  document.querySelectorAll('#page-problems th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortState.column === col) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortState.column = col;
        sortState.direction = 'asc';
      }
      // Update UI
      document.querySelectorAll('#page-problems th').forEach(h => {
        h.classList.remove('sorted');
        const arrow = h.querySelector('.sort-arrow');
        if (arrow) arrow.textContent = '▲';
      });
      th.classList.add('sorted');
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = sortState.direction === 'asc' ? '▲' : '▼';
      renderTable();
    });
  });

  // Status toggle & expand (delegated)
  const tbody = document.getElementById('problems-tbody');
  tbody.addEventListener('click', e => {
    // Status toggle
    const statusBtn = e.target.closest('.status-btn');
    if (statusBtn) {
      const id = parseInt(statusBtn.dataset.id);
      const p = store.toggleStatus(id);
      if (p) {
        statusBtn.classList.toggle('checked', p.status === 'solved');
        statusBtn.title = p.status === 'solved' ? 'Mark unsolved' : 'Mark solved';
        const row = statusBtn.closest('tr');
        row.classList.toggle('solved-row', p.status === 'solved');
        showToast(
          p.status === 'solved' ? `Marked "${p.name}" as solved!` : `Marked "${p.name}" as unsolved`,
          p.status === 'solved' ? 'success' : 'info'
        );
        store.emit('data-changed');
      }
      return;
    }

    // Expand toggle
    const expandBtn = e.target.closest('.expand-btn');
    if (expandBtn) {
      const id = expandBtn.dataset.expand;
      const expandRow = document.getElementById(`expand-${id}`);
      if (expandRow) {
        expandRow.classList.toggle('open');
        expandBtn.classList.toggle('open');
      }
      return;
    }
  });

  // Notes save (delegated, debounced)
  const saveNotes = debounce((id, text) => {
    store.updateNotes(id, text);
  }, 500);

  tbody.addEventListener('input', e => {
    if (e.target.classList.contains('notes-textarea')) {
      const id = parseInt(e.target.dataset.notesId);
      saveNotes(id, e.target.value);
    }
  });
}
