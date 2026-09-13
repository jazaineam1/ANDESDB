(()=>{
'use strict';
if(window.__ANDES_READING_NAV_V1__)return;window.__ANDES_READING_NAV_V1__=true;
if(!/\/reading\.html$/i.test(location.pathname))return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=Math.max(1,Math.min(16,Number(new URLSearchParams(location.search).get('session'))||1));
const css=`
.reading-pager{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:stretch;margin:12px 0 4px}
.reading-pager a,.reading-pager .reading-current,.footer-nav a,.footer-nav .reading-current{border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:14px;text-decoration:none;box-shadow:var(--shadow);min-width:0}
.reading-pager a,.footer-nav a{display:flex;align-items:center;gap:10px;padding:11px 13px;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
.reading-pager a:hover,.footer-nav a:hover{transform:translateY(-1px);border-color:#84adff;box-shadow:0 10px 26px rgba(16,24,40,.11)}
.reading-pager a:focus-visible,.footer-nav a:focus-visible{outline:3px solid #84adff;outline-offset:2px}
.reading-pager a.next,.footer-nav a.next{justify-content:flex-end;text-align:right}
.reading-pager .reading-current,.footer-nav .reading-current{display:grid;place-items:center;padding:8px 13px;min-width:112px;background:linear-gradient(135deg,var(--nav),#1d3557);color:#fff;border-color:transparent}
.reading-current b{display:block;font-size:.8rem;line-height:1.1}.reading-current span{display:block;font-size:.64rem;color:#d0d5dd;margin-top:3px}
.reading-arrow{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#eef4ff;color:#1849a9;font-size:1.05rem;font-weight:950;flex:0 0 auto}
.reading-nav-copy{min-width:0}.reading-nav-copy small{display:block;color:var(--muted);font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.reading-nav-copy b{display:block;font-size:.8rem;line-height:1.25;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.footer-nav{display:grid!important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important;gap:10px!important;align-items:stretch;margin-top:20px!important}.footer-nav a{flex:none!important}.footer-nav a:last-child{text-align:right!important}
.reading-jump{appearance:none;border:0;background:transparent;color:#fff;font:850 .78rem/1.2 system-ui;text-align:center;cursor:pointer;max-width:150px}.reading-jump option{color:#17202a;background:#fff}
html[data-andes-theme="dark"] .reading-arrow{background:#1f3354!important;color:#b2ccff!important}html[data-andes-theme="dark"] .reading-jump option{color:#f2f4f7;background:#111827}
@media(max-width:680px){.reading-pager{grid-template-columns:1fr auto 1fr;gap:7px}.reading-pager a{padding:9px}.reading-pager .reading-current{min-width:74px;padding:7px}.reading-pager .reading-nav-copy b{display:none}.reading-pager .reading-nav-copy small{font-size:.61rem}.reading-arrow{width:30px;height:30px}.footer-nav{grid-template-columns:1fr 1fr!important}.footer-nav .reading-current{grid-column:1/-1;grid-row:1;min-height:48px}.footer-nav a{min-height:58px;padding:9px}.footer-nav .reading-nav-copy b{font-size:.73rem}.reading-jump{max-width:96px;font-size:.72rem}}
`;
function injectStyle(){if(document.getElementById('reading-nav-style'))return;const s=document.createElement('style');s.id='reading-nav-style';s.textContent=css;document.head.appendChild(s)}
function sessionTitle(i){return window.ANDES_COURSE?.session?.(i)?.titulo||`Sesión ${i}`}
function link(i,dir,compact=false){if(i<1||i>16)return '<span></span>';const prev=dir==='prev',label=prev?'Anterior':'Siguiente',arrow=prev?'←':'→',copy=`<span class="reading-nav-copy"><small>${label}</small><b>S${i} · ${esc(sessionTitle(i))}</b></span>`;return `<a class="${prev?'prev':'next'}" href="reading.html?session=${i}" aria-label="${label}: sesión ${i}, ${esc(sessionTitle(i))}">${prev?`<span class="reading-arrow">${arrow}</span>${copy}`:`${copy}<span class="reading-arrow">${arrow}</span>`}</a>`}
function current(){const opts=Array.from({length:16},(_,k)=>k+1).map(i=>`<option value="${i}" ${i===n?'selected':''}>S${i}</option>`).join('');return `<div class="reading-current"><b><select class="reading-jump" aria-label="Ir a otra lectura">${opts}</select></b><span>${n} de 16</span></div>`}
function bindJump(scope){scope.querySelectorAll('.reading-jump').forEach(sel=>sel.addEventListener('change',()=>{location.href=`reading.html?session=${sel.value}`}))}
function mountTop(){if(document.querySelector('.reading-pager'))return;const hero=document.querySelector('.hero');if(!hero)return;const nav=document.createElement('nav');nav.className='reading-pager';nav.setAttribute('aria-label','Navegación entre lecturas');nav.innerHTML=`${link(n-1,'prev',true)}${current()}${link(n+1,'next',true)}`;hero.insertAdjacentElement('afterend',nav);bindJump(nav)}
function upgradeFooter(){const nav=document.querySelector('.footer-nav');if(!nav||nav.dataset.upgraded==='1')return;nav.dataset.upgraded='1';nav.setAttribute('aria-label','Navegación entre lecturas');nav.innerHTML=`${link(n-1,'prev')}${current()}${link(n+1,'next')}`;bindJump(nav)}
function mount(){injectStyle();mountTop();upgradeFooter()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
})();
