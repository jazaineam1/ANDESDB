(() => {
  'use strict';
  const current = document.currentScript || [...document.scripts].find(s => /pwa-install\.js(?:\?|$)/.test(s.src));
  if (!current) return;
  const dir = new URL('./', current.src);
  const load = (src) => { const s=document.createElement('script'); s.src=src; s.async=false; document.head.appendChild(s); };
  load(new URL('pwa-install-base.js?v=20260912-lms', dir).href);
  if (!window.ANDES_LMS) load(new URL('learning/learning-tracker.js?v=20260912-lms', dir).href);
})();
