(() => {
  'use strict';
  const current = document.currentScript || [...document.scripts].find(s => /learning-tracker\.js(?:\?|$)/.test(s.src));
  if (!current || window.ANDES_LMS?.version?.startsWith('3.')) return;
  const src = new URL('learning-tracker-v3.js?v=20260912c', current.src).href;
  if ([...document.scripts].some(s => s.src === src)) return;
  const el = document.createElement('script');
  el.src = src;
  el.async = false;
  document.head.appendChild(el);
})();
