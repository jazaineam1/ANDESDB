(()=>{
'use strict';
if(window.__ANDES_GUEST_MODE_V3__||window.__ANDES_GUEST_V1_COMPAT__)return;window.__ANDES_GUEST_V1_COMPAT__=true;
const p=new URLSearchParams(location.search),ok=p.get('guest')==='1'&&(/\/lab\.html$/i.test(location.pathname)||/\/reading\.html$/i.test(location.pathname)||/\/Presentaciones\//i.test(location.pathname));if(!ok)return;
window.ANDES_GUEST_MODE=true;
const current=document.currentScript||[...document.scripts].find(s=>/guest-mode-v1\.js(?:\?|$)/.test(s.src));const base=current?.src?new URL('./',current.src):new URL('assets/learning/',location.href);const s=document.createElement('script');s.src=new URL('guest-mode-v3.js?v=20260913-guest3',base).href;s.async=false;s.dataset.andesGuestV3='1';s.onerror=()=>console.error('ANDESDB: no se pudo cargar la ruta de estudio.');document.head.appendChild(s);
})();