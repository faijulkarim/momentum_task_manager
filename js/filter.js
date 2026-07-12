/* ==========================================================================
   MOMENTUM — filter.js
   Pure functions that turn (tasks + current filter state) into the
   list app.js should render. No DOM access here — ui.js/app.js own that.
   ========================================================================== */

window.App = window.App || {};

App.Filter = (function () {
  'use strict';

  const VIEW_LABELS = {
    all: 'All Tasks',
    today: 'Today',
    week: 'This Week',
    high: 'High Priority',
    pending: 'Pending',
    completed: 'Completed'
  };

  /**
   * Applies the active view (sidebar filter), category, and search query
   * to a task list, in that order.
   */
  function applyFilters(tasks, { view = 'all', category = 'all', query = '' } = {}) {
    let result = tasks.slice();

    switch (view) {
      case 'today':
        result = result.filter(t => App.Task.isToday(t.dueDate) && !t.completed);
        break;
      case 'week':
        result = result.filter(t => App.Task.isThisWeek(t.dueDate) && !t.completed);
        break;
      case 'high':
        result = result.filter(t => t.priority === 'high' && !t.completed);
        break;
      case 'pending':
        result = result.filter(t => !t.completed);
        break;
      case 'completed':
        result = result.filter(t => t.completed);
        break;
      case 'all':
      default:
        break; // no view filtering
    }

    if (category && category !== 'all') {
      result = result.filter(t => t.category === category);
    }

    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery) {
      result = result.filter(t => t.title.toLowerCase().includes(trimmedQuery));
    }

    return result;
  }

  /**
   * Sorts a task list in place-safe fashion (returns a new array).
   */
  function sortTasks(tasks, sortBy = 'newest') {
    const result = tasks.slice();

    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;

      case 'dueDate':
        result.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;  // tasks without a due date sink to the bottom
          if (!b.dueDate) return -1;
          const aTime = new Date(`${a.dueDate}T${a.dueTime || '00:00'}`).getTime();
          const bTime = new Date(`${b.dueDate}T${b.dueTime || '00:00'}`).getTime();
          return aTime - bTime;
        });
        break;

      case 'priority':
        result.sort((a, b) => App.Task.priorityWeight(b.priority) - App.Task.priorityWeight(a.priority));
        break;

      case 'newest':
      default:
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return result;
  }

  /**
   * Computes the counts shown next to each sidebar filter item.
   * Mirrors the same predicates as applyFilters() for the "view" axis.
   */
  function computeCounts(tasks) {
    return {
      all: tasks.length,
      today: tasks.filter(t => App.Task.isToday(t.dueDate) && !t.completed).length,
      week: tasks.filter(t => App.Task.isThisWeek(t.dueDate) && !t.completed).length,
      high: tasks.filter(t => t.priority === 'high' && !t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      completed: tasks.filter(t => t.completed).length
    };
  }

  function labelForView(view) {
    return VIEW_LABELS[view] || 'All Tasks';
  }

  return {
    applyFilters,
    sortTasks,
    computeCounts,
    labelForView
  };
})();