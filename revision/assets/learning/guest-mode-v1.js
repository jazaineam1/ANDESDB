(()=>{
'use strict';
if(window.__ANDES_GUEST_MODE_V2__)return;
if(window.__ANDES_GUEST_V1_COMPAT__)return;
const params=new URLSearchParams(location.search);
if(params.get('guest')!=='1'||!/\/lab\.html$/i.test(location.pathname))return;
window.__ANDES_GUEST_V1_COMPAT__=true;
window.__ANDES_GUEST_MODE_V1__=true;
window.ANDES_GUEST_MODE=true;
const current=document.currentScript||[...document.scripts].find(s=>/guest-mode-v1\.js(?:\?|$)/.test(s.src));
const base=current?.src?new URL('./',current.src):new URL('assets/learning/',location.href);
const s=document.createElement('script');
s.src=new URL('guest-mode-v2.js?v=20260913-guest2',base).href;
s.async=false;
s.onerror=()=>{
  console.error('ANDESDB: no se pudo cargar el runtime invitado actualizado.');
  const task=document.getElementById('task');
  if(task&&!task.textContent.trim())task.innerHTML='<div style="padding:14px;color:#991b1b">No pudimos iniciar el modo invitado. Recarga la página.</div>';
};
document.head.appendChild(s);
})();