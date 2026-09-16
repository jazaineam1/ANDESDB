(() => {
  'use strict';
  const current = document.currentScript || [...document.scripts].find(s => /presentation-timer\.js(?:\?|$)/.test(s.src));
  if (!current) return;
  const src = new URL('../../../assets/learning/presentation-timer.js?v=20260916-shared1', new URL('./', current.src)).href;
  if ([...document.scripts].some(s => s.src === src)) return;
  const el = document.createElement('script');
  el.src = src;
  el.async = false;
  document.head.appendChild(el);
})();
