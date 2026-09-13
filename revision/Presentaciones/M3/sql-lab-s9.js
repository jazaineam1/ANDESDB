(() => {
  'use strict';
  const current = document.currentScript;
  if (!current) return;
  const load = (src) => new Promise((resolve,reject) => {
    if ([...document.scripts].some(s => s.src && s.src.split('?')[0] === src.split('?')[0])) { resolve(); return; }
    const s=document.createElement('script'); s.src=src; s.async=false; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
  });
  (async()=>{
    try{
      await load(new URL('sql-lab-s9-base.js?v=20260912-lms', current.src).href);
      if (!window.ANDES_LMS) await load(new URL('../../assets/learning/learning-tracker.js?v=20260912-lms', current.src).href);
      await load(new URL('../../assets/learning/presentation-story-v1.js?v=20260912-story1', current.src).href);
      await load(new URL('../../assets/learning/presentation-story-v2-patch.js?v=20260912-story2', current.src).href);
      await load(new URL('../../assets/learning/presentation-story-v3-polish.js?v=20260912-story3', current.src).href);
    }catch(e){console.warn('ANDESDB S9 runtime parcial',e)}
  })();
})();