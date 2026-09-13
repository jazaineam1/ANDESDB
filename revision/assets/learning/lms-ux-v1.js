(()=>{
'use strict';
if(window.__ANDES_LMS_UX_V1__)return;window.__ANDES_LMS_UX_V1__=true;
const $=s=>document.querySelector(s);
const css=document.createElement('style');css.id='andes-lms-ux-v1';css.textContent=`
/* Panel de aprendizaje: lateral, compacto y con salida siempre visible */
.al-panel{width:min(390px,100vw)!important}.al-body{padding-bottom:76px!important}.al-head{padding:11px 13px!important}.al-card{padding:11px!important;border-radius:13px!important}.al-sticky-foot{position:sticky;bottom:0;z-index:8;display:flex;gap:7px;align-items:center;padding:9px 10px;background:rgba(255,255,255,.97);border-top:1px solid #dfe5ec;box-shadow:0 -8px 20px #0f172a14}.al-sticky-foot a,.al-sticky-foot button{flex:1;border:0;border-radius:9px;padding:9px 8px;font:800 12px/1 system-ui;text-align:center;text-decoration:none;cursor:pointer}.al-sticky-foot a{background:#eef2f6;color:#17202a}.al-sticky-foot button{background:#101828;color:#fff}
@media(min-width:900px){
 body.andes-lab-shell{padding-left:188px!important}.andes-lab-shell .appbar{display:none!important}.andes-lab-shell .top{position:relative!important;top:0!important;padding:11px 0 10px!important;box-shadow:none!important}.andes-lab-shell .top .wrap,.andes-lab-shell main .wrap{width:min(1160px,96%)!important}.andes-lab-shell .topline{align-items:center!important}.andes-lab-shell .top h1{font-size:clamp(1.28rem,2.4vw,1.72rem)!important;margin:.12rem 0!important}.andes-lab-shell .top p{font-size:.76rem!important}.andes-lab-shell .top-actions{display:none!important}.andes-lab-shell .progress{padding:7px 9px!important;margin-top:7px!important}.andes-lab-shell .context{padding:9px 11px!important;margin-bottom:8px!important}.andes-lab-shell .context p{margin:.15rem 0!important}.andes-lab-shell main{padding-top:10px!important}#andes-learning-btn{left:auto!important;right:14px!important}
 #andes-lab-side{position:fixed;inset:0 auto 0 0;width:188px;background:#101828;color:#fff;z-index:2147481200;display:flex;flex-direction:column;padding:16px 11px 12px;box-shadow:8px 0 28px #0f172a18}#andes-lab-side .ls-brand{display:flex;align-items:center;gap:8px;color:#fff;text-decoration:none;font-weight:950;margin:0 5px 17px}.ls-mark{width:30px;height:30px;border-radius:9px;background:#ffd600;color:#3d3300;display:grid;place-items:center}.ls-user{margin:0 5px 13px;padding:9px;border:1px solid #ffffff1f;border-radius:10px;background:#ffffff08}.ls-user b,.ls-user small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ls-user small{color:#aebbc9;font-size:10px;margin-top:2px}.ls-nav{display:grid;gap:4px}.ls-nav a,.ls-nav button{display:flex;align-items:center;gap:8px;width:100%;border:0;border-radius:9px;padding:9px 10px;background:transparent;color:#d8e1ea;text-decoration:none;text-align:left;font:800 12px/1.2 system-ui;cursor:pointer}.ls-nav a:hover,.ls-nav button:hover,.ls-nav a.active{background:#ffffff12;color:#fff}.ls-spacer{flex:1}.ls-logout{background:#ffffff10!important;border:1px solid #ffffff22!important;color:#fff!important}.ls-version{color:#718096;font-size:9px;margin:8px 6px 0}
}
@media(max-width:899px){#andes-lab-side{display:none!important}.al-panel{width:100vw!important}}
`;document.head.appendChild(css);

function ensurePanelFooter(){
 const panel=$('#andes-learning-overlay .al-panel');if(!panel||panel.querySelector('.al-sticky-foot'))return;
 const foot=document.createElement('div');foot.className='al-sticky-foot';foot.innerHTML='<a href="portal.html">Inicio</a><a href="learning-hub.html">Curso</a><button type="button">Cerrar sesión</button>';
 foot.querySelector('button').onclick=async()=>{const b=foot.querySelector('button');b.disabled=true;b.textContent='Saliendo…';try{await window.ANDES_LMS?.logout?.()}finally{location.replace('portal.html')}};
 panel.appendChild(foot);
}
function watchPanel(){ensurePanelFooter();const host=$('#andes-learning-overlay');if(!host)return;new MutationObserver(ensurePanelFooter).observe(host,{childList:true,subtree:true})}

async function installLabSide(){
 if(!/\/lab\.html$/i.test(location.pathname)||document.getElementById('andes-lab-side'))return;
 document.body.classList.add('andes-lab-shell');
 let user=null;try{user=await window.ANDES_LMS?.ready?.()}catch(_){ }
 const pres=$('#back-pres')?.href||'learning-hub.html';
 const aside=document.createElement('aside');aside.id='andes-lab-side';aside.setAttribute('aria-label','Navegación del curso');aside.innerHTML=`<a class="ls-brand" href="portal.html"><span class="ls-mark">A</span><span>ANDESDB</span></a><div class="ls-user"><b>${(user?.display_name||user?.username||'Mi curso').replace(/[<>&]/g,'')}</b><small>${user?.role==='teacher'||user?.role==='admin'?'Docente':'Estudiante'}</small></div><nav class="ls-nav"><a href="portal.html">⌂ Inicio</a><a href="learning-hub.html">▤ Curso</a><a href="calendar.html">◷ Agenda</a><a href="${pres}">▣ Presentación</a><button type="button" id="ls-progress">✓ Mi aprendizaje</button>${['teacher','admin'].includes(user?.role)?'<a href="teacher-dashboard.html">⚙ Control docente</a>':''}</nav><div class="ls-spacer"></div><nav class="ls-nav"><button class="ls-logout" type="button" id="ls-logout">↪ Cerrar sesión</button></nav><div class="ls-version">Sesión activa · ANDESDB</div>`;
 document.body.appendChild(aside);
 aside.querySelector('#ls-progress').onclick=()=>window.ANDES_LMS?.open?.();
 aside.querySelector('#ls-logout').onclick=async()=>{const b=aside.querySelector('#ls-logout');b.disabled=true;b.textContent='Saliendo…';try{await window.ANDES_LMS?.logout?.()}finally{location.replace('portal.html')}};
}
function boot(){watchPanel();installLabSide();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
setTimeout(watchPanel,900);
})();