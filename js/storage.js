/* ==========================================================================
   MOMENTUM — storage.js
   Thin wrapper around localStorage. Every other module talks to
   persistence only through App.Storage — nothing else touches
   localStorage directly. Exposed on the shared App namespace.
   ========================================================================== */

window.App = window.App || {};

App.Storage = (function () {
  'use strict';

  const TASKS_KEY = 'momentum_tasks_v1';
  const THEME_KEY = 'momentum_theme_v1';

  /**
   * Safely parse JSON from localStorage, falling back on error.
   */
  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn(`[Storage] Failed to read "${key}":`, err);
      return fallback;
    }
  }

  /**
   * Safely write JSON to localStorage.
   * Returns true on success, false if storage is unavailable/full.
   */
  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[Storage] Failed to write "${key}":`, err);
      return false;
    }
  }

  // ---- Tasks -------------------------------------------------------------

  function getTasks() {
    return safeGet(TASKS_KEY, []);
  }

  function saveTasks(tasks) {
    return safeSet(TASKS_KEY, tasks);
  }

  // ---- Theme ---------------------------------------------------------------

  function getTheme() {
    return safeGet(THEME_KEY, null); // null = no explicit preference saved yet
  }

  function saveTheme(theme) {
    return safeSet(THEME_KEY, theme);
  }

  // ---- Public API ----------------------------------------------------------

  return {
    getTasks,
    saveTasks,
    getTheme,
    saveTheme
  };
})();