(()=>{
  'use strict';
  const current=document.currentScript||[...document.scripts].find(s=>/learning-tracker\.js(?:\?|$)/.test(s.src));
  if(!current)return;
  const dir=new URL('./',current.src);
  const params=new URLSearchParams(location.search);
  const guestRequested=params.get('guest')==='1';
  const guestAllowed=/\/lab\.html$/i.test(location.pathname)||/\/reading\.html$/i.test(location.pathname)||/\/Presentaciones\//i.test(location.pathname);
  const guestSurface=guestRequested&&guestAllowed;
  /* reading.html todavía declara access-gate.js directamente. Marcamos el gate como resuelto
     antes de que el siguiente script defer se ejecute. Solo aplica a las tres superficies públicas. */
  if(guestSurface){window.__ANDES_ACCESS_GATE_V4__=true;window.ANDES_GUEST_MODE=true}
  const has=file=>[...document.scripts].some(s=>s.src&&s.src.includes(file));
  const add=(file,ordered=true)=>new Promise((resolve,reject)=>{
    if(has(file.split('?')[0])){resolve();return}
    const s=document.createElement('script');s.src=new URL(file,dir).href;s.async=!ordered;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
  (async()=>{
    try{
      const isPresentation=/\/Presentaciones\//i.test(location.pathname);
      if(guestSurface)await add('guest-mode-v2.js?v=20260913-route1');
      if(isPresentation&&!window.__ANDES_PRESENTATION_PERFORMANCE__)await add('presentation-performance.js?v=20260912-perf2');
      if(!window.ANDES_COURSE)await add('course-data.js?v=20260912-perf1');
      try{await window.ANDES_COURSE?.ready?.()}catch(_){ }
      if(guestSurface){
        /* La ruta de práctica usa solo el stub local instalado por guest-mode-v2.
           No carga identidad, expediente, heartbeat, roles ni gate de acceso. */
        return;
      }
      if(!window.ANDES_PLATFORM)await add('lms-platform.js?v=20260912-net2');
      if(!window.__ANDES_HEARTBEAT_POLICY__)await add('heartbeat-policy.js?v=20260912a');
      if(!window.ANDES_LMS?.version?.startsWith('3.'))await add('learning-tracker-v3.js?v=20260912-perf2');
      await add('lms-integral-patch.js?v=20260912-lms2');
      if(/\/lab\.html$/i.test(location.pathname))await add('lab-resume.js?v=20260912-lms2');
      if(isPresentation)await add('presentation-resume.js?v=20260912-perf2');
      await add('role-nav-v2.js?v=20260912-mobile2');
      await add('access-gate.js?v=20260912-mobile2');
      await add('lms-ux-v1.js?v=20260912-side1');
    }catch(e){console.error('ANDESDB LMS runtime',e)}
  })();
  setTimeout(async()=>{
    try{
      if(!window.ANDES_ANALYTICS_CONFIG)await add('analytics-config.js?v=20260912-ga4a',false);
      if(!window.ANDES_ANALYTICS)await add('analytics.js?v=20260912-ga4a',false);
    }catch(_){ }
  },1000);
})();