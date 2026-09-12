(()=>{
  'use strict';
  if(window.__ANDES_ROLE_NAV__) return;
  window.__ANDES_ROLE_NAV__=true;
  const script=document.currentScript||[...document.scripts].find(s=>/role-nav\.js(?:\?|$)/.test(s.src));
  const ROOT=script?new URL('../../',script.src):new URL('./',location.href);
  const PORTAL=new URL('portal.html',ROOT).href;
  const TEACHER=new URL('teacher-dashboard.html',ROOT).href;
  const STORE='andesdb.lms.auth.v1';
  const escRole=u=>String(u?.role||'').toLowerCase();
  function localUser(){try{return JSON.parse(localStorage.getItem(STORE)||'null')?.user||null}catch{return null}}
  function ensureStyle(){if(document.getElementById('andes-role-nav-css'))return;const s=document.createElement('style');s.id='andes-role-nav-css';s.textContent=`#andes-role-access{display:none;align-items:center;gap:6px;border-radius:9px;padding:8px 10px;background:#ffd600;color:#3d3300;text-decoration:none;font:850 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 4px 14px #0002;white-space:nowrap}#andes-role-access.show{display:inline-flex}@media(max-width:760px){#andes-role-access{position:fixed;right:10px;top:72px;z-index:2147481500;padding:9px 11px}}`;document.head.appendChild(s)}
  function ensureButton(){let a=document.getElementById('andes-role-access');if(a)return a;a=document.createElement('a');a.id='andes-role-access';a.href=PORTAL;a.textContent='Acceso docente';const host=document.querySelector('.appbar .inner,.topbar,.navbar,header .inner,header')||document.body;host.appendChild(a);return a}
  function apply(user){const a=ensureButton(),role=escRole(user);if(role==='teacher'||role==='admin'){a.href=TEACHER;a.textContent='⚙ Control docente';a.title='Abrir panel docente';a.classList.add('show');}else{a.href=PORTAL;a.textContent='Acceso docente';a.title='Iniciar como docente';a.classList.remove('show')}}
  async function resolve(){ensureStyle();apply(localUser());let api=window.ANDES_LMS;for(let i=0;!api&&i<40;i++){await new Promise(r=>setTimeout(r,75));api=window.ANDES_LMS}if(!api)return;try{const u=await api.ready();if(u)apply(u)}catch{}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resolve,{once:true});else resolve();
  addEventListener('storage',e=>{if(e.key===STORE)apply(localUser())});
})();
