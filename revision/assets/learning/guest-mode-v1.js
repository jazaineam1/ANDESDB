(()=>{
'use strict';
if(window.__ANDES_GUEST_MODE_V1__)return;
const params=new URLSearchParams(location.search);
const enabled=params.get('guest')==='1'&&/\/lab\.html$/i.test(location.pathname);
if(!enabled)return;
window.__ANDES_GUEST_MODE_V1__=true;
window.ANDES_GUEST_MODE=true;
const STORE='andesdb.guest.local.v1',PENDING='andesdb.lms.pending.v3',RELIABLE='andesdb.lab.reliable.v1.anonymous';
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{"completed":{}}')}catch{return {completed:{}}}};
const write=x=>{try{localStorage.setItem(STORE,JSON.stringify(x))}catch(_){}};
const completed=()=>read().completed||{};
const remember=(code,score=1)=>{if(!code)return;const x=read();x.completed||={};x.completed[String(code)]={at:new Date().toISOString(),score:Number(score||1)};write(x);dispatchEvent(new CustomEvent('andesdb:guest-progress',{detail:{activity_code:String(code),score:Number(score||1)}}))};
const has=code=>Boolean(completed()[String(code)]);
const activityProgress=()=>Object.entries(completed()).map(([activity_code,v])=>({activity_code,status:'completed',score:Number(v?.score||1),completed_at:v?.at||null}));

/* En modo invitado nunca dejamos eventos LMS pendientes que luego puedan asociarse a otra cuenta. */
try{
  const nativeSet=Storage.prototype.setItem;
  if(!Storage.prototype.__andesGuestPatched){
    Object.defineProperty(Storage.prototype,'__andesGuestPatched',{value:true,configurable:true});
    Storage.prototype.setItem=function(key,value){
      if(window.ANDES_GUEST_MODE&&this===localStorage&&String(key)===PENDING)return;
      return nativeSet.call(this,key,value);
    };
  }
}catch(_){ }

function patchLms(api){
  if(!api||api.__guestModeV1)return api;
  api.__guestModeV1=true;
  api.localCompleted=code=>has(code);
  api.complete=(activity,score=1)=>{remember(activity,score);return Promise.resolve(true)};
  api.attempt=()=>Promise.resolve(false);
  api.fail=()=>Promise.resolve(false);
  api.hint=()=>Promise.resolve(false);
  api.track=()=>Promise.resolve(false);
  api.dashboard=async()=>({activity_progress:activityProgress(),guest:true});
  api.me=()=>null;
  return api;
}

/* Parche inmediato: learning-tracker asigna ANDES_LMS después de cargar. */
try{
  let current=window.ANDES_LMS;
  if(current)patchLms(current);
  const d=Object.getOwnPropertyDescriptor(window,'ANDES_LMS');
  if(!d||d.configurable){
    Object.defineProperty(window,'ANDES_LMS',{configurable:true,enumerable:true,get(){return current},set(v){current=patchLms(v)}});
  }
}catch(_){
  let tries=0;const t=setInterval(()=>{tries++;if(window.ANDES_LMS){patchLms(window.ANDES_LMS);clearInterval(t)}else if(tries>200)clearInterval(t)},20);
}

function guestUrl(){return new URL('guest.html',location.href).href}
function decorate(){
  document.body.classList.add('guest-mode');
  const logout=document.getElementById('logout-top');
  if(logout&&!logout.dataset.guestExit){logout.dataset.guestExit='1';logout.textContent='Salir';logout.onclick=e=>{e.preventDefault();location.assign(guestUrl())}}
  document.querySelectorAll('.brand,.crumb a,.side-link,.mobile-nav a').forEach(a=>{a.href=guestUrl()});
  const back=document.getElementById('back-pres');if(back){back.href=guestUrl();back.textContent='▤ Módulo de invitados'}
  const hub=document.getElementById('hub-link');if(hub){hub.href=guestUrl();hub.textContent='Volver al módulo de invitados →'}
  const legend=document.querySelector('.sync-legend');if(legend)legend.innerHTML='<span class="sync-ok">✓ Guardado en este dispositivo</span><span>Sin cuenta</span>';
  if(!document.getElementById('guest-mode-note')){
    const host=document.querySelector('.compact-head .wrap');
    if(host){const box=document.createElement('div');box.id='guest-mode-note';box.innerHTML='<b>Modo invitado</b><span>No necesitas usuario ni contraseña. Tu avance se guarda solo en este navegador.</span><button type="button" id="guest-reset">Reiniciar mi progreso</button>';host.appendChild(box);box.querySelector('#guest-reset').onclick=()=>{if(confirm('¿Quieres borrar el progreso invitado guardado en este dispositivo?')){localStorage.removeItem(STORE);localStorage.removeItem(RELIABLE);location.reload()}}}
  }
}
const style=document.createElement('style');style.id='guest-mode-v1-style';style.textContent=`
#guest-mode-note{margin-top:10px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid #dfd7a7;background:#fffbea;border-radius:10px;color:#3d3300;font-size:.78rem}#guest-mode-note b{font-size:.8rem}#guest-mode-note span{color:#675c35}#guest-mode-note button{border:1px solid #cabf88;background:#fff;color:#554800;border-radius:8px;padding:7px 9px;font-weight:800;cursor:pointer}.guest-mode .sync-pending{display:none!important}.guest-mode .logout{background:#ffffff12}@media(max-width:700px){#guest-mode-note{grid-template-columns:1fr}#guest-mode-note button{justify-self:start}}
html[data-andes-theme="dark"] #guest-mode-note,html[data-theme="dark"] #guest-mode-note{background:#25220f;border-color:#57501d;color:#ffe784}html[data-andes-theme="dark"] #guest-mode-note span,html[data-theme="dark"] #guest-mode-note span{color:#e4dcae}html[data-andes-theme="dark"] #guest-mode-note button,html[data-theme="dark"] #guest-mode-note button{background:#111827;color:#fff;border-color:#5d6470}`;document.head.appendChild(style);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
new MutationObserver(decorate).observe(document.documentElement,{subtree:true,childList:true});

/* Analítica anónima: sin id de invitado ni respuestas. */
let atries=0;const at=setInterval(()=>{atries++;if(window.ANDES_ANALYTICS){window.ANDES_ANALYTICS.event('guest_lab_opened',{source:'guest_module'});clearInterval(at)}else if(atries>40)clearInterval(at)},250);
})();