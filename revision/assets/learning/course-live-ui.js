(()=>{
'use strict';
if(window.__ANDES_COURSE_LIVE_UI__)return;window.__ANDES_COURSE_LIVE_UI__=true;
const GROUP='39';
/* Usamos la URL pública estable de registro. No publicamos los parámetros temporales
   tk/_x_zm_* ni el fragmento #/edit del enlace recibido. */
const ZOOM='https://uniandes-edu-co.zoom.us/meeting/register/uQc1alUfQ7iiGml8SwG9hg';
window.ANDES_COURSE_LIVE={group:GROUP,zoom:ZOOM};
function css(){if(document.getElementById('andes-live-ui-css'))return;const s=document.createElement('style');s.id='andes-live-ui-css';s.textContent=`
.andes-live-strip{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0;padding:10px 12px;border:1px solid #bfdbfe;border-left:4px solid #175cd3;border-radius:12px;background:#eff6ff;color:#17202a;box-shadow:0 4px 14px #1018280a}.andes-live-copy b{display:block;font-size:.78rem}.andes-live-copy span{display:block;margin-top:2px;color:#475467;font-size:.7rem}.andes-live-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:9px;padding:9px 11px;background:#175cd3;color:#fff!important;text-decoration:none!important;font:900 .74rem/1 system-ui;white-space:nowrap;box-shadow:0 4px 12px #175cd333}.andes-live-btn:hover{background:#1849a9}.andes-live-btn:focus-visible{outline:3px solid #84adff;outline-offset:2px}.rd-link.live{background:#eff6ff!important;color:#1849a9!important;border:1px solid #bfdbfe!important}
@media(max-width:620px){.andes-live-strip{align-items:stretch;flex-direction:column}.andes-live-btn{width:100%;min-height:42px}}
`;document.head.appendChild(s)}
function strip(anchor,where='afterend'){
 if(!anchor||document.querySelector('.andes-live-strip'))return;
 const box=document.createElement('div');box.className='andes-live-strip';box.innerHTML=`<div class="andes-live-copy"><b>Grupo ${GROUP} · clase virtual</b><span>Usa este mismo acceso de Zoom para las sesiones sincrónicas.</span></div><a class="andes-live-btn" href="${ZOOM}" target="_blank" rel="noopener noreferrer">🎥 Entrar a Zoom</a>`;anchor.insertAdjacentElement(where,box);
}
function portal(){if(!/\/portal\.html$/i.test(location.pathname))return;const top=document.querySelector('.topline');if(top)strip(top,'afterend')}
function course(){if(!/\/learning-hub\.html$/i.test(location.pathname))return;const banner=document.querySelector('.course-story-banner')||document.querySelector('.course-top');if(banner)strip(banner,'afterend')}
function calendar(){if(!/\/calendar\.html$/i.test(location.pathname))return;const head=document.querySelector('.head');if(!head)return;const actions=head.querySelector('.actions');if(actions&&!actions.querySelector('[data-live-zoom]')){const a=document.createElement('a');a.className='btn primary';a.dataset.liveZoom='1';a.href=ZOOM;a.target='_blank';a.rel='noopener noreferrer';a.textContent='🎥 Entrar a Zoom';actions.prepend(a)}const m=head.querySelector('.muted');if(m&&!/grupo\s*39/i.test(m.textContent))m.textContent+=' · Grupo 39'}
function presentation(){if(!/\/Presentaciones\//i.test(location.pathname))return;const panel=document.querySelector('#andes-resource-dock .rd-panel');if(!panel||panel.querySelector('[data-live-zoom]'))return;const group=panel.querySelector('.rd-group');if(!group)return;const a=document.createElement('a');a.className='rd-link live';a.dataset.liveZoom='1';a.href=ZOOM;a.target='_blank';a.rel='noopener noreferrer';a.innerHTML='<span>🎥</span><span><strong>Zoom · Grupo 39</strong><small>Conexión a la clase sincrónica</small></span>';group.prepend(a)}
function run(){css();portal();course();calendar();presentation()}
let timer=null;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(run,40)});function boot(){run();obs.observe(document.body||document.documentElement,{childList:true,subtree:true});setTimeout(run,300);setTimeout(run,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();