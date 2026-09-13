(() => {
  'use strict';
  const current = document.currentScript || [...document.scripts].find(s => /learning-core\.js(?:\?|$)/.test(s.src));
  if (!current) return;
  const dir = new URL('./', current.src);
  const load = (src) => {
    if ([...document.scripts].some(s => s.src && new URL(s.src, location.href).href === src)) return;
    const el = document.createElement('script'); el.src = src; el.async = false; document.head.appendChild(el);
  };
  load(new URL('learning-core-base.js?v=20260912-lms', dir).href);
  load(new URL('learning-tracker.js?v=20260912-lms', dir).href);
  if(document.querySelector('.slide')) load(new URL('presentation-story-v1.js?v=20260912-story1', dir).href);
})();