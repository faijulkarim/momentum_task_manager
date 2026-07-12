/* ==========================================================================
   MOMENTUM — theme.js
   Applies data-theme on <html>, persists the user's explicit choice,
   and falls back to the OS-level color-scheme preference on first visit.
   ========================================================================== */

window.App = window.App || {};

App.Theme = (function () {
  'use strict';

  const root = document.documentElement;
  let current = 'light';

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function apply(theme) {
    current = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', current);

    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', String(current === 'dark'));
      toggleBtn.setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  /**
   * Reads the saved preference, or falls back to the OS setting.
   * Called once on page load, before first paint if possible.
   */
  function init() {
    const saved = App.Storage.getTheme();
    const initial = saved || (systemPrefersDark() ? 'dark' : 'light');
    apply(initial);
  }

  function toggle() {
    const next = current === 'dark' ? 'light' : 'dark';
    apply(next);
    App.Storage.saveTheme(next);
    return next;
  }

  function getCurrent() {
    return current;
  }

  return { init, toggle, apply, getCurrent };
})();