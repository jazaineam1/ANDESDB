(()=>{
'use strict';
if(window.__ANDES_SESSION_CONTROLS_V1__)return;window.__ANDES_SESSION_CONTROLS_V1__=true;
if(/\/Presentaciones\//i.test(location.pathname))return;
const STORE='andesdb.lms.auth.v1',COOKIE='andesdb_lms_session',COOKIE_PATH='/ANDESDB/revision/',API='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-auth';
function auth(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function clear(){try{localStorage.removeItem(STORE)}catch(_){}document.cookie=`${COOKIE}=; Path=${COOKIE_PATH}; Max-Age=0; Secure; SameSite=Lax`}
async function signOut(btn){const a=auth(),token=a?.token;btn.disabled=true;btn.textContent='Saliendo…';clear();try{if(token)await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:'logout'}),keepalive:true})}catch(_){}location.replace('portal.html')}
function mount(){
 const a=auth();if(!a?.token)return;
 if(document.getElementById('logout')||document.querySelector('[data-andes-global-logout]'))return;
 const inner=document.querySelector('.appbar .inner,.topbar .inner,header .inner');if(!inner)return;
 const btn=document.createElement('button');btn.type='button';btn.dataset.andesGlobalLogout='1';btn.className='andes-global-logout';btn.textContent='Salir';btn.setAttribute('aria-label','Cerrar sesión');btn.title='Cerrar sesión';btn.addEventListener('click',()=>signOut(btn));inner.appendChild(btn);
}
const css=document.createElement('style');css.textContent=`.andes-global-logout{border:1px solid #ffffff30;background:transparent;color:#fff;border-radius:5px;padding:9px 12px;min-height:40px;font:850 .78rem/1 system-ui;cursor:pointer;margin-left:6px}.andes-global-logout:hover{background:#ffffff12}.andes-global-logout:focus-visible{outline:3px solid #ffd43b;outline-offset:2px}.andes-global-logout:disabled{opacity:.6;cursor:wait}@media(max-width:680px){.andes-global-logout{padding:9px 10px;margin-left:2px}}`;document.head.appendChild(css);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
new MutationObserver(()=>mount()).observe(document.documentElement,{childList:true,subtree:true});
})();