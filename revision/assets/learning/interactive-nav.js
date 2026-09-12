(() => {
  'use strict';
  const current = document.currentScript || [...document.scripts].find(s => /interactive-nav\.js(?:\?|$)/.test(s.src));
  if (!current) return;
  const dir = new URL('./', current.src);
  const src = new URL('learning-tracker.js?v=20260912c', dir).href;
  if ([...document.scripts].some(s => s.src && new URL(s.src, location.href).href === src)) return;
  const el = document.createElement('script');
  el.src = src;
  el.async = false;
  document.head.appendChild(el);
})();
