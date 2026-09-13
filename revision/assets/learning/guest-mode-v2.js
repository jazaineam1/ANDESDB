(()=>{
'use strict';
if(window.__ANDES_GUEST_MODE_V2__)return;
const params=new URLSearchParams(location.search);
const isLab=/\/lab\.html$/i.test(location.pathname),isReading=/\/reading\.html$/i.test(location.pathname),isPresentation=/\/Presentaciones\//i.test(location.pathname);
const enabled=params.get('guest')==='1'&&(isLab||isReading||isPresentation);
if(!enabled)return;
window.__ANDES_GUEST_MODE_V2__=true;
window.ANDES_GUEST_MODE=true;
const script=document.currentScript||[...document.scripts].find(s=>/guest-mode-v2\.js(?:\?|$)/.test(s.src));
const ROOT=script?new URL('../../',script.src):new URL('./',location.href);
const STORE='andesdb.guest.local.v1',PENDING='andesdb.lms.pending.v3',RELIABLE='andesdb.lab.reliable.v1.anonymous';
const kind=isLab?'lab':isReading?'reading':'presentation';
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{"completed":{},"visited":{}}')}catch{return {completed:{},visited:{}}}};
const write=x=>{try{localStorage.setItem(STORE,JSON.stringify(x))}catch(_){}};
const completed=()=>read().completed||{};
const remember=(code,score=1)=>{if(!code)return;const x=read();x.completed||={};x.completed[String(code)]={at:new Date().toISOString(),score:Number(score||1)};write(x);dispatchEvent(new CustomEvent('andesdb:guest-progress',{detail:{activity_code:String(code),score:Number(score||1)}}))};
const has=code=>Boolean(completed()[String(code)]);
const activityProgress=()=>Object.entries(completed()).map(([activity_code,v])=>({activity_code,status:'completed',score:Number(v?.score||1),completed_at:v?.at||null}));
function currentSession(){
  const q=Number(params.get('session'));if(Number.isInteger(q)&&q>=1&&q<=16)return q;
  const m=(location.pathname+' '+document.title).match(/sesion[-_\s]*(\d{1,2})/i);return m?Number(m[1]):null;
}
function markVisit(){const n=currentSession();if(!n)return;const x=read();x.visited||={};x.visited[`${kind}:${n}`]={at:new Date().toISOString()};x.last={session:n,kind,at:new Date().toISOString()};write(x)}

try{
  const nativeSet=Storage.prototype.setItem;
  if(!Storage.prototype.__andesGuestPatched){
    Object.defineProperty(Storage.prototype,'__andesGuestPatched',{value:true,configurable:true});
    Storage.prototype.setItem=function(key,value){if(window.ANDES_GUEST_MODE&&this===localStorage&&String(key)===PENDING)return;return nativeSet.call(this,key,value)};
  }
}catch(_){ }

function patchLms(api){
  if(!api||api.__guestModeV2)return api;
  api.__guestModeV2=true;
  api.localCompleted=code=>has(code);
  api.complete=(activity,score=1)=>{remember(activity,score);return Promise.resolve(true)};
  api.attempt=()=>Promise.resolve(false);api.fail=()=>Promise.resolve(false);api.hint=()=>Promise.resolve(false);api.track=()=>Promise.resolve(false);
  api.dashboard=async()=>({activity_progress:activityProgress(),guest:true});api.me=()=>null;api.ready=()=>Promise.resolve({guest:true,role:'practice'});
  return api;
}
try{
  let current=window.ANDES_LMS;if(current)patchLms(current);
  const d=Object.getOwnPropertyDescriptor(window,'ANDES_LMS');
  if(!d||d.configurable)Object.defineProperty(window,'ANDES_LMS',{configurable:true,enumerable:true,get(){return current},set(v){current=patchLms(v)}});
}catch(_){ }

const hubUrl=()=>new URL('guest.html',ROOT).href;
function guestify(url){try{const u=new URL(url,ROOT);if(u.origin===location.origin)u.searchParams.set('guest','1');return u.href}catch{return url}}
function presentationUrl(n){const href=window.ANDES_COURSE?.session?.(n)?.href;if(href)return guestify(new URL(href,ROOT).href);if(isPresentation)return guestify(location.href);return '#'}
function readingUrl(n){return new URL(`reading.html?session=${n}&guest=1`,ROOT).href}
function labUrl(n){return new URL(`lab.html?session=${n}&guest=1`,ROOT).href}
function setHref(el,url){if(el&&el.getAttribute('href')!==url)el.setAttribute('href',url)}

function installRoute(){
  const n=currentSession();if(!n||!document.body)return;
  let dock=document.getElementById('andes-study-route');
  if(!dock){
    dock=document.createElement('div');dock.id='andes-study-route';dock.innerHTML='<button class="sr-open" type="button" aria-expanded="false">☰ Ruta</button><div class="sr-panel" role="dialog" aria-label="Ruta de estudio"></div>';document.body.appendChild(dock);
    const b=dock.querySelector('.sr-open');b.onclick=e=>{e.stopPropagation();const open=dock.classList.toggle('open');b.setAttribute('aria-expanded',String(open))};
    document.addEventListener('click',e=>{if(dock.classList.contains('open')&&!dock.contains(e.target)){dock.classList.remove('open');b.setAttribute('aria-expanded','false')}},{passive:true});
  }
  const p=presentationUrl(n),r=readingUrl(n),l=labUrl(n);
  dock.querySelector('.sr-panel').innerHTML=`<div class="sr-head"><b>S${n} · Ruta de estudio</b><span>Presentación, lectura y práctica de la misma sesión.</span></div><a class="sr-link ${kind==='presentation'?'current':''}" href="${p}"><span>▣</span><span><b>Presentación</b><small>Recorre los conceptos y ejemplos de clase</small></span></a><a class="sr-link ${kind==='reading'?'current':''}" href="${r}"><span>▤</span><span><b>Lectura</b><small>Reconstruye, explica y amplía lo trabajado</small></span></a><a class="sr-link ${kind==='lab'?'current':''}" href="${l}"><span>✓</span><span><b>Laboratorio</b><small>Comprueba lo aprendido con 10 prácticas</small></span></a><div class="sr-sep"></div><a class="sr-link" href="${hubUrl()}"><span>←</span><span><b>Sesiones disponibles</b><small>Volver a la ruta completa</small></span></a>`;
}

function decorate(){
  if(!document.body)return;
  document.body.classList.add('guest-mode',`guest-${kind}`);markVisit();
  const home=hubUrl();
  const logout=document.getElementById('logout-top');if(logout&&!logout.dataset.guestExit){logout.dataset.guestExit='1';logout.textContent='Salir';logout.onclick=e=>{e.preventDefault();location.assign(home)}}
  document.querySelectorAll('.brand,.crumb a,.side-link,.mobile-nav a').forEach(a=>setHref(a,home));
  document.querySelectorAll('a.navlink').forEach(a=>{const h=a.getAttribute('href')||'';if(/calendar\.html/i.test(h)){a.style.display='none'}else{setHref(a,home);if(/curso/i.test(a.textContent||''))a.textContent='Sesiones'}});
  const back=document.getElementById('back-pres');if(back){setHref(back,home);back.textContent='▤ Sesiones'}
  const hub=document.getElementById('hub-link');if(hub){setHref(hub,home);hub.textContent='Volver a sesiones →'}
  const legend=document.querySelector('.sync-legend');if(legend&&!legend.dataset.guestDecorated){legend.dataset.guestDecorated='1';legend.innerHTML='<span class="sync-ok">✓ Guardado en este dispositivo</span>'}
  if(isLab&&!document.getElementById('guest-mode-note')){
    const host=document.querySelector('.compact-head .wrap');
    if(host){const box=document.createElement('div');box.id='guest-mode-note';box.innerHTML='<b>Tu progreso</b><span>El avance se guarda en este navegador.</span><button type="button" id="guest-reset">Reiniciar mi progreso</button>';host.appendChild(box);box.querySelector('#guest-reset').onclick=()=>{if(confirm('¿Quieres borrar el progreso guardado en este dispositivo?')){localStorage.removeItem(STORE);localStorage.removeItem(RELIABLE);location.reload()}}}
  }
  installRoute();
}

const style=document.createElement('style');style.id='guest-mode-v2-style';style.textContent=`
#guest-mode-note{margin-top:10px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid #dfd7a7;background:#fffbea;border-radius:10px;color:#3d3300;font-size:.78rem}#guest-mode-note b{font-size:.8rem}#guest-mode-note span{color:#675c35}#guest-mode-note button{border:1px solid #cabf88;background:#fff;color:#554800;border-radius:8px;padding:7px 9px;font-weight:800;cursor:pointer}.guest-mode .sync-pending{display:none!important}.guest-mode .logout{background:#ffffff12}
#andes-study-route{position:fixed;right:12px;bottom:14px;z-index:2147483400;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}body.guest-lab #andes-study-route{bottom:calc(78px + env(safe-area-inset-bottom))}#andes-study-route .sr-open{border:1px solid #ffffff38;background:#101828f5;color:#fff;border-radius:999px;padding:11px 14px;font:850 12px/1 system-ui;box-shadow:0 10px 30px #0004;cursor:pointer}#andes-study-route .sr-panel{display:none;position:absolute;right:0;bottom:50px;width:min(340px,calc(100vw - 24px));background:#fff;color:#17202a;border:1px solid #d8dee8;border-radius:14px;box-shadow:0 24px 70px #0005;padding:9px}#andes-study-route.open .sr-panel{display:block}.sr-head{padding:8px 9px 10px;border-bottom:1px solid #edf0f4}.sr-head b{display:block;font-size:14px}.sr-head span{display:block;margin-top:3px;color:#667085;font-size:11px;line-height:1.35}.sr-link{display:flex;align-items:flex-start;gap:9px;padding:10px 9px;border-radius:9px;color:#17202a;text-decoration:none;font-size:12px;line-height:1.3}.sr-link:hover,.sr-link:focus{background:#f2f4f7;outline:none}.sr-link.current{background:#fff7cc}.sr-link b{display:block}.sr-link small{display:block;color:#667085;margin-top:2px}.sr-sep{height:1px;background:#edf0f4;margin:3px 9px}
@media(max-width:700px){#guest-mode-note{grid-template-columns:1fr}#guest-mode-note button{justify-self:start}#andes-study-route{right:10px}#andes-study-route .sr-panel{position:fixed;left:10px;right:10px;bottom:calc(64px + env(safe-area-inset-bottom));width:auto}body.guest-lab #andes-study-route .sr-panel{bottom:calc(126px + env(safe-area-inset-bottom))}}
html[data-andes-theme="dark"] #guest-mode-note,html[data-theme="dark"] #guest-mode-note{background:#25220f;border-color:#57501d;color:#ffe784}html[data-andes-theme="dark"] #guest-mode-note span,html[data-theme="dark"] #guest-mode-note span{color:#e4dcae}html[data-andes-theme="dark"] #guest-mode-note button,html[data-theme="dark"] #guest-mode-note button{background:#111827;color:#fff;border-color:#5d6470}html[data-andes-theme="dark"] #andes-study-route .sr-panel,html[data-theme="dark"] #andes-study-route .sr-panel{background:#101828;color:#f8fafc;border-color:#344054}html[data-andes-theme="dark"] .sr-head,html[data-theme="dark"] .sr-head{border-color:#344054}html[data-andes-theme="dark"] .sr-head span,html[data-theme="dark"] .sr-head span,html[data-andes-theme="dark"] .sr-link small,html[data-theme="dark"] .sr-link small{color:#cbd5e1}html[data-andes-theme="dark"] .sr-link,html[data-theme="dark"] .sr-link{color:#f8fafc}html[data-andes-theme="dark"] .sr-link:hover,html[data-theme="dark"] .sr-link:hover{background:#1d2939}html[data-andes-theme="dark"] .sr-link.current,html[data-theme="dark"] .sr-link.current{background:#3a3210}.sr-sep{background:#344054}`;document.head.appendChild(style);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{decorate();requestAnimationFrame(decorate);setTimeout(decorate,350)},{once:true});else{decorate();requestAnimationFrame(decorate);setTimeout(decorate,350)}
addEventListener('pageshow',decorate,{passive:true});addEventListener('andesdb:lab-task-rendered',decorate,{passive:true});addEventListener('andesdb:course-ready',decorate,{passive:true});addEventListener('andesdb:course-updated',decorate,{passive:true});
let atries=0;const at=setInterval(()=>{atries++;if(window.ANDES_ANALYTICS){window.ANDES_ANALYTICS.event('guest_surface_opened',{source:'practice_route',surface:kind,session:currentSession()||0});clearInterval(at)}else if(atries>40)clearInterval(at)},250);
})();