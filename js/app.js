/* ==========================================================================
   MOMENTUM — app.js
   Application entry point. Owns state, wires every DOM event to the
   Task / Filter / Storage / UI modules, and re-renders on every change.
   Load order (see index.html): storage -> task -> filter -> theme -> ui -> app
   ========================================================================== */

(function () {
  'use strict';

  // ---- Application state ----------------------------------------------------

  const state = {
    tasks: [],
    view: 'all',        // all | today | week | high | pending | completed
    category: 'all',
    sortBy: 'newest',
    searchQuery: '',
    deletingTaskId: null
  };

  let searchDebounceTimer = null;

  // ---- Derived render pipeline: filter -> sort -> paint ----------------------

  function render() {
    const filtered = App.Filter.applyFilters(state.tasks, {
      view: state.view,
      category: state.category,
      query: state.searchQuery
    });
    const visible = App.Filter.sortTasks(filtered, state.sortBy);

    App.UI.renderTaskList(visible);
    App.UI.setEmptyStateMessage(state.view, state.tasks.length > 0);
    App.UI.renderToolbar(state.view, state.category, visible.length);
    App.UI.renderFilterCounts(App.Filter.computeCounts(state.tasks));
    App.UI.renderStats(state.tasks);
  }

  function persistAndRender() {
    App.Storage.saveTasks(state.tasks);
    render();
  }

  // ---- Task actions -----------------------------------------------------------

  function addTask(formData) {
    const validation = App.Task.validateTitle(formData.title);
    if (!validation.valid) {
      App.UI.showToast(validation.error, 'error');
      return false;
    }

    const task = App.Task.createTask({
      title: validation.value,
      dueDate: formData.dueDate,
      dueTime: formData.dueTime,
      priority: formData.priority,
      category: formData.category
    });

    state.tasks.unshift(task);
    persistAndRender();
    App.UI.showToast('Task added.', 'success');
    return true;
  }

  function toggleTaskComplete(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const wasCompleted = task.completed;
    task.completed = !task.completed;
    task.updatedAt = Date.now();
    persistAndRender();

    if (task.completed) {
      App.UI.showToast('Task marked complete.', 'success', {
        actionLabel: 'Undo',
        onAction: () => toggleTaskComplete(taskId)
      });
    } else if (wasCompleted) {
      App.UI.showToast('Task restored to pending.', 'info');
    }
  }

  function saveEditedTask(taskId, changes) {
    const validation = App.Task.validateTitle(changes.title);
    if (!validation.valid) {
      App.UI.showToast(validation.error, 'error');
      return false;
    }

    const index = state.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return false;

    state.tasks[index] = App.Task.updateTask(state.tasks[index], {
      title: validation.value,
      dueDate: changes.dueDate,
      dueTime: changes.dueTime,
      priority: changes.priority,
      category: changes.category
    });

    persistAndRender();
    App.UI.showToast('Task updated.', 'success');
    return true;
  }

  function deleteTask(taskId) {
    const removedTask = state.tasks.find(t => t.id === taskId);
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    persistAndRender();

    if (removedTask) {
      App.UI.showToast('Task deleted.', 'info', {
        actionLabel: 'Undo',
        onAction: () => {
          state.tasks.unshift(removedTask);
          persistAndRender();
        }
      });
    }
  }

  // ---- Event binding: Add task form -------------------------------------------

  function bindAddTaskForm() {
    const form = document.getElementById('taskForm');

    form.addEventListener('submit', event => {
      event.preventDefault();

      const added = addTask({
        title: document.getElementById('taskTitleInput').value,
        dueDate: document.getElementById('taskDueDate').value,
        dueTime: document.getElementById('taskDueTime').value,
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value
      });

      if (added) {
        form.reset();
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskCategory').value = 'others';
        document.getElementById('taskTitleInput').focus();
      }
    });

    // Pressing Enter inside the title field submits the form natively;
    // this listener just keeps focus behavior predictable across browsers.
    document.getElementById('taskTitleInput').addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        form.requestSubmit();
      }
    });
  }

  // ---- Event binding: task list (delegated) -----------------------------------

  function bindTaskList() {
    App.UI.el.taskList.addEventListener('click', event => {
      const actionEl = event.target.closest('[data-action]');
      if (!actionEl) return;

      const taskItem = event.target.closest('.task-item');
      const taskId = taskItem && taskItem.dataset.id;
      if (!taskId) return;

      const action = actionEl.dataset.action;

      if (action === 'toggle') {
        toggleTaskComplete(taskId);
      } else if (action === 'edit') {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) App.UI.openEditModal(task);
      } else if (action === 'delete') {
        state.deletingTaskId = taskId;
        App.UI.openConfirmModal();
      }
    });

    // Keyboard support for the checkbox (role="checkbox" needs Space/Enter)
    App.UI.el.taskList.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const checkbox = event.target.closest('.task-item__checkbox');
      if (!checkbox) return;
      event.preventDefault();
      const taskItem = event.target.closest('.task-item');
      if (taskItem) toggleTaskComplete(taskItem.dataset.id);
    });
  }

  // ---- Event binding: edit modal ----------------------------------------------

  function bindEditModal() {
    const editModal = App.UI.el.editModal;
    const editForm = App.UI.el.editForm;

    document.getElementById('editModalClose').addEventListener('click', () => App.UI.closeEditModal());
    document.getElementById('editCancelBtn').addEventListener('click', () => App.UI.closeEditModal());

    editModal.addEventListener('click', event => {
      // Click on the ::backdrop area closes the dialog (click target === dialog itself)
      if (event.target === editModal) App.UI.closeEditModal();
    });

    editForm.addEventListener('submit', event => {
      event.preventDefault();
      const taskId = document.getElementById('editTaskId').value;

      const saved = saveEditedTask(taskId, {
        title: document.getElementById('editTaskTitle').value,
        dueDate: document.getElementById('editTaskDueDate').value,
        dueTime: document.getElementById('editTaskDueTime').value,
        priority: document.getElementById('editTaskPriority').value,
        category: document.getElementById('editTaskCategory').value
      });

      if (saved) App.UI.closeEditModal();
    });
  }

  // ---- Event binding: delete confirmation modal --------------------------------

  function bindConfirmModal() {
    const confirmModal = App.UI.el.confirmModal;

    document.getElementById('confirmModalClose').addEventListener('click', () => {
      state.deletingTaskId = null;
      App.UI.closeConfirmModal();
    });
    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
      state.deletingTaskId = null;
      App.UI.closeConfirmModal();
    });

    confirmModal.addEventListener('click', event => {
      if (event.target === confirmModal) {
        state.deletingTaskId = null;
        App.UI.closeConfirmModal();
      }
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      if (state.deletingTaskId) deleteTask(state.deletingTaskId);
      state.deletingTaskId = null;
      App.UI.closeConfirmModal();
    });
  }

  // ---- Event binding: sidebar filters & categories ------------------------------

  function bindSidebar() {
    App.UI.el.filterList.addEventListener('click', event => {
      const btn = event.target.closest('.filter-item');
      if (!btn) return;
      state.view = btn.dataset.filter;
      App.UI.setActiveFilter(state.view);
      render();
      if (window.matchMedia('(max-width: 1024px)').matches) App.UI.closeSidebar();
    });

    App.UI.el.categoryList.addEventListener('click', event => {
      const btn = event.target.closest('.category-item');
      if (!btn) return;
      state.category = btn.dataset.category;
      App.UI.setActiveCategory(state.category);
      render();
      if (window.matchMedia('(max-width: 1024px)').matches) App.UI.closeSidebar();
    });

    App.UI.el.sidebarToggle.addEventListener('click', () => App.UI.toggleSidebar());
    App.UI.el.sidebarOverlay.addEventListener('click', () => App.UI.closeSidebar());
  }

  // ---- Event binding: search & sort --------------------------------------------

  function bindSearchAndSort() {
    document.getElementById('searchInput').addEventListener('input', event => {
      clearTimeout(searchDebounceTimer);
      const value = event.target.value;
      searchDebounceTimer = setTimeout(() => {
        state.searchQuery = value;
        render();
      }, 180);
    });

    document.getElementById('sortSelect').addEventListener('change', event => {
      state.sortBy = event.target.value;
      render();
    });
  }

  // ---- Event binding: theme + quick-add shortcut ----------------------------------

  function bindTheme() {
    document.getElementById('themeToggle').addEventListener('click', () => App.Theme.toggle());
  }

  function bindQuickAdd() {
    document.getElementById('quickAddBtn').addEventListener('click', () => {
      document.getElementById('taskTitleInput').focus();
      if (window.matchMedia('(max-width: 1024px)').matches) App.UI.closeSidebar();
    });
  }

  // ---- Init ---------------------------------------------------------------------

  function init() {
    App.Theme.init();
    App.UI.showLoading();

    // Simulated brief loading state so the spinner + skeleton are visible on
    // first paint even when localStorage reads are effectively instant.
    setTimeout(() => {
      state.tasks = App.Storage.getTasks();

      bindAddTaskForm();
      bindTaskList();
      bindEditModal();
      bindConfirmModal();
      bindSidebar();
      bindSearchAndSort();
      bindTheme();
      bindQuickAdd();

      App.UI.hideLoading();
      render();
    }, 250);
  }

  document.addEventListener('DOMContentLoaded', init);
})();