(()=>{
'use strict';
if(window.__ANDES_GUEST_MODE_V3__)return;
const params=new URLSearchParams(location.search);
const isLab=/\/lab\.html$/i.test(location.pathname);
const isReading=/\/reading\.html$/i.test(location.pathname);
const isPresentation=/\/Presentaciones\//i.test(location.pathname)||!!document.querySelector('.slide');
const enabled=params.get('guest')==='1'&&(isLab||isReading||isPresentation);
if(!enabled)return;
window.__ANDES_GUEST_MODE_V3__=true;
window.ANDES_GUEST_MODE=true;
const currentScript=document.currentScript||[...document.scripts].find(s=>/guest-mode-v3\.js(?:\?|$)/.test(s.src));
const ROOT=currentScript?.src?new URL('../../',currentScript.src):new URL('/ANDESDB/revision/',location.origin);

const STORE='andesdb.guest.local.v1';
const PRIMARY={1:'s1-diagnostico',2:'sql-s2',3:'sql-s3',4:'sql-s4',5:'sql-s5',6:'s6-reglas-evidencia',7:'erd-s7',8:'erd-s8',9:'s9-constraints',10:'decision-s10',11:'s11-documentos',12:'warehouse-s12',13:'bigquery-s13',14:'unnest-s14',15:'s15-integrador',16:'s16-dp900'};
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{"completed":{},"visited":{}}')}catch{return {completed:{},visited:{}}}};
const write=x=>{try{localStorage.setItem(STORE,JSON.stringify(x))}catch(_){}};
function currentSession(){
  const q=Number(params.get('session'));if(Number.isInteger(q)&&q>=1&&q<=16)return q;
  const m=(location.pathname+' '+document.title).match(/sesion[-_\s]*(\d{1,2})/i);return m?Number(m[1]):null;
}
const surface=()=>isLab?'lab':isReading?'reading':'presentation';
function markVisited(kind=surface(),n=currentSession()){
  if(!n)return;const x=read();x.completed||={};x.visited||={};x.visited[`${kind}:${n}`]=new Date().toISOString();x.last={kind,session:n,at:new Date().toISOString()};write(x);
}
function completed(){return read().completed||{}}
function remember(code,score=1){if(!code)return;const x=read();x.completed||={};x.completed[String(code)]={at:new Date().toISOString(),score:Number(score||1)};write(x);dispatchEvent(new CustomEvent('andesdb:guest-progress',{detail:{activity_code:String(code),score:Number(score||1)}}))}
const has=code=>Boolean(completed()[String(code)]);
const activityProgress=()=>Object.entries(completed()).map(([activity_code,v])=>({activity_code,status:'completed',score:Number(v?.score||1),completed_at:v?.at||null}));

const guestApi={
  version:'guest-3.0.0',__guestModeV3:true,
  ready:()=>Promise.resolve({guest:true,role:'guest'}),user:()=>null,
  localCompleted:code=>has(code),complete:(activity,score=1)=>{remember(activity,score);return Promise.resolve(true)},
  attempt:()=>Promise.resolve(false),hint:()=>Promise.resolve(false),fail:()=>Promise.resolve(false),track:()=>Promise.resolve(false),
  dashboard:async()=>({activity_progress:activityProgress(),guest:true}),currentSession,currentActivity:()=>PRIMARY[currentSession()]||null,
  open:async()=>false,logout:async()=>false
};
try{window.ANDES_LMS=guestApi}catch(_){ }

const rootUrl=(path='guest.html')=>new URL(path,ROOT);
function routeHome(n=currentSession()){const u=rootUrl('guest.html');if(n)u.hash=`s${n}`;return u.href}
function guestify(href){
  try{const u=new URL(href,location.href);if(u.origin!==location.origin)return u.href;
    if(/\/portal\.html$|\/learning-hub\.html$/i.test(u.pathname))return routeHome();
    if(/\/reading\.html$|\/lab\.html$|\/Presentaciones\//i.test(u.pathname))u.searchParams.set('guest','1');
    return u.href;
  }catch{return href}
}
function sessionHref(kind,n=currentSession()){
  if(!n)return routeHome();
  if(kind==='reading')return guestify(rootUrl(`reading.html?session=${n}`).href);
  if(kind==='lab')return guestify(rootUrl(`lab.html?session=${n}`).href);
  const course=window.ANDES_COURSE?.session?.(n);return course?.href?guestify(rootUrl(course.href).href):routeHome(n);
}
function setHref(el,url){if(el&&url&&el.getAttribute('href')!==url)el.setAttribute('href',url)}
function ensureStyle(){if(document.getElementById('andes-guest-v3-style'))return;const s=document.createElement('style');s.id='andes-guest-v3-style';s.textContent=`
body.guest-mode #andes-access-gate,body.guest-mode #andes-learning-btn,body.guest-mode #andes-role-access-v2{display:none!important}
#guest-mode-note{margin-top:10px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid #dfd7a7;background:#fffbea;border-radius:10px;color:#3d3300;font-size:.78rem}#guest-mode-note b{font-size:.8rem}#guest-mode-note span{color:#675c35}#guest-mode-note button{border:1px solid #cabf88;background:#fff;color:#554800;border-radius:8px;padding:7px 9px;font-weight:800;cursor:pointer}.guest-mode .sync-pending{display:none!important}
#guest-study-nav{position:fixed;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:2147483450;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}#guest-study-nav button{border:1px solid #ffffff35;background:#101828f4;color:#fff;border-radius:999px;padding:11px 14px;box-shadow:0 9px 28px #0004;font:850 12px/1 system-ui;cursor:pointer}#guest-study-nav .gs-panel{display:none;position:absolute;right:0;bottom:50px;width:min(310px,calc(100vw - 24px));background:#fff;color:#17202a;border:1px solid #d8dee8;border-radius:14px;box-shadow:0 22px 60px #0004;padding:8px}#guest-study-nav.open .gs-panel{display:grid;gap:4px}#guest-study-nav a{display:block;padding:10px;border-radius:9px;color:#17202a;text-decoration:none;font-size:12px;font-weight:800}#guest-study-nav a:hover,#guest-study-nav a:focus{background:#f2f4f7;outline:none}#guest-study-nav a.current{background:#fff7cc;color:#5f4c00}
@media(max-width:700px){#guest-mode-note{grid-template-columns:1fr}#guest-mode-note button{justify-self:start}#guest-study-nav{right:10px;bottom:calc(84px + env(safe-area-inset-bottom))}}
html[data-andes-theme="dark"] #guest-mode-note,html[data-theme="dark"] #guest-mode-note{background:#25220f;border-color:#57501d;color:#ffe784}html[data-andes-theme="dark"] #guest-mode-note span,html[data-theme="dark"] #guest-mode-note span{color:#e4dcae}html[data-andes-theme="dark"] #guest-mode-note button,html[data-theme="dark"] #guest-mode-note button{background:#111827;color:#fff;border-color:#5d6470}`;document.head.appendChild(s)}
function installRouteNav(){
  if(isLab||document.getElementById('guest-study-nav'))return;const n=currentSession();if(!n)return;
  const nav=document.createElement('div');nav.id='guest-study-nav';const cur=surface();nav.innerHTML=`<button type="button" aria-expanded="false">☰ Ruta</button><div class="gs-panel"><a href="${sessionHref('presentation',n)}" class="${cur==='presentation'?'current':''}">Presentación</a><a href="${sessionHref('reading',n)}" class="${cur==='reading'?'current':''}">Lectura</a><a href="${sessionHref('lab',n)}">Laboratorio</a><a href="${routeHome(n)}">Todas las sesiones</a></div>`;document.body.appendChild(nav);const b=nav.querySelector('button');b.onclick=e=>{e.stopPropagation();const open=nav.classList.toggle('open');b.setAttribute('aria-expanded',String(open))};document.addEventListener('click',e=>{if(nav.classList.contains('open')&&!nav.contains(e.target)){nav.classList.remove('open');b.setAttribute('aria-expanded','false')}},{passive:true});
}
function decorateLab(){
  const n=currentSession(),home=routeHome(n),reading=sessionHref('reading',n),presentation=sessionHref('presentation',n);
  const logout=document.getElementById('logout-top');if(logout&&!logout.dataset.guestExit){logout.dataset.guestExit='1';logout.textContent='Salir';logout.onclick=e=>{e.preventDefault();location.assign(home)}}
  document.querySelectorAll('.brand,.crumb a:first-child,.side-nav a:first-child,.side-link').forEach(a=>setHref(a,home));
  const crumb=[...document.querySelectorAll('.crumb a')];if(crumb[1]){setHref(crumb[1],home);crumb[1].textContent='Sesiones'}
  const side=[...document.querySelectorAll('.side-nav a')];if(side[1]){setHref(side[1],reading);side[1].textContent='▤ Lectura'}if(side[2]){setHref(side[2],home);side[2].textContent='☰ Ruta'}
  const back=document.getElementById('back-pres');if(back){setHref(back,presentation);back.textContent='▶ Presentación'}
  const hub=document.getElementById('hub-link');if(hub){setHref(hub,home);hub.textContent='Volver a la ruta de esta sesión →'}
  const mobile=[...document.querySelectorAll('.mobile-nav a')];if(mobile[0]){setHref(mobile[0],home);mobile[0].innerHTML='⌂<br>Ruta'}if(mobile[1]){setHref(mobile[1],reading);mobile[1].innerHTML='▤<br>Lectura'}if(mobile[2]){setHref(mobile[2],location.href);mobile[2].innerHTML='✓<br>Laboratorio'}
  const legend=document.querySelector('.sync-legend');if(legend&&!legend.dataset.guestDecorated){legend.dataset.guestDecorated='1';legend.innerHTML='<span class="sync-ok">✓ Guardado en este dispositivo</span>'}
  if(!document.getElementById('guest-mode-note')){const host=document.querySelector('.compact-head .wrap');if(host){const box=document.createElement('div');box.id='guest-mode-note';box.innerHTML='<b>Tu progreso</b><span>El avance se guarda en este navegador.</span><button type="button" id="guest-reset">Reiniciar mi progreso</button>';host.appendChild(box);box.querySelector('#guest-reset').onclick=()=>{if(confirm('¿Quieres borrar el progreso guardado en este dispositivo?')){localStorage.removeItem(STORE);localStorage.removeItem('andesdb.guest.answers.v1.s'+n);location.reload()}}}}
}
function decorateGeneral(){
  const n=currentSession(),home=routeHome(n);document.querySelectorAll('a[href]').forEach(a=>{if(a.hasAttribute('download')||a.target==='_blank')return;let u;try{u=new URL(a.href,location.href)}catch{return}if(u.origin!==location.origin)return;if(/\/portal\.html$|\/learning-hub\.html$/i.test(u.pathname)){setHref(a,home);return}if(/\/reading\.html$|\/lab\.html$|\/Presentaciones\//i.test(u.pathname))setHref(a,guestify(u.href))});
  const brand=document.querySelector('.brand');if(brand)setHref(brand,home);installRouteNav();
}
function decorate(){if(!document.body)return;document.body.classList.add('guest-mode');ensureStyle();if(isLab)decorateLab();else decorateGeneral()}

document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download')||a.target==='_blank')return;let u;try{u=new URL(a.href,location.href)}catch{return}if(u.origin!==location.origin)return;if(/\/portal\.html$|\/learning-hub\.html$/i.test(u.pathname)){e.preventDefault();location.assign(routeHome());return}if(/\/reading\.html$|\/lab\.html$|\/Presentaciones\//i.test(u.pathname)&&u.searchParams.get('guest')!=='1'){u.searchParams.set('guest','1');e.preventDefault();location.assign(u.href)}},true);

markVisited();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{decorate();requestAnimationFrame(decorate);setTimeout(decorate,300)},{once:true});else{decorate();requestAnimationFrame(decorate);setTimeout(decorate,300)}
addEventListener('pageshow',decorate,{passive:true});addEventListener('andesdb:lab-task-rendered',decorate,{passive:true});addEventListener('andesdb:course-ready',decorate,{passive:true});addEventListener('andesdb:course-updated',decorate,{passive:true});
let tries=0;const a=setInterval(()=>{tries++;if(window.ANDES_ANALYTICS){window.ANDES_ANALYTICS.event('guest_surface_opened',{surface:surface(),session_number:currentSession()||0});clearInterval(a)}else if(tries>30)clearInterval(a)},250);
})();