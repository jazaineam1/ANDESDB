(() => {
  'use strict';
  if (window.self !== window.top || document.getElementById('andes-access-gate')) return;
  if (/\/portal\.html$/i.test(location.pathname)) return;
  const script=document.currentScript||[...document.scripts].find(s=>/access-gate\.js(?:\?|$)/.test(s.src));
  if(!script)return;
  const ROOT=new URL('../../',script.src);
  const STORE='andesdb.lms.auth.v1';
  const next=location.pathname+location.search+location.hash;

  // Navegación interna del LMS siempre en la MISMA pestaña.
  // Esto es importante en móviles: Gmail/Custom Tabs y Chrome pueden usar
  // contenedores de almacenamiento distintos al abrir target=_blank.
  document.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest?.('a[href]');
    if(!a||a.hasAttribute('download'))return;
    let u;try{u=new URL(a.href,location.href)}catch{return}
    const internal=u.origin===location.origin&&u.pathname.startsWith(ROOT.pathname);
    if(!internal)return;
    // Los saltos dentro de la misma página se dejan al navegador.
    if(u.pathname===location.pathname&&u.search===location.search&&u.hash&&u.hash!==location.hash)return;
    e.preventDefault();
    location.assign(u.href);
  },true);

  const st=document.createElement('style');st.textContent=`#andes-access-gate{position:fixed;inset:0;z-index:2147483646;background:#0f172af7;color:#fff;display:grid;place-items:center;padding:18px;font-family:system-ui,-apple-system,Segoe UI,sans-serif}#andes-access-gate .ag-card{width:min(520px,94vw);background:#fff;color:#111827;border-radius:20px;padding:22px;box-shadow:0 30px 100px #0008}#andes-access-gate h1{margin:.2rem 0 .55rem;font-size:1.65rem}#andes-access-gate p{color:#64748b;line-height:1.5}.ag-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.ag-btn{border:0;border-radius:10px;padding:10px 13px;background:#111827;color:#fff;text-decoration:none;font-weight:850;cursor:pointer}.ag-btn.alt{background:#e8edf2;color:#111827}.ag-note{margin-top:14px;border-left:4px solid #eab308;background:#fff8da;border-radius:8px;padding:9px;font-size:.8rem;color:#6b4f00}#andes-account-pill{position:fixed;right:10px;bottom:10px;z-index:2147483500;background:#111827ee;color:#fff;border:1px solid #ffffff55;border-radius:999px;padding:8px 10px;font:800 11px/1 system-ui;display:flex;gap:8px;align-items:center;box-shadow:0 7px 24px #0004}#andes-account-pill button{border:0;background:#ffffff18;color:#fff;border-radius:999px;padding:5px 8px;font-weight:850;cursor:pointer}@media(max-width:760px){#andes-account-pill{bottom:104px;right:8px}}`;document.head.appendChild(st);
  const gate=document.createElement('div');gate.id='andes-access-gate';gate.innerHTML='<div class="ag-card"><div style="font-size:.75rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#8a7300">ANDESDB · acceso</div><h1>Verificando tu sesión…</h1><p>Estamos comprobando tu acceso sin sacarte de esta página.</p></div>';document.body.appendChild(gate);

  function locked(){gate.innerHTML=`<div class="ag-card"><div style="font-size:.75rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#8a7300">ANDESDB · acceso requerido</div><h1>Primero entra a la plataforma</h1><p>Tu curso, laboratorios, lecturas y avance se organizan desde el portal.</p><div class="ag-actions"><a class="ag-btn" href="${new URL('portal.html?next='+encodeURIComponent(next),ROOT).href}">Ir al portal</a><a class="ag-btn alt" href="${new URL('portal.html#solicitar',ROOT).href}">Solicitar acceso</a></div><div class="ag-note"><b>Si ya habías ingresado:</b> no solicites otra cuenta. Vuelve al Portal desde esta misma pestaña y continúa tu curso.</div></div>`;}
  function unlocked(api,user){gate.remove();if(document.getElementById('andes-account-pill'))return;const p=document.createElement('div');p.id='andes-account-pill';p.innerHTML=`<span>👤 ${String(user.display_name||user.username||'Cuenta').split(' ')[0]}</span><button type="button">Salir</button>`;document.body.appendChild(p);p.querySelector('button').onclick=async()=>{try{await api.logout()}catch{}location.replace(new URL('portal.html',ROOT).href)};}
  async function check(){const api=window.ANDES_LMS;if(!api)return setTimeout(check,100);try{const user=await api.ready();user?unlocked(api,user):locked()}catch{locked()}}
  check();

  // Si la sesión cambia en otra pestaña del mismo navegador, refresca el gate.
  addEventListener('storage',e=>{if(e.key===STORE&&e.newValue&&document.getElementById('andes-access-gate'))location.reload()});
  addEventListener('pageshow',e=>{if(e.persisted&&document.getElementById('andes-access-gate')){try{if(localStorage.getItem(STORE))location.reload()}catch{}}});
})();
