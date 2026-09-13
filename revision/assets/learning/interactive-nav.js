(() => {
  'use strict';
  const current=document.currentScript||[...document.scripts].find(s=>/interactive-nav\.js(?:\?|$)/.test(s.src));if(!current)return;
  const dir=new URL('./',current.src);
  const load=name=>new Promise((resolve,reject)=>{const src=new URL(name,dir).href;if([...document.scripts].some(s=>s.src&&s.src.split('?')[0]===src.split('?')[0])){resolve();return}const el=document.createElement('script');el.src=src;el.async=false;el.onload=resolve;el.onerror=reject;document.head.appendChild(el)});
  (async()=>{try{await load('learning-tracker.js?v=20260912-mobile2');await load('presentation-lms-sync.js?v=20260912-lms2');await load('session-lab-button.js?v=20260912-lms2');await load('interactive-nav-base.js?v=20260912-lms2')}catch(e){console.error('ANDESDB presentation runtime',e)}})();
})();