(()=>{
'use strict';
if(window.__ANDES_RESOURCE_DOCK_A11Y__)return;window.__ANDES_RESOURCE_DOCK_A11Y__=true;
let timer=null,tries=0;
function install(){
  const dock=document.getElementById('andes-resource-dock');if(!dock)return false;
  const toggle=dock.querySelector('.rd-open'),panel=dock.querySelector('.rd-panel');if(!toggle||!panel)return false;
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
addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();