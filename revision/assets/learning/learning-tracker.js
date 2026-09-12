(()=>{
  'use strict';
  const current=document.currentScript||[...document.scripts].find(s=>/learning-tracker\.js(?:\?|$)/.test(s.src));
  if(!current)return;
  const dir=new URL('./',current.src);
  const has=file=>[...document.scripts].some(s=>s.src&&s.src.includes(file));
  const add=(file,ordered=true)=>new Promise((resolve,reject)=>{
    if(has(file.split('?')[0])){resolve();return}
    const s=document.createElement('script');s.src=new URL(file,dir).href;s.async=!ordered;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
  (async()=>{
    try{
      if(!window.ANDES_COURSE)await add('course-data.js?v=20260912-lms2');
      try{await window.ANDES_COURSE?.ready?.()}catch(_){ }
      if(!window.ANDES_PLATFORM)await add('lms-platform.js?v=20260912-lms2');
      if(!window.__ANDES_HEARTBEAT_POLICY__)await add('heartbeat-policy.js?v=20260912a');
      if(!window.ANDES_LMS?.version?.startsWith('3.'))await add('learning-tracker-v3.js?v=20260912-lms2');
      await add('lms-integral-patch.js?v=20260912-lms2');
      await add('role-nav-v2.js?v=20260912-lms2');
      await add('access-gate.js?v=20260912-lms2');
    }catch(e){console.error('ANDESDB LMS runtime',e)}
  })();
  setTimeout(async()=>{
    try{
      if(!window.ANDES_ANALYTICS_CONFIG)await add('analytics-config.js?v=20260912-ga4a',false);
      if(!window.ANDES_ANALYTICS)await add('analytics.js?v=20260912-ga4a',false);
    }catch(_){ }
  },800);
})();