(() => {
  'use strict';
  const current = document.currentScript;
  if (!current) return;
  const load = (src) => { const s=document.createElement('script'); s.src=src; s.async=false; document.head.appendChild(s); };
  load(new URL('sql-lab-s6-base.js?v=20260912-lms', current.src).href);
  if (!window.ANDES_LMS) load(new URL('../../assets/learning/learning-tracker.js?v=20260912-lms', current.src).href);
})();
