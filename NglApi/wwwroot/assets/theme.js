/* =============================================================================
 * Hive — gündüz / gecə rejimi
 * Seçim localStorage-da saxlanılır; sistem seçimi ilk dəfə nəzərə alınır.
 * ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'hive.theme';

  function stored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function systemPrefersDark() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      var isDark = theme === 'dark';
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      var sun = btn.querySelector('[data-icon-sun]');
      var moon = btn.querySelector('[data-icon-moon]');
      if (sun) sun.classList.toggle('hidden', isDark);
      if (moon) moon.classList.toggle('hidden', !isDark);
    });
  }

  // Səhifə yüklənərkən gecikmə olmasın deyə dərhal tətbiq edilir
  var initial = stored() || (systemPrefersDark() ? 'dark' : 'light');
  apply(initial);

  function toggle() {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* private mode */ }
    apply(next);
    return next;
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-theme-toggle]');
    if (btn) toggle();
  });

  // Digər tab-da dəyişiklik olsa sinxronlaşdır
  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY && event.newValue) apply(event.newValue);
  });

  // Düymələr hələ yoxdursa (skript <head>-dədir), DOM hazır olanda ikonları yenilə
  function syncButtons() {
    apply(document.documentElement.getAttribute('data-theme'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncButtons);
  } else {
    syncButtons();
  }

  window.HiveTheme = { apply: apply, toggle: toggle, sync: syncButtons, current: function () { return document.documentElement.getAttribute('data-theme'); } };
})();
