(()=>{
  'use strict';
  if(window.__ANDES_ROLE_NAV_V2__) return;
  window.__ANDES_ROLE_NAV_V2__=true;
  const script=document.currentScript||[...document.scripts].find(s=>/role-nav-v2\.js(?:\?|$)/.test(s.src));
  const ROOT=script?new URL('../../',script.src):new URL('./',location.href);
  const PORTAL=new URL('portal.html',ROOT).href;
  const TEACHER=new URL('teacher-dashboard.html',ROOT).href;
  const STORE='andesdb.lms.auth.v1';
  function userLocal(){try{return JSON.parse(localStorage.getItem(STORE)||'null')?.user||null}catch{return null}}
  function roleOf(u){return String(u?.role||'').toLowerCase()}
  function style(){if(document.getElementById('andes-role-nav-v2-css'))return;const s=document.createElement('style');s.id='andes-role-nav-v2-css';s.textContent='#andes-role-access-v2{display:inline-flex;align-items:center;gap:6px;border-radius:9px;padding:8px 10px;background:#ffd600;color:#3d3300;text-decoration:none;font:850 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 4px 14px #0002;white-space:nowrap;margin-left:6px}#andes-role-access-v2:hover{filter:brightness(.97)}@media(max-width:760px){#andes-role-access-v2{position:fixed;right:10px;top:72px;z-index:2147481500;padding:9px 11px}}';document.head.appendChild(s)}
  function button(){let a=document.getElementById('andes-role-access-v2');if(a)return a;a=document.createElement('a');a.id='andes-role-access-v2';a.href=PORTAL;a.textContent='Acceso docente';const host=document.querySelector('.appbar .inner,.topbar,.navbar,header .inner,header')||document.body;host.appendChild(a);return a}
  function apply(u){const a=button(),r=roleOf(u);if(r==='teacher'||r==='admin'){a.href=TEACHER;a.textContent='⚙ Control docente';a.title='Abrir panel docente'}else{a.href=PORTAL;a.textContent='Acceso docente';a.title='Entrar como docente'}}
  async function init(){style();apply(userLocal());let api=window.ANDES_LMS;for(let i=0;!api&&i<40;i++){await new Promise(r=>setTimeout(r,75));api=window.ANDES_LMS}if(!api)return;try{const u=await api.ready();if(u)apply(u)}catch{}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  addEventListener('storage',e=>{if(e.key===STORE)apply(userLocal())});
})();
