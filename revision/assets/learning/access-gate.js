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
  const parseStore=s=>{try{return JSON.parse(s||'null')}catch{return null}};
  const readLocal=()=>parseStore(localStorage.getItem(STORE))||parseStore(sessionStorage.getItem(STORE));
  const writeLocal=x=>{try{if(x){const s=JSON.stringify(x);localStorage.setItem(STORE,s);sessionStorage.setItem(STORE,s)}else{localStorage.removeItem(STORE);sessionStorage.removeItem(STORE)}}catch{}};

  document.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download'))return;
    let u;try{u=new URL(a.href,location.href)}catch{return}
    const internal=u.origin===location.origin&&u.pathname.startsWith(ROOT.pathname);if(!internal)return;
    if(u.pathname===location.pathname&&u.search===location.search&&u.hash&&u.hash!==location.hash)return;
    e.preventDefault();location.assign(u.href);
  },true);

  const st=document.createElement('style');st.textContent=`#andes-access-gate{position:fixed;inset:0;z-index:2147483646;background:#0f172af7;color:#fff;display:grid;place-items:center;padding:18px;font-family:system-ui,-apple-system,Segoe UI,sans-serif}#andes-access-gate .ag-card{width:min(520px,94vw);background:#fff;color:#111827;border-radius:20px;padding:22px;box-shadow:0 30px 100px #0008}#andes-access-gate h1{margin:.2rem 0 .55rem;font-size:1.65rem}#andes-access-gate p{color:#64748b;line-height:1.5}.ag-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.ag-btn{border:0;border-radius:10px;padding:10px 13px;background:#111827;color:#fff;text-decoration:none;font-weight:850;cursor:pointer}.ag-btn.alt{background:#e8edf2;color:#111827}.ag-note{margin-top:14px;border-left:4px solid #eab308;background:#fff8da;border-radius:8px;padding:9px;font-size:.8rem;color:#6b4f00}#andes-account-pill{position:fixed;right:10px;bottom:10px;z-index:2147483500;background:#111827ee;color:#fff;border:1px solid #ffffff55;border-radius:999px;padding:8px 10px;font:800 11px/1 system-ui;display:flex;gap:8px;align-items:center;box-shadow:0 7px 24px #0004}#andes-account-pill button{border:0;background:#ffffff18;color:#fff;border-radius:999px;padding:5px 8px;font-weight:850;cursor:pointer}@media(max-width:760px){#andes-account-pill{bottom:104px;right:8px}}`;document.head.appendChild(st);
  const gate=document.createElement('div');gate.id='andes-access-gate';gate.innerHTML='<div class="ag-card"><div style="font-size:.75rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#8a7300">ANDESDB · acceso</div><h1>Verificando tu sesión…</h1><p>Estamos recuperando tu acceso si cambiaste de pantalla o pestaña.</p></div>';document.body.appendChild(gate);

  function locked(){gate.innerHTML=`<div class="ag-card"><div style="font-size:.75rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#8a7300">ANDESDB · acceso requerido</div><h1>Primero entra a la plataforma</h1><p>No encontramos una sesión válida en este navegador.</p><div class="ag-actions"><a class="ag-btn" href="${new URL('portal.html?next='+encodeURIComponent(next),ROOT).href}">Ir al portal</a><a class="ag-btn alt" href="${new URL('portal.html#solicitar',ROOT).href}">Solicitar acceso</a></div><div class="ag-note"><b>Si ya estabas matriculado:</b> no crees otra cuenta. Abre tu enlace de acceso nuevamente o pide al docente “Generar nuevo acceso”.</div></div>`;}
  function unlocked(api,user){const local=readLocal();if(local?.token){writeLocal(local);setCookie(local.token)}gate.remove();if(document.getElementById('andes-account-pill'))return;const p=document.createElement('div');p.id='andes-account-pill';p.innerHTML=`<span>👤 ${String(user.display_name||user.username||'Cuenta').split(' ')[0]}</span><button type="button">Salir</button>`;document.body.appendChild(p);p.querySelector('button').onclick=async()=>{try{await api.logout()}catch{}writeLocal(null);clearCookie();location.replace(new URL('portal.html',ROOT).href)};}
  async function validateToken(token){if(!token)return null;try{const c=new AbortController(),timer=setTimeout(()=>c.abort(),4500);const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:'me'}),signal:c.signal});clearTimeout(timer);const x=await r.json().catch(()=>({}));if(!r.ok||!x.user)throw new Error(x.error||'Sesión no válida');const auth={token,expires_at:x.expires_at,auth_session_id:x.auth_session_id,user:x.user};writeLocal(auth);setCookie(token);return x.user}catch{return null}}
  async function recover(){const stored=readLocal();if(stored?.token){const u=await validateToken(stored.token);if(u)return u}const ct=readCookie();if(ct){const u=await validateToken(ct);if(u)return u;clearCookie()}return null}
  async function check(){const api=window.ANDES_LMS;if(!api)return setTimeout(check,80);try{const user=await api.ready();if(user){unlocked(api,user);return}const recovered=await recover();if(recovered){gate.innerHTML='<div class="ag-card"><h1>Sesión recuperada</h1><p>Continuando sin pedirte acceso otra vez…</p></div>';setTimeout(()=>location.reload(),80);return}locked()}catch{const recovered=await recover();recovered?setTimeout(()=>location.reload(),80):locked()}}
  check();
  addEventListener('storage',e=>{if(e.key===STORE&&e.newValue&&document.getElementById('andes-access-gate'))location.reload()});
  addEventListener('pageshow',e=>{if(e.persisted&&document.getElementById('andes-access-gate')){try{if(localStorage.getItem(STORE)||sessionStorage.getItem(STORE)||readCookie())location.reload()}catch{}}});
})();
