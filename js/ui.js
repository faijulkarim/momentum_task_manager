/* ==========================================================================
   MOMENTUM — ui.js
   All direct DOM reads/writes live here. app.js holds state and decides
   *when* to render; ui.js decides *how*. No task-mutation logic in here.
   ========================================================================== */

window.App = window.App || {};

App.UI = (function () {
  'use strict';

  // ---- Cached DOM references ---------------------------------------------

  const el = {
    appShell: document.getElementById('app-shell'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),

    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateText: document.getElementById('emptyStateText'),
    loadingState: document.getElementById('loadingState'),

    listHeading: document.getElementById('listHeading'),
    listSubcount: document.getElementById('listSubcount'),

    filterList: document.getElementById('filterList'),
    categoryList: document.getElementById('categoryList'),

    statTotal: document.getElementById('statTotal'),
    statCompleted: document.getElementById('statCompleted'),
    statPending: document.getElementById('statPending'),
    statPercent: document.getElementById('statPercent'),
    progressBar: document.getElementById('progressBar'),
    progressBarFill: document.getElementById('progressBarFill'),

    toastContainer: document.getElementById('toastContainer'),

    editModal: document.getElementById('editModal'),
    editForm: document.getElementById('editForm'),
    editTaskId: document.getElementById('editTaskId'),
    editTaskTitle: document.getElementById('editTaskTitle'),
    editTaskDueDate: document.getElementById('editTaskDueDate'),
    editTaskDueTime: document.getElementById('editTaskDueTime'),
    editTaskPriority: document.getElementById('editTaskPriority'),
    editTaskCategory: document.getElementById('editTaskCategory'),

    confirmModal: document.getElementById('confirmModal')
  };

  // ---- Task list rendering -----------------------------------------------

  /**
   * Renders the visible task list. Expects an already filtered + sorted array.
   */
  function renderTaskList(tasks) {
    el.taskList.innerHTML = '';

    if (tasks.length === 0) {
      el.taskList.hidden = true;
      el.emptyState.hidden = false;
      return;
    }

    el.taskList.hidden = false;
    el.emptyState.hidden = true;

    const fragment = document.createDocumentFragment();
    tasks.forEach(task => fragment.appendChild(App.Task.buildElement(task)));
    el.taskList.appendChild(fragment);
  }

  function setEmptyStateMessage(view, hasAnyTasks) {
    if (!hasAnyTasks) {
      el.emptyStateTitle.textContent = 'No tasks yet';
      el.emptyStateText.textContent = 'Add your first task above and it will show up here.';
      return;
    }

    const messages = {
      today: ['Nothing due today', 'Enjoy the clear schedule — or add a task for today.'],
      week: ['Nothing due this week', 'You are all caught up for the next seven days.'],
      high: ['No high priority tasks', 'Mark a task as High priority to see it here.'],
      pending: ['Nothing pending', 'Every task on this view is already complete.'],
      completed: ['Nothing completed yet', 'Finished tasks will collect here.'],
      all: ['No matching tasks', 'Try a different search term or filter.']
    };
    const [title, text] = messages[view] || messages.all;
    el.emptyStateTitle.textContent = title;
    el.emptyStateText.textContent = text;
  }

  // ---- Loading state --------------------------------------------------------

  function showLoading() {
    el.loadingState.setAttribute('aria-hidden', 'false');
    el.taskList.hidden = true;
    el.emptyState.hidden = true;
  }

  function hideLoading() {
    el.loadingState.setAttribute('aria-hidden', 'true');
  }

  // ---- Toolbar heading / counts -------------------------------------------

  function renderToolbar(view, category, visibleCount) {
    const categoryLabel = category && category !== 'all' ? ` · ${App.Task.CATEGORY_LABELS[category]}` : '';
    el.listHeading.textContent = App.Filter.labelForView(view) + categoryLabel;
    el.listSubcount.textContent = `${visibleCount} task${visibleCount === 1 ? '' : 's'}`;
  }

  function renderFilterCounts(counts) {
    Object.keys(counts).forEach(key => {
      const countEl = document.getElementById(`count-${key}`);
      if (countEl) countEl.textContent = counts[key];
    });
  }

  function setActiveFilter(view) {
    el.filterList.querySelectorAll('.filter-item').forEach(btn => {
      const isActive = btn.dataset.filter === view;
      btn.classList.toggle('is-active', isActive);
      if (isActive) {
        btn.setAttribute('aria-current', 'true');
      } else {
        btn.removeAttribute('aria-current');
      }
    });
  }

  function setActiveCategory(category) {
    el.categoryList.querySelectorAll('.category-item').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.category === category);
    });
  }

  // ---- Statistics -----------------------------------------------------------

  function renderStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    el.statTotal.textContent = total;
    el.statCompleted.textContent = completed;
    el.statPending.textContent = pending;
    el.statPercent.textContent = `${percent}%`;

    el.progressBarFill.style.width = `${percent}%`;
    el.progressBar.setAttribute('aria-valuenow', String(percent));
  }

  // ---- Sidebar (mobile drawer) --------------------------------------------

  function openSidebar() {
    el.appShell.classList.add('sidebar-open');
    el.sidebarOverlay.hidden = false;
    el.sidebarToggle.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    el.appShell.classList.remove('sidebar-open');
    el.sidebarOverlay.hidden = true;
    el.sidebarToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleSidebar() {
    if (el.appShell.classList.contains('sidebar-open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  // ---- Toasts -----------------------------------------------------------------

  const TOAST_ICONS = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="m8 12.5 2.5 2.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 11v5M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  /**
   * Shows a toast notification. type: 'success' | 'error' | 'info'
   * Optional actionLabel + onAction render a clickable link (used for Undo).
   */
  function showToast(message, type = 'success', options = {}) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    toast.innerHTML = `
      <span class="toast__icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
      <span class="toast__message"></span>
      <button class="toast__close" aria-label="Dismiss notification" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    `;
    toast.querySelector('.toast__message').textContent = message;

    if (options.actionLabel && typeof options.onAction === 'function') {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast__close';
      actionBtn.style.marginLeft = '4px';
      actionBtn.textContent = options.actionLabel;
      actionBtn.addEventListener('click', () => {
        options.onAction();
        dismissToast(toast);
      });
      toast.insertBefore(actionBtn, toast.querySelector('.toast__close'));
    }

    toast.querySelector('.toast__close').addEventListener('click', () => dismissToast(toast));

    el.toastContainer.appendChild(toast);

    const autoDismiss = setTimeout(() => dismissToast(toast), options.duration || 4000);
    toast.dataset.timeoutId = autoDismiss;
  }

  function dismissToast(toast) {
    if (!toast || !toast.isConnected) return;
    clearTimeout(Number(toast.dataset.timeoutId));
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  // ---- Edit modal -----------------------------------------------------------

  function openEditModal(task) {
    el.editTaskId.value = task.id;
    el.editTaskTitle.value = task.title;
    el.editTaskDueDate.value = task.dueDate || '';
    el.editTaskDueTime.value = task.dueTime || '';
    el.editTaskPriority.value = task.priority;
    el.editTaskCategory.value = task.category;
    el.editModal.showModal();
    el.editTaskTitle.focus();
  }

  function closeEditModal() {
    if (el.editModal.open) el.editModal.close();
  }

  // ---- Confirm delete modal ---------------------------------------------------

  function openConfirmModal() {
    el.confirmModal.showModal();
  }

  function closeConfirmModal() {
    if (el.confirmModal.open) el.confirmModal.close();
  }

  return {
    el,
    renderTaskList,
    setEmptyStateMessage,
    showLoading,
    hideLoading,
    renderToolbar,
    renderFilterCounts,
    setActiveFilter,
    setActiveCategory,
    renderStats,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    showToast,
    dismissToast,
    openEditModal,
    closeEditModal,
    openConfirmModal,
    closeConfirmModal
  };
})();