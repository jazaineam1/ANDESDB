(()=>{
'use strict';
if(window.__ANDES_RESOURCE_DOCK_A11Y__)return;window.__ANDES_RESOURCE_DOCK_A11Y__=true;
let timer=null,tries=0,resizeBound=false;
function suppressDuplicatePractice(){
  document.getElementById('andes-practice-btn')?.remove();
  document.getElementById('andes-practice-overlay')?.remove();
}
suppressDuplicatePractice();
const duplicateObserver=new MutationObserver(suppressDuplicatePractice);
duplicateObserver.observe(document.documentElement,{childList:true,subtree:true});
function installMobileCollisionGuard(dock){
  if(document.getElementById('andes-resource-mobile-css')===null){
    const style=document.createElement('style');
    style.id='andes-resource-mobile-css';
    style.textContent=`
/* El laboratorio ya está dentro de Recursos: nunca mostramos un segundo botón flotante. */
#andes-practice-btn,#andes-practice-overlay{display:none!important}
@media(max-width:760px){
  #andes-resource-dock{right:10px!important;bottom:calc(var(--andes-dock-clearance,92px) + env(safe-area-inset-bottom))!important}
  #andes-resource-dock .rd-panel{left:10px!important;right:10px!important;bottom:calc(var(--andes-dock-clearance,92px) + 54px + env(safe-area-inset-bottom))!important;width:auto!important;max-height:min(58vh,520px)!important}
}
@media(max-width:420px){
  #andes-resource-dock .rd-open{padding:10px 12px!important;font-size:11px!important}
}
`;
    document.head.appendChild(style);
  }
  const position=()=>{
    suppressDuplicatePractice();
    if(!dock?.isConnected)return;
    if(!matchMedia('(max-width:760px)').matches){dock.style.removeProperty('--andes-dock-clearance');return}
    const vh=window.visualViewport?.height||window.innerHeight;
    let clearance=78;
    const controls=[...document.querySelectorAll('.ctlbar')].filter(el=>{
      const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return false;
      const r=el.getBoundingClientRect();return r.height>0&&r.bottom>vh-180&&r.top<vh;
    });
    for(const el of controls){const r=el.getBoundingClientRect();clearance=Math.max(clearance,Math.ceil(vh-r.top+12))}
    dock.style.setProperty('--andes-dock-clearance',`${clearance}px`);
  };
  position();
  if(!resizeBound){
    resizeBound=true;
    addEventListener('resize',position,{passive:true});
    addEventListener('orientationchange',()=>setTimeout(position,120),{passive:true});
    window.visualViewport?.addEventListener('resize',position,{passive:true});
  }
  const ro='ResizeObserver'in window?new ResizeObserver(position):null;
  document.querySelectorAll('.ctlbar').forEach(el=>ro?.observe(el));
  setTimeout(position,120);setTimeout(position,450);setTimeout(position,1200);
}
function install(){
  suppressDuplicatePractice();
  const dock=document.getElementById('andes-resource-dock');if(!dock)return false;
  const toggle=dock.querySelector('.rd-open'),panel=dock.querySelector('.rd-panel');if(!toggle||!panel)return false;
  installMobileCollisionGuard(dock);
  if(dock.dataset.a11yReady)return true;dock.dataset.a11yReady='1';
  panel.id='andes-resource-panel';panel.setAttribute('aria-modal','true');panel.setAttribute('aria-hidden',dock.classList.contains('open')?'false':'true');
  toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-haspopup','dialog');
  const focusables=()=>[...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);
  function close({focus=true}={}){dock.classList.remove('open');toggle.setAttribute('aria-expanded','false');panel.setAttribute('aria-hidden','true');if(focus)toggle.focus({preventScroll:true})}
  toggle.addEventListener('click',()=>setTimeout(()=>{const open=dock.classList.contains('open');panel.setAttribute('aria-hidden',open?'false':'true');if(open){const xs=focusables();(xs[0]||panel).focus?.({preventScroll:true})}},0));
  dock.addEventListener('keydown',e=>{
    if(!dock.classList.contains('open'))return;
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return}
    if(e.key!=='Tab')return;
    const xs=focusables();if(!xs.length){e.preventDefault();toggle.focus();return}
    const first=xs[0],last=xs.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });
  panel.setAttribute('tabindex','-1');
  return true;
}
timer=setInterval(()=>{if(install()||++tries>60)clearInterval(timer)},100);
addEventListener('pagehide',()=>{clearInterval(timer);duplicateObserver.disconnect()},{once:true});
})();