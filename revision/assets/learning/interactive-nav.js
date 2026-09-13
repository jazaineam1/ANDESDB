(()=>{
'use strict';
const current=document.currentScript||[...document.scripts].find(s=>/interactive-nav\.js(?:\?|$)/.test(s.src));if(!current)return;
const dir=new URL('./',current.src);
const load=name=>new Promise((resolve,reject)=>{const src=new URL(name,dir).href;if([...document.scripts].some(s=>s.src&&s.src.split('?')[0]===src.split('?')[0])){resolve();return}const el=document.createElement('script');el.src=src;el.async=false;el.onload=resolve;el.onerror=reject;document.head.appendChild(el)});
(async()=>{try{
  /* Presentación = visor ligero. El LMS completo vive en Portal/Curso/Lab. */
  await load('course-data.js?v=20260912-state2');
  await load('presentation-text-fixes.js?v=20260912-qa1');
  await load('access-gate.js?v=20260912-lite2');
  await load('analytics-config.js?v=20260912-ga4a');
  await load('analytics.js?v=20260912-ga4a');
  await load('presentation-telemetry.js?v=20260912-lite1');
  if(new URLSearchParams(location.search).has('slide'))await load('presentation-resume.js?v=20260912-lite1');
}catch(e){console.error('ANDESDB presentation runtime',e)}})();
})();