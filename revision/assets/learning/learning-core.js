(() => {
  'use strict';
  const current = document.currentScript || [...document.scripts].find(s => /learning-core\.js(?:\?|$)/.test(s.src));
  if (!current) return;
  const dir = new URL('./', current.src);
  const load = (src) => {
    if ([...document.scripts].some(s => s.src && new URL(s.src, location.href).href.split('?')[0] === src.split('?')[0])) return;
    const el = document.createElement('script'); el.src = src; el.async = false; document.head.appendChild(el);
  };
  const isPresentation = /\/Presentaciones\//i.test(location.pathname) || !!document.querySelector('.slide');
  const guestSurface = new URLSearchParams(location.search).get('guest') === '1' && isPresentation;
  if (guestSurface) {
    window.__ANDES_ACCESS_GATE_V4__ = true;
    load(new URL('guest-mode-v2.js?v=20260913-guest3', dir).href);
  }
  if (!isPresentation) load(new URL('learning-core-base.js?v=20260913-lms2', dir).href);
  load(new URL('learning-tracker.js?v=20260913-guest3', dir).href);
  if(isPresentation){
    load(new URL('presentation-story-v1.js?v=20260912-story1', dir).href);
    load(new URL('presentation-story-v2-patch.js?v=20260912-story2', dir).href);
    load(new URL('presentation-story-v3-polish.js?v=20260912-story3', dir).href);
    if(/sesion[-_\s]*1[3-6]/i.test(location.pathname+' '+document.title)){
      load(new URL('presentation-pacing-cleanup-v1.js?v=20260913-pace1', dir).href);
      load(new URL('presentation-material-alignment-v1.js?v=20260913-align2', dir).href);
    }
    if(/sesion[-_\s]*15/i.test(location.pathname+' '+document.title))load(new URL('presentation-story-s15-patch.js?v=20260912-story1', dir).href);
    if(!guestSurface){
      load(new URL('access-gate.js?v=20260913-lite3', dir).href);
      load(new URL('resource-dock-a11y.js?v=20260913-mobile4', dir).href);
    }
  }
})();