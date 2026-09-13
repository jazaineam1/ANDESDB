(()=>{
'use strict';
if(window.__ANDES_ACCESS_GATE_V4__||window.self!==window.top)return;window.__ANDES_ACCESS_GATE_V4__=true;
if(/\/portal\.html$/i.test(location.pathname))return;
const script=document.currentScript||[...document.scripts].find(s=>/access-gate\.js(?:\?|$)/.test(s.src));if(!script)return;
const ROOT=new URL('../../',script.src),AUTH_API='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-auth';
const STORE='andesdb.lms.auth.v1',COOKIE='andesdb_lms_session',COOKIE_PATH=ROOT.pathname,COOKIE_AGE=34560000;
const next=location.pathname+location.search+location.hash;
const readLocal=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}};
const writeLocal=x=>{try{x?localStorage.setItem(STORE,JSON.stringify(x)):localStorage.removeItem(STORE)}catch{}};
const readCookie=()=>{const x=document.cookie.split('; ').find(v=>v.startsWith(COOKIE+'='));return x?decodeURIComponent(x.slice(COOKIE.length+1)):''};
const setCookie=t=>{if(t)document.cookie=`${COOKIE}=${encodeURIComponent(t)}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_AGE}; Secure; SameSite=Lax`};
const clearCookie=()=>{document.cookie=`${COOKIE}=; Path=${COOKIE_PATH}; Max-Age=0; Secure; SameSite=Lax`};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isPresentation=/\/Presentaciones\//i.test(location.pathname);
function currentSession(){const q=Number(new URLSearchParams(location.search).get('session'));if(Number.isInteger(q)&&q>=1&&q<=16)return q;const m=(location.pathname+' '+document.title).match(/sesion[-_\s]*(\d{1,2})/i);return m?Number(m[1]):null}

/* Mantener la navegación interna en la misma pestaña evita perder contexto o sesión. */
document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download')||a.target==='_blank')return;let u;try{u=new URL(a.href,location.href)}catch{return}if(u.origin!==location.origin||!u.pathname.startsWith(ROOT.pathname))return;e.preventDefault();location.assign(u.href)},true);

const st=document.createElement('style');st.id='andes-access-v4-css';st.textContent=`
#andes-access-gate{position:fixed;inset:0;z-index:2147483646;background:#101828f5;color:#fff;display:grid;place-items:center;padding:18px;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
#andes-access-gate .ag-card{width:min(500px,94vw);background:#fff;color:#17202a;border-radius:18px;padding:24px;box-shadow:0 30px 100px #0008}#andes-access-gate h1{margin:.25rem 0 .55rem;font-size:1.65rem}#andes-access-gate p{color:#667085;line-height:1.5}.ag-ey{font-size:.72rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#8a7300}.ag-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.ag-btn{border:0;border-radius:10px;padding:10px 13px;background:#175cd3;color:#fff;text-decoration:none;font-weight:850;cursor:pointer}.ag-btn.alt{background:#eef2f6;color:#17202a}.ag-note{margin-top:14px;border-left:4px solid #f79009;background:#fffaeb;border-radius:8px;padding:9px;font-size:.8rem;color:#7a2e0e}
/* En presentaciones revision dejamos UNA sola navegación externa al deck. */
#andes-toolkit-btn,#andes-session-lab-btn,#andes-learning-btn,#andes-role-access-v2,#andes-pres-tools{display:none!important}
#andes-resource-dock{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483500;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
#andes-resource-dock .rd-open{border:1px solid #ffffff35;background:#101828f4;color:#fff;border-radius:999px;padding:11px 14px;box-shadow:0 9px 28px #0004;font:850 12px/1 system-ui;cursor:pointer;display:flex;align-items:center;gap:7px}
#andes-resource-dock .rd-panel{display:none;position:absolute;right:0;bottom:50px;width:min(340px,calc(100vw - 24px));max-height:min(68vh,560px);overflow:auto;background:#fff;color:#17202a;border:1px solid #d8dee8;border-radius:16px;box-shadow:0 24px 70px #0005;padding:10px}
#andes-resource-dock.open .rd-panel{display:block}.rd-head{padding:8px 9px 10px;border-bottom:1px solid #edf0f4}.rd-head b{display:block;font-size:14px}.rd-head span{display:block;margin-top:3px;color:#667085;font-size:11px;line-height:1.35}.rd-group{padding:8px 0}.rd-label{padding:3px 9px 6px;color:#667085;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.rd-link{display:flex;align-items:flex-start;gap:9px;padding:10px 9px;border-radius:10px;color:#17202a;text-decoration:none;font-size:12px;font-weight:750;line-height:1.3}.rd-link:hover,.rd-link:focus{background:#f2f4f7;outline:none}.rd-link strong{display:block}.rd-link small{display:block;color:#667085;font-weight:500;margin-top:2px}.rd-link.primary{background:#101828;color:#fff}.rd-link.primary small{color:#d0d5dd}.rd-link.lab{background:#edf8f2;color:#14532d}.rd-sep{height:1px;background:#edf0f4;margin:2px 9px}.rd-user{padding:8px 9px 3px;color:#667085;font-size:11px}
@media(max-width:760px){#andes-resource-dock{right:10px;bottom:calc(10px + env(safe-area-inset-bottom))}#andes-resource-dock .rd-open{padding:11px 13px;font-size:12px}#andes-resource-dock .rd-panel{position:fixed;left:10px;right:10px;bottom:calc(62px + env(safe-area-inset-bottom));width:auto;max-height:64vh;border-radius:18px}}
`;document.head.appendChild(st);

let gate=null,dock=null,currentUser=null;
function ensureGate(){if(gate?.isConnected)return gate;gate=document.createElement('div');gate.id='andes-access-gate';document.body.appendChild(gate);return gate}
function showChecking(){ensureGate().innerHTML='<div class="ag-card"><div class="ag-ey">ANDESDB · acceso</div><h1>Verificando tu sesión…</h1><p>Un momento mientras comprobamos tu acceso.</p></div>'}
function locked(message='Usa el mismo usuario y contraseña del Portal. Después volverás exactamente a esta actividad.'){
  currentUser=null;if(dock){dock.remove();dock=null}ensureGate().innerHTML=`<div class="ag-card"><div class="ag-ey">ANDESDB · acceso requerido</div><h1>Inicia sesión para continuar</h1><p>${esc(message)}</p><div class="ag-actions"><a class="ag-btn" href="${new URL('portal.html?next='+encodeURIComponent(next),ROOT).href}">Iniciar sesión</a><a class="ag-btn alt" href="${new URL('portal.html',ROOT).href}">Inicio</a></div><div class="ag-note"><b>¿Olvidaste tu contraseña?</b> El docente puede restablecerla sin crear otra cuenta.</div></div>`;
}
function resourceUrl(r){try{return new URL(r.href,ROOT).href}catch{return '#'}}
function resourceItems(session){
  const course=window.ANDES_COURSE,s=course?.session?.(session),mod=(course?.modules||[]).find(m=>(m.sesiones||[]).some(x=>Number(x.n)===Number(session)));
  const items=[],seen=new Set();
  const add=(r,scope)=>{if(!r?.href)return;const href=resourceUrl(r);if(seen.has(href))return;seen.add(href);items.push({...r,href,scope})};
  (s?.recursos||[]).forEach(r=>add(r,'Sesión'));
  (mod?.recursos||[]).forEach(r=>add(r,'Módulo'));
  return {s,items};
}
function renderResources(){if(!dock||!isPresentation)return;const n=currentSession(),{s,items}=resourceItems(n);const first=(currentUser?.display_name||currentUser?.username||'').split(' ')[0];
  const extras=items.length?`<div class="rd-group"><div class="rd-label">Materiales de esta sesión</div>${items.map(r=>`<a class="rd-link" href="${esc(r.href)}" ${r.externo?'target="_blank" rel="noopener noreferrer"':''} ${r.download?'download':''}><span>↗</span><span><strong>${esc(r.txt||'Recurso')}</strong><small>${esc(r.scope||'Recurso')}</small></span></a>`).join('')}</div>`:'';
  dock.querySelector('.rd-panel').innerHTML=`<div class="rd-head"><b>S${n||'–'} · ${esc(s?.titulo||'Recursos de la sesión')}</b><span>Todo lo necesario para estudiar sin salir a buscar enlaces por la plataforma.</span></div><div class="rd-group"><a class="rd-link primary" href="${new URL('learning-hub.html',ROOT).href}"><span>←</span><span><strong>Volver al curso</strong><small>Ruta completa de 16 sesiones</small></span></a><a class="rd-link" href="${new URL(`reading.html?session=${n||1}`,ROOT).href}"><span>📖</span><span><strong>Lectura de la sesión</strong><small>Conceptos, referencias y comprobación</small></span></a><a class="rd-link lab" href="${new URL(`lab.html?session=${n||1}`,ROOT).href}"><span>🧪</span><span><strong>Laboratorio S${n||''}</strong><small>10 prácticas con evidencia</small></span></a></div>${extras}<div class="rd-sep"></div><div class="rd-group"><a class="rd-link" href="${new URL('portal.html',ROOT).href}"><span>⌂</span><span><strong>Mi inicio</strong><small>Progreso, agenda y cuenta</small></span></a>${['teacher','admin'].includes(String(currentUser?.role||'').toLowerCase())?`<a class="rd-link" href="${new URL('teacher-dashboard.html',ROOT).href}"><span>⚙</span><span><strong>Control docente</strong><small>Seguimiento del grupo</small></span></a>`:''}</div>${first?`<div class="rd-user">Sesión iniciada como <b>${esc(first)}</b></div>`:''}`;
}
function installResources(user){if(!isPresentation)return;currentUser=user||currentUser;if(dock?.isConnected){renderResources();return}dock=document.createElement('div');dock.id='andes-resource-dock';dock.innerHTML='<button class="rd-open" type="button" aria-expanded="false"><span>☰</span><span>Recursos</span></button><div class="rd-panel" role="dialog" aria-label="Recursos de la sesión"></div>';document.body.appendChild(dock);const b=dock.querySelector('.rd-open');b.onclick=e=>{e.stopPropagation();const open=dock.classList.toggle('open');b.setAttribute('aria-expanded',String(open))};document.addEventListener('click',e=>{if(dock?.classList.contains('open')&&!dock.contains(e.target)){dock.classList.remove('open');b.setAttribute('aria-expanded','false')}},{passive:true});addEventListener('andesdb:course-ready',renderResources);addEventListener('andesdb:course-updated',renderResources);renderResources()}
function unlock(user,token){currentUser=user||readLocal()?.user||null;if(token)setCookie(token);gate?.remove();gate=null;installResources(currentUser)}

async function verify(token,ms=3500){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(AUTH_API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:'me'}),signal:c.signal,cache:'no-store'});const x=await r.json().catch(()=>({}));if(r.ok&&x.user)return{ok:true,data:x};if(r.status===401||r.status===403)return{ok:false,definitive:true};return{ok:false,definitive:false}}
  catch{return{ok:false,definitive:false}}
  finally{clearTimeout(timer)}
}
async function boot(){
  const local=readLocal();
  if(local?.token&&local?.user){
    /* Prioridad UX: no bloquear la presentación por una validación de red. */
    unlock(local.user,local.token);
    setTimeout(async()=>{if(document.visibilityState==='hidden')return;const v=await verify(local.token);if(v.ok){writeLocal({...local,...v.data,token:local.token,user:v.data.user});currentUser=v.data.user;renderResources();return}if(v.definitive){writeLocal(null);clearCookie();locked('Tu sesión ya no es válida. Inicia sesión nuevamente para continuar.')}},150);
    return;
  }
  const cookie=readCookie();
  if(cookie){showChecking();const v=await verify(cookie,4500);if(v.ok){writeLocal({token:cookie,expires_at:v.data.expires_at,auth_session_id:v.data.auth_session_id,user:v.data.user,course_run:v.data.course_run});unlock(v.data.user,cookie);return}if(v.definitive)clearCookie();locked(v.definitive?'Tu sesión expiró o fue revocada. Inicia sesión nuevamente.':'No pudimos verificar la sesión. Puedes volver al Portal e intentarlo de nuevo.');return}
  locked();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();