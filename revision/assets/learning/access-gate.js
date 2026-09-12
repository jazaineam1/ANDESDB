(() => {
  'use strict';
  if (window.self !== window.top || document.getElementById('andes-access-gate')) return;
  if (/\/portal\.html$/i.test(location.pathname)) return;
  const script=document.currentScript||[...document.scripts].find(s=>/access-gate\.js(?:\?|$)/.test(s.src));
  if(!script)return;
  const ROOT=new URL('../../',script.src);
  const API='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-auth';
  const STORE='andesdb.lms.auth.v1',COOKIE='andesdb_lms_session',COOKIE_PATH=ROOT.pathname,COOKIE_AGE=34560000;
  const next=location.pathname+location.search+location.hash;
  const readCookie=()=>{const p=document.cookie.split('; ').find(x=>x.startsWith(COOKIE+'='));return p?decodeURIComponent(p.slice(COOKIE.length+1)):''};
  const setCookie=t=>{if(t)document.cookie=`${COOKIE}=${encodeURIComponent(t)}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_AGE}; Secure; SameSite=Lax`};
  const clearCookie=()=>{document.cookie=`${COOKIE}=; Path=${COOKIE_PATH}; Max-Age=0; Secure; SameSite=Lax`};
  const readLocal=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}};
  const writeLocal=x=>{try{x?localStorage.setItem(STORE,JSON.stringify(x)):localStorage.removeItem(STORE)}catch{}};

  document.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download'))return;
    let u;try{u=new URL(a.href,location.href)}catch{return}
    const internal=u.origin===location.origin&&u.pathname.startsWith(ROOT.pathname);if(!internal)return;
    if(u.pathname===location.pathname&&u.search===location.search&&u.hash&&u.hash!==location.hash)return;
    e.preventDefault();location.assign(u.href);
  },true);

  const st=document.createElement('style');st.textContent=`#andes-access-gate{position:fixed;inset:0;z-index:2147483646;background:#101828f5;color:#fff;display:grid;place-items:center;padding:18px;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}#andes-access-gate .ag-card{width:min(500px,94vw);background:#fff;color:#17202a;border-radius:18px;padding:24px;box-shadow:0 30px 100px #0008}#andes-access-gate h1{margin:.25rem 0 .55rem;font-size:1.65rem}#andes-access-gate p{color:#667085;line-height:1.5}.ag-ey{font-size:.72rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#8a7300}.ag-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.ag-btn{border:0;border-radius:10px;padding:10px 13px;background:#175cd3;color:#fff;text-decoration:none;font-weight:850;cursor:pointer}.ag-btn.alt{background:#eef2f6;color:#17202a}.ag-note{margin-top:14px;border-left:4px solid #f79009;background:#fffaeb;border-radius:8px;padding:9px;font-size:.8rem;color:#7a2e0e}#andes-account-pill{position:fixed;right:10px;bottom:10px;z-index:2147483500;background:#101828f2;color:#fff;border:1px solid #ffffff25;border-radius:12px;padding:6px;display:flex;gap:4px;align-items:center;box-shadow:0 8px 24px #0003;font:800 11px/1 system-ui}#andes-account-pill a,#andes-account-pill button{border:0;background:#ffffff10;color:#fff;border-radius:8px;padding:7px 8px;text-decoration:none;font:800 11px/1 system-ui;cursor:pointer}#andes-account-pill span{padding:0 6px;color:#d0d5dd}@media(max-width:760px){#andes-account-pill{left:8px;right:8px;bottom:8px;justify-content:space-around}#andes-account-pill span{display:none}#andes-account-pill a,#andes-account-pill button{flex:1;text-align:center}}`;document.head.appendChild(st);
  const gate=document.createElement('div');gate.id='andes-access-gate';gate.innerHTML='<div class="ag-card"><div class="ag-ey">ANDESDB · acceso</div><h1>Verificando tu sesión…</h1><p>Estamos comprobando tu acceso antes de abrir esta actividad.</p></div>';document.body.appendChild(gate);

  function locked(){gate.innerHTML=`<div class="ag-card"><div class="ag-ey">ANDESDB · acceso requerido</div><h1>Inicia sesión para continuar</h1><p>Usa el mismo usuario y contraseña del Portal. Después volverás a esta página.</p><div class="ag-actions"><a class="ag-btn" href="${new URL('portal.html?next='+encodeURIComponent(next),ROOT).href}">Ir al Portal</a><a class="ag-btn alt" href="${new URL('portal.html',ROOT).href}">Mis cursos</a></div><div class="ag-note"><b>Si olvidaste tu contraseña:</b> pide al docente un restablecimiento. No necesitas solicitar una cuenta nueva.</div></div>`;}
  function unlocked(api,user){const local=readLocal();if(local?.token)setCookie(local.token);gate.remove();if(document.getElementById('andes-account-pill'))return;const p=document.createElement('div');p.id='andes-account-pill';p.innerHTML=`<span>${String(user.display_name||user.username||'Cuenta').split(' ')[0]}</span><a href="${new URL('portal.html',ROOT).href}">Inicio</a><a href="${new URL('learning-hub.html',ROOT).href}">Curso</a><a href="${new URL('learning-hub.html#sesiones',ROOT).href}">Sesiones</a><button type="button">Salir</button>`;document.body.appendChild(p);p.querySelector('button').onclick=async()=>{try{await api.logout()}catch{}writeLocal(null);clearCookie();location.replace(new URL('portal.html',ROOT).href)};}
  async function recoverFromCookie(){const token=readCookie();if(!token)return null;try{const c=new AbortController(),timer=setTimeout(()=>c.abort(),4500);const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:'me'}),signal:c.signal});clearTimeout(timer);const x=await r.json().catch(()=>({}));if(!r.ok||!x.user)throw new Error(x.error||'Sesión no válida');const auth={token,expires_at:x.expires_at,auth_session_id:x.auth_session_id,user:x.user};writeLocal(auth);setCookie(token);return x.user}catch{clearCookie();return null}}
  async function check(){const api=window.ANDES_LMS;if(!api)return setTimeout(check,80);try{const user=await api.ready();if(user){unlocked(api,user);return}const recovered=await recoverFromCookie();if(recovered){location.reload();return}locked()}catch{const recovered=await recoverFromCookie();recovered?location.reload():locked()}}
  check();
  addEventListener('storage',e=>{if(e.key===STORE&&e.newValue&&document.getElementById('andes-access-gate'))location.reload()});
  addEventListener('pageshow',e=>{if(e.persisted&&document.getElementById('andes-access-gate')){try{if(localStorage.getItem(STORE)||readCookie())location.reload()}catch{}}});
})();