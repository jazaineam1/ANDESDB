(() => {
  'use strict';
  const current = document.currentScript || [...document.scripts].find(s => /learning-core\.js(?:\?|$)/.test(s.src));
  if (!current) return;
  const dir = new URL('./', current.src);
  const load = (src) => {
    if ([...document.scripts].some(s => s.src && new URL(s.src, location.href).href === src)) return;
    const el = document.createElement('script'); el.src = src; el.async = false; document.head.appendChild(el);
  };
  const isPresentation = /\/Presentaciones\//i.test(location.pathname) || !!document.querySelector('.slide');
  /* En las presentaciones el laboratorio vive en el LMS/Recursos. No montamos
     la antigua capa flotante “Práctica”, que duplicaba navegación y chocaba
     con los controles del visor en móvil. */
  if (!isPresentation) load(new URL('learning-core-base.js?v=20260913-lms2', dir).href);
  load(new URL('learning-tracker.js?v=20260912-lms', dir).href);
  if(isPresentation){
    load(new URL('presentation-story-v1.js?v=20260912-story1', dir).href);
    load(new URL('presentation-story-v2-patch.js?v=20260912-story2', dir).href);
    load(new URL('presentation-story-v3-polish.js?v=20260912-story3', dir).href);
    if(/sesion[-_\s]*1[3-6]/i.test(location.pathname+' '+document.title)){
      load(new URL('presentation-selfcontained-v1.js?v=20260913-self1', dir).href);
      load(new URL('presentation-material-alignment-v1.js?v=20260913-align2', dir).href);
    }
    if(/sesion[-_\s]*15/i.test(location.pathname+' '+document.title))load(new URL('presentation-story-s15-patch.js?v=20260912-story1', dir).href);
  }
})();