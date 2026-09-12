(() => {
  'use strict';
  const current = document.currentScript || [...document.scripts].find(s => /pwa-install\.js(?:\?|$)/.test(s.src));
  if (!current) return;
  const dir = new URL('./', current.src);
  const root = new URL('../', dir);
  const here = new URL(location.href);
  const isRevisionHome = here.pathname === root.pathname || here.pathname === root.pathname + 'index.html';
  if (isRevisionHome && here.searchParams.get('course') !== 'andesdb') {
    const target = new URL('portal.html', root);
    if (here.searchParams.get('source')) target.searchParams.set('source', here.searchParams.get('source'));
    location.replace(target.href);
    return;
  }
  const load = (src) => { if ([...document.scripts].some(s=>s.src===src)) return; const s=document.createElement('script'); s.src=src; s.async=false; document.head.appendChild(s); };
  load(new URL('pwa-install-base.js?v=20260912-lms', dir).href);
  if (!window.ANDES_LMS) load(new URL('learning/learning-tracker.js?v=20260912-portal1', dir).href);
})();
