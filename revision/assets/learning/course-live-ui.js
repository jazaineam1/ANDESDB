(()=>{
'use strict';
if(window.__ANDES_COURSE_LIVE_UI__)return;window.__ANDES_COURSE_LIVE_UI__=true;
const GROUP='39';
/* URL pública estable de registro. No publicamos parámetros temporales tk/_x_zm_* ni #/edit. */
const ZOOM='https://uniandes-edu-co.zoom.us/meeting/register/uQc1alUfQ7iiGml8SwG9hg';
window.ANDES_COURSE_LIVE={group:GROUP,zoom:ZOOM};
function css(){if(document.getElementById('andes-live-ui-css'))return;const s=document.createElement('style');s.id='andes-live-ui-css';s.textContent=`
.andes-live-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0;padding:13px 14px;border:1px solid #93c5fd;border-left:5px solid #175cd3;border-radius:14px;background:linear-gradient(135deg,#eff6ff,#fff);color:#17202a;box-shadow:0 6px 18px #10182812}.andes-live-copy b{display:block;font-size:.82rem}.andes-live-copy span{display:block;margin-top:3px;color:#475467;font-size:.72rem}.andes-live-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:10px;padding:11px 14px;background:#175cd3;color:#fff!important;text-decoration:none!important;font:900 .79rem/1 system-ui;white-space:nowrap;box-shadow:0 5px 14px #175cd344}.andes-live-btn:hover{background:#1849a9}.andes-live-btn:focus-visible{outline:3px solid #84adff;outline-offset:2px}.rd-link.live{background:#eff6ff!important;color:#1849a9!important;border:1px solid #93c5fd!important}
@media(max-width:620px){.andes-live-strip{align-items:stretch;flex-direction:column;margin:10px 0}.andes-live-btn{width:100%;min-height:46px;font-size:.82rem}}
`;document.head.appendChild(s)}
function makeStrip(){const box=document.createElement('div');box.className='andes-live-strip';box.dataset.liveZoom='1';box.innerHTML=`<div class="andes-live-copy"><b>🎥 Grupo ${GROUP} · conexión a la clase</b><span>Este botón abre directamente el acceso de Zoom de las sesiones sincrónicas.</span></div><a class="andes-live-btn" href="${ZOOM}" target="_blank" rel="noopener noreferrer">Entrar a Zoom →</a>`;return box}
function placeMainStrip(){
 if(/\/Presentaciones\//i.test(location.pathname))return;
 if(document.querySelector('.andes-live-strip'))return;
 let host=null;
 if(/\/portal\.html$/i.test(location.pathname)){
   const app=document.getElementById('app');
   if(!app||!app.classList.contains('page'))return;
   host=app.querySelector('.topline')||app.firstElementChild;
   if(host)host.insertAdjacentElement('afterend',makeStrip());
   return;
 }
 if(/\/learning-hub\.html$/i.test(location.pathname)){
   host=document.querySelector('.course-top');
   if(host)host.insertAdjacentElement('afterend',makeStrip());
   return;
 }
 if(/\/calendar\.html$/i.test(location.pathname)){
   host=document.querySelector('.head');
   if(host)host.insertAdjacentElement('afterend',makeStrip());
 }
}
function calendarButton(){if(!/\/calendar\.html$/i.test(location.pathname))return;const head=document.querySelector('.head');if(!head)return;const actions=head.querySelector('.actions');if(actions&&!actions.querySelector('[data-live-zoom]')){const a=document.createElement('a');a.className='btn primary';a.dataset.liveZoom='1';a.href=ZOOM;a.target='_blank';a.rel='noopener noreferrer';a.textContent='🎥 Entrar a Zoom';actions.prepend(a)}const m=head.querySelector('.muted');if(m&&!/grupo\s*39/i.test(m.textContent))m.textContent+=' · Grupo 39'}
function presentation(){if(!/\/Presentaciones\//i.test(location.pathname))return;const panel=document.querySelector('#andes-resource-dock .rd-panel');if(!panel||panel.querySelector('[data-live-zoom]'))return;const group=panel.querySelector('.rd-group');if(!group)return;const a=document.createElement('a');a.className='rd-link live';a.dataset.liveZoom='1';a.href=ZOOM;a.target='_blank';a.rel='noopener noreferrer';a.innerHTML='<span>🎥</span><span><strong>Zoom · Grupo 39</strong><small>Abrir conexión a la clase</small></span>';group.prepend(a)}
function run(){css();placeMainStrip();calendarButton();presentation()}
let timer=null;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(run,35)});function boot(){run();obs.observe(document.body||document.documentElement,{childList:true,subtree:true});setTimeout(run,150);setTimeout(run,500);setTimeout(run,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();