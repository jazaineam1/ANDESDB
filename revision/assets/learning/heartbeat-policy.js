(() => {
  'use strict';
  if (window.__ANDES_HEARTBEAT_POLICY__) return;
  window.__ANDES_HEARTBEAT_POLICY__=true;
  const original=window.setInterval.bind(window);
  const wrapped=function(fn,delay,...args){
    const body=typeof fn==='function'?Function.prototype.toString.call(fn):String(fn||'');
    if(Number(delay)===15000 && body.includes('pulse') && body.includes('flushPending')) return original(fn,60000,...args);
    return original(fn,delay,...args);
  };
  window.setInterval=wrapped;
  const restore=()=>setTimeout(()=>{if(window.setInterval===wrapped)window.setInterval=original},0);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});else setTimeout(restore,500);
})();
