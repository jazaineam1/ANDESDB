(()=>{
'use strict';
if(window.__ANDES_THEME_V1__)return;window.__ANDES_THEME_V1__=true;
if(/\/Presentaciones\//i.test(location.pathname))return;
const KEY='andesdb.ui.theme.v1';
const root=document.documentElement;
const media=window.matchMedia?.('(prefers-color-scheme: dark)');
const stored=(()=>{try{const v=localStorage.getItem(KEY);return v==='dark'||v==='light'?v:null}catch{return null}})();
let mode=stored||(media?.matches?'dark':'light');
const css=`
html[data-andes-theme="light"]{color-scheme:light}
html[data-andes-theme="dark"]{color-scheme:dark;--ink:#f2f4f7!important;--muted:#98a2b3!important;--line:#344054!important;--bg:#0b1220!important;--paper:#111827!important;--nav:#060b14!important;--blue:#84adff!important;--green:#47cd89!important;--purple:#b692f6!important;--blue-soft:#13213a!important;--purple-soft:#211b35!important;--green-soft:#102a20!important;--yellow-soft:#332b08!important;--shadow:0 8px 28px rgba(0,0,0,.26)!important}
html[data-andes-theme="dark"] body{background:var(--bg)!important;color:var(--ink)!important}
html[data-andes-theme="dark"] .card,
html[data-andes-theme="dark"] .article,
html[data-andes-theme="dark"] .source,
html[data-andes-theme="dark"] .class-topic,
html[data-andes-theme="dark"] .bridge-item,
html[data-andes-theme="dark"] .def,
html[data-andes-theme="dark"] .metric,
html[data-andes-theme="dark"] .login-grid,
html[data-andes-theme="dark"] .mobile-nav,
html[data-andes-theme="dark"] .order-row,
html[data-andes-theme="dark"] .task,
html[data-andes-theme="dark"] .resultbox{background:#111827!important;color:#f2f4f7!important;border-color:#344054!important}
html[data-andes-theme="dark"] .context{background:#2b2508!important}
html[data-andes-theme="dark"] .class-recap{background:#0f1f35!important}
html[data-andes-theme="dark"] .check,
html[data-andes-theme="dark"] .example{background:#102a20!important}
html[data-andes-theme="dark"] .orientation,
html[data-andes-theme="dark"] .beyond,
html[data-andes-theme="dark"] .contract{background:#211b35!important;color:#e9d7fe!important}
html[data-andes-theme="dark"] .keybox{background:#13213a!important}
html[data-andes-theme="dark"] .apply,
html[data-andes-theme="dark"] .route a,
html[data-andes-theme="dark"] .role-tabs,
html[data-andes-theme="dark"] .btn.alt{background:#1f2937!important;color:#f2f4f7!important;border-color:#344054!important}
html[data-andes-theme="dark"] .role-tab.active{background:#344054!important;color:#fff!important}
html[data-andes-theme="dark"] .muted,
html[data-andes-theme="dark"] .lead,
html[data-andes-theme="dark"] .card p,
html[data-andes-theme="dark"] .class-topic p,
html[data-andes-theme="dark"] .def span,
html[data-andes-theme="dark"] .bridge-item span,
html[data-andes-theme="dark"] .source span,
html[data-andes-theme="dark"] .route small,
html[data-andes-theme="dark"] .crumb,
html[data-andes-theme="dark"] .crumb a{color:#98a2b3!important}
html[data-andes-theme="dark"] input,
html[data-andes-theme="dark"] select,
html[data-andes-theme="dark"] textarea,
html[data-andes-theme="dark"] .input,
html[data-andes-theme="dark"] .sql-editor,
html[data-andes-theme="dark"] .text-answer{background:#0f172a!important;color:#f8fafc!important;border-color:#475467!important}
html[data-andes-theme="dark"] table{color:#f2f4f7!important}
html[data-andes-theme="dark"] th{background:#1f2937!important;color:#f2f4f7!important}
html[data-andes-theme="dark"] td{border-color:#344054!important}
html[data-andes-theme="dark"] .notice{background:#10213a!important;color:#b2ccff!important}
html[data-andes-theme="dark"] .pill{background:#263244!important;color:#d0d5dd!important}
.andes-theme-toggle{border:1px solid #ffffff2d;background:#ffffff10;color:#fff;border-radius:999px;padding:7px 10px;font:850 .76rem/1 system-ui;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.andes-theme-toggle:hover{background:#ffffff1c}.andes-theme-toggle:focus-visible{outline:3px solid #84adff;outline-offset:2px}
@media(max-width:680px){.andes-theme-toggle .andes-theme-label{display:none}.andes-theme-toggle{padding:8px;width:34px;height:34px;justify-content:center}}
`;
function injectStyle(){if(document.getElementById('andes-theme-style'))return;const s=document.createElement('style');s.id='andes-theme-style';s.textContent=css;document.head.appendChild(s)}
function updateMeta(next){let m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=next==='dark'?'#060b14':'#101828'}
function apply(next,{persist=false}={}){mode=next==='dark'?'dark':'light';root.dataset.andesTheme=mode;root.style.colorScheme=mode;updateMeta(mode);if(persist){try{localStorage.setItem(KEY,mode)}catch{}}renderButton();window.dispatchEvent(new CustomEvent('andesdb:theme-changed',{detail:{theme:mode}}))}
function renderButton(){const b=document.getElementById('andes-theme-toggle');if(!b)return;const dark=mode==='dark';b.innerHTML=`<span aria-hidden="true">${dark?'☀️':'🌙'}</span><span class="andes-theme-label">${dark?'Claro':'Oscuro'}</span>`;b.setAttribute('aria-label',dark?'Cambiar a tema claro':'Cambiar a tema oscuro');b.title=dark?'Cambiar a tema claro':'Cambiar a tema oscuro'}
function mount(){if(document.getElementById('andes-theme-toggle'))return;const host=document.querySelector('.appbar .inner,.appbar .wrap,.topbar .inner,header .inner');if(!host)return;const b=document.createElement('button');b.type='button';b.id='andes-theme-toggle';b.className='andes-theme-toggle';b.addEventListener('click',()=>apply(mode==='dark'?'light':'dark',{persist:true}));const spacer=host.querySelector('.spacer');if(spacer)spacer.after(b);else host.appendChild(b);renderButton()}
injectStyle();apply(mode);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
new MutationObserver(()=>{if(!document.getElementById('andes-theme-toggle'))mount()}).observe(document.documentElement,{childList:true,subtree:true});
media?.addEventListener?.('change',e=>{let saved=null;try{saved=localStorage.getItem(KEY)}catch{}if(saved!=='dark'&&saved!=='light')apply(e.matches?'dark':'light')});
window.ANDES_THEME={get theme(){return mode},set:next=>apply(next,{persist:true})};
})();
