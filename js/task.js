/* ==========================================================================
   MOMENTUM — task.js
   The Task model: creation, validation, date/priority helpers, and the
   DOM builder for a single task-item. ui.js calls App.Task.buildElement()
   for every task it renders — markup lives in exactly one place.
   ========================================================================== */

window.App = window.App || {};

App.Task = (function () {
  'use strict';

  const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

  const CATEGORY_LABELS = {
    personal: 'Personal',
    work: 'Work',
    study: 'Study',
    shopping: 'Shopping',
    health: 'Health',
    others: 'Others'
  };

  const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

  // ---- ID generation ---------------------------------------------------

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  // ---- Creation & validation ---------------------------------------------

  /**
   * Trims and validates a task title.
   * Returns { valid, value, error }.
   */
  function validateTitle(rawTitle) {
    const value = (rawTitle || '').trim();
    if (!value) return { valid: false, value: '', error: 'Task title cannot be empty.' };
    if (value.length > 140) return { valid: false, value, error: 'Task title is too long (140 characters max).' };
    return { valid: true, value, error: null };
  }

  /**
   * Builds a new task object from form input values.
   */
  function createTask({ title, dueDate, dueTime, priority, category }) {
    const now = Date.now();
    return {
      id: generateId(),
      title: title.trim(),
      completed: false,
      dueDate: dueDate || '',
      dueTime: dueTime || '',
      priority: priority || 'medium',
      category: category || 'others',
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Returns a shallow-updated copy of a task (used by the edit modal).
   */
  function updateTask(task, changes) {
    return Object.assign({}, task, changes, { updatedAt: Date.now() });
  }

  // ---- Date helpers ---------------------------------------------------------

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function isToday(dateStr) {
    if (!dateStr) return false;
    return dateStr === todayISO();
  }

  function isThisWeek(dateStr) {
    if (!dateStr) return false;
    const target = new Date(`${dateStr}T00:00:00`);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return target >= startOfWeek && target < endOfWeek;
  }

  function isOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    const due = new Date(`${task.dueDate}T${task.dueTime || '23:59'}:00`);
    return due.getTime() < Date.now();
  }

  /**
   * Human-friendly due label, e.g. "Today · 5:30 PM", "Jul 14", "No due date".
   */
  function formatDueLabel(task) {
    if (!task.dueDate) return null;

    const dateObj = new Date(`${task.dueDate}T00:00:00`);
    let label;

    if (isToday(task.dueDate)) {
      label = 'Today';
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      if (task.dueDate === tomorrowISO) {
        label = 'Tomorrow';
      } else {
        label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    }

    if (task.dueTime) {
      const [h, m] = task.dueTime.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      label += ` · ${hour12}:${String(m).padStart(2, '0')} ${period}`;
    }

    return label;
  }

  function priorityWeight(priority) {
    return PRIORITY_WEIGHT[priority] || 0;
  }

  // ---- Rendering -------------------------------------------------------------

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function checkboxIconMarkup() {
    return '<svg viewBox="0 0 24 24"><path d="M4 12.5 L9.5 18 L20 5"/></svg>';
  }

  function editIconMarkup() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  }

  function deleteIconMarkup() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7h12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /**
   * Builds the full DOM node for one task, matching the .task-item
   * structure and classes defined in style.css.
   */
  function buildElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' is-completed' : '');
    li.dataset.id = task.id;

    const dueLabel = formatDueLabel(task);
    const overdue = isOverdue(task);

    li.innerHTML = `
      <button
        class="task-item__checkbox"
        role="checkbox"
        aria-checked="${task.completed}"
        aria-label="${task.completed ? 'Mark task as not complete' : 'Mark task as complete'}"
        data-action="toggle"
        type="button"
      >${checkboxIconMarkup()}</button>

      <div class="task-item__content">
        <div class="task-item__title-row">
          <span class="task-item__title">${escapeHtml(task.title)}</span>
        </div>
        <div class="task-item__meta">
          <span class="badge badge--priority-${task.priority}">${PRIORITY_LABELS[task.priority]}</span>
          <span class="badge badge--category">${CATEGORY_LABELS[task.category] || 'Others'}</span>
          ${dueLabel ? `<span class="badge ${overdue ? 'badge--overdue' : 'badge--due'}">${overdue ? 'Overdue · ' : ''}${dueLabel}</span>` : ''}
        </div>
      </div>

      <div class="task-item__actions">
        <button class="icon-btn" data-action="edit" aria-label="Edit task" type="button">${editIconMarkup()}</button>
        <button class="icon-btn icon-btn--danger" data-action="delete" aria-label="Delete task" type="button">${deleteIconMarkup()}</button>
      </div>
    `;

    return li;
  }

  // ---- Public API ----------------------------------------------------------

  return {
    generateId,
    validateTitle,
    createTask,
    updateTask,
    todayISO,
    isToday,
    isThisWeek,
    isOverdue,
    formatDueLabel,
    priorityWeight,
    buildElement,
    CATEGORY_LABELS,
    PRIORITY_LABELS
  };
})();