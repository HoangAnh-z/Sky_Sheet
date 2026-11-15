(function () {
  'use strict';
  var preference;
  try { preference = localStorage.getItem('phongnhacsky.theme'); } catch (_) {}
  var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = preference === 'light' || preference === 'dark' ? preference : dark ? 'dark' : 'light';
})();
