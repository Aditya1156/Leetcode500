// ============================================
// Utility functions - shared across all modules
// ============================================

export function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function formatDate(dateStr) {
  if (!dateStr || dateStr === 'null' || dateStr === 'None') return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function animateValue(el, start, end, duration = 1000) {
  const startTime = performance.now();
  const update = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * ease);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${type === 'success' ? 'var(--success)' : 'var(--info)'}" stroke-width="2">
      ${type === 'success'
        ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${escapeHTML(message)}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function getDifficultyClass(difficulty) {
  const d = (difficulty || '').toLowerCase();
  if (d === 'easy') return 'badge-easy';
  if (d === 'medium') return 'badge-medium';
  if (d === 'hard') return 'badge-hard';
  return '';
}

export function getPriorityClass(priority) {
  const p = (priority || '').toLowerCase().replace(/\s+/g, '');
  if (p === 'mustdo') return 'badge-mustdo';
  if (p === 'goodpractice') return 'badge-good';
  if (p === 'revision') return 'badge-revision';
  if (p === 'hardpractice') return 'badge-hardpractice';
  return 'badge-topic';
}

// Topic color palette (16 distinct hues)
const TOPIC_COLORS = [
  '#FFA116', '#00B8A3', '#3B82F6', '#EF4743', '#A855F7',
  '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#14B8A6',
  '#F97316', '#8B5CF6', '#06B6D4', '#E11D48', '#84CC16', '#0EA5E9'
];

export function getTopicColor(index) {
  return TOPIC_COLORS[index % TOPIC_COLORS.length];
}

// LeetCode icon as inline SVG string
export const LC_ICON_SVG = `<svg class="lc-icon" viewBox="0 0 24 24" width="14" height="14" fill="var(--accent)"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l.257.213a1.378 1.378 0 0 0 1.555-.153 1.381 1.381 0 0 0 .126-1.955l-.257-.213A5.565 5.565 0 0 0 13.483 0zm5.886 6.262a1.38 1.38 0 0 0-.98.408l-4.277 4.193a2.696 2.696 0 0 1 0 3.842l-.047.045a1.381 1.381 0 0 0 .98 2.362 1.38 1.38 0 0 0 .978-.408l4.277-4.193a5.45 5.45 0 0 0 0-7.749 1.377 1.377 0 0 0-.931-.5z"/></svg>`;
