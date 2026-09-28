(function () {
  var STORAGE_KEY = 'food-delivery:theme';
  var stored = null;

  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    stored = null;
  }

  var prefersLight =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;

  var resolved = stored === 'light' || stored === 'dark' ? stored : prefersLight ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', resolved);
})();
