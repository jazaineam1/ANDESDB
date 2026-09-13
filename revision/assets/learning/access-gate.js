(() => {
  'use strict';
  if (window.self !== window.top || document.getElementById('andes-access-gate')) return;
  if (/\/portal\.html$/i.test(location.pathname)) return;
  const script=document.currentScript||[...document.scripts].find(s=>/access-gate\.js(?:\?|$)/.test(s.src));if(!script)return;
  const ROOT=new URL('../../',script.src),API='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-auth';
  const STORE='andesdb.lms.auth.v1',COOKIE='andesdb_lms_session',COOKIE_PATH=ROOT.pathname,COOKIE_AGE=34560000,next=location.pathname+location.search+location.hash;
  const readCookie=()=>{const p=document.cookie.split('; ').find(x=>x.startsWith(COOKIE+'='));return p?decodeURIComponent(p.slice(COOKIE.length+1)):''};
  const setCookie=t=>{if(t)document.cookie=`${COOKIE}=${encodeURIComponent(t)}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_AGE}; Secure; SameSite=Lax`};
  const clearCookie=()=>{document.cookie=`${COOKIE}=; Path=${COOKIE_PATH}; Max-Age=0; Secure; SameSite=Lax`};
  const readLocal=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}},writeLocal=x=>{try{x?localStorage.setItem(STORE,JSON.stringify(x)):localStorage.removeItem(STORE)}catch{}};
  document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download')||a.target==='_blank')return;let u;try{u=new URL(a.href,location.href)}catch{return}if(u.origin!==location.origin||!u.pathname.startsWith(ROOT.pathname))return;if(u.pathname===location.pathname&&u.search===location.search&&u.hash&&u.hash!==location.hash)return;e.preventDefault();location.assign(u.href)},true);
  const st=document.createElement('style');st.textContent=`
#andes-access-gate{position:fixed;inset:0;z-index:2147483646;background:#101828f5;color:#fff;display:grid;place-items:center;padding:18px;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
#andes-access-gate .ag-card{width:min(500px,94vw);background:#fff;color:#17202a;border-radius:18px;padding:24px;box-shadow:0 30px 100px #0008}
#andes-access-gate h1{margin:.25rem 0 .55rem;font-size:1.65rem}#andes-access-gate p{color:#667085;line-height:1.5}.ag-ey{font-size:.72rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#8a7300}.ag-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.ag-btn{border:0;border-radius:10px;padding:10px 13px;background:#175cd3;color:#fff;text-decoration:none;font-weight:850;cursor:pointer}.ag-btn.alt{background:#eef2f6;color:#17202a}.ag-note{margin-top:14px;border-left:4px solid #f79009;background:#fffaeb;border-radius:8px;padding:9px;font-size:.8rem;color:#7a2e0e}
#andes-pres-tools{position:fixed;right:10px;bottom:10px;z-index:2147483500;font:800 11px/1 system-ui,-apple-system,Segoe UI,sans-serif}
#andes-pres-tools .pt-toggle{display:none;border:1px solid #ffffff30;background:#101828f2;color:#fff;width:42px;height:42px;border-radius:999px;box-shadow:0 8px 24px #0004;font:900 22px/1 system-ui;cursor:pointer}
#andes-pres-tools .pt-panel{background:#101828f2;border:1px solid #ffffff25;border-radius:11px;padding:5px;display:flex;gap:4px;box-shadow:0 8px 24px #0003}
#andes-pres-tools a,#andes-pres-tools button{border:0;background:#ffffff10;color:#fff;border-radius:7px;padding:7px 8px;text-decoration:none;font:800 11px/1 system-ui;cursor:pointer;white-space:nowrap}
#andes-pres-tools button:disabled{opacity:.72;cursor:wait}
#andes-pres-tools .pt-save.saved{background:#166534}
#andes-pres-tools .pt-save.error{background:#b42318}
@media(max-width:760px){
  #andes-pres-tools{right:5px;top:50%;bottom:auto;transform:translateY(-50%)}
  #andes-pres-tools .pt-toggle{display:grid;place-items:center}
  #andes-pres-tools .pt-panel{display:none;position:absolute;right:48px;top:50%;transform:translateY(-50%);flex-direction:column;min-width:118px;padding:6px;border-radius:12px}
  #andes-pres-tools.open .pt-panel{display:flex}
  #andes-pres-tools a,#andes-pres-tools button{padding:10px 11px;font-size:12px;text-align:left}
}
`;document.head.appendChild(st);
  const gate=document.createElement('div');gate.id='andes-access-gate';gate.innerHTML='<div class="ag-card"><div class="ag-ey">ANDESDB · acceso</div><h1>Verificando tu sesión…</h1><p>Estamos comprobando tu acceso antes de abrir esta actividad.</p></div>';document.body.appendChild(gate);
  function locked(){gate.innerHTML=`<div class="ag-card"><div class="ag-ey">ANDESDB · acceso requerido</div><h1>Inicia sesión para continuar</h1><p>Usa el mismo usuario y contraseña del Portal. Después volverás exactamente a esta actividad.</p><div class="ag-actions"><a class="ag-btn" href="${new URL('portal.html?next='+encodeURIComponent(next),ROOT).href}">Iniciar sesión</a><a class="ag-btn alt" href="${new URL('portal.html',ROOT).href}">Inicio</a></div><div class="ag-note"><b>¿Olvidaste tu contraseña?</b> El docente puede restablecerla sin crear otra cuenta.</div></div>`}
  function slideNumber(){const a=[...document.querySelectorAll('.slide')],i=a.findIndex(x=>x.classList.contains('active'));if(i>=0)return i+1;const b=[...document.querySelectorAll('.reveal .slides section')],j=b.findIndex(x=>x.classList.contains('present'));return j>=0?j+1:null}
  function presentationTools(api,user){
    if(!/\/Presentaciones\//i.test(location.pathname)||document.getElementById('andes-pres-tools'))return;
    const p=document.createElement('div');p.id='andes-pres-tools';
    p.innerHTML=`<button class="pt-toggle" type="button" aria-label="Abrir herramientas" aria-expanded="false">⋮</button><div class="pt-panel"><a href="${new URL('learning-hub.html',ROOT).href}">Curso</a><button class="pt-save" type="button" id="andes-save">Guardar</button>${['teacher','admin'].includes(user.role)?`<a href="${new URL('teacher-dashboard.html',ROOT).href}">Docente</a>`:''}</div>`;
    document.body.appendChild(p);
    const toggle=p.querySelector('.pt-toggle'),panel=p.querySelector('.pt-panel');
    toggle.onclick=e=>{e.stopPropagation();const open=p.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'×':'⋮'};
    document.addEventListener('click',e=>{if(innerWidth<=760&&p.classList.contains('open')&&!p.contains(e.target)){p.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='⋮'}},{passive:true});
    const b=p.querySelector('#andes-save');
    b.onclick=async e=>{
      e.stopPropagation();
      if(b.disabled)return;
      const m=(location.pathname+' '+document.title).match(/sesion[-_\s]*(\d{1,2})/i),session_number=m?Number(m[1]):null;
      const save=window.ANDES_PLATFORM?.saveBookmark;
      if(typeof save!=='function'){b.textContent='Sin conexión';b.classList.add('error');setTimeout(()=>{b.textContent='Guardar';b.classList.remove('error')},1600);return}
      b.disabled=true;b.textContent='Guardando…';b.classList.remove('saved','error');
      const payload={session_number,slide_number:slideNumber(),activity_code:null,path:location.pathname+location.search,title:document.title,note:''};
      let timer;
      try{
        await Promise.race([save(payload),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),4500)})]);
        b.textContent='Guardado ✓';b.classList.add('saved');
        setTimeout(()=>{if(innerWidth<=760){p.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='⋮'}},650);
      }catch{
        b.textContent='Reintentar';b.classList.add('error');
      }finally{
        clearTimeout(timer);b.disabled=false;
      }
    };
  }
  function unlocked(api,user){const local=readLocal();if(local?.token)setCookie(local.token);gate.remove();presentationTools(api,user)}
  async function recoverFromCookie(){const token=readCookie();if(!token)return null;try{const c=new AbortController(),timer=setTimeout(()=>c.abort(),4500);const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:'me'}),signal:c.signal});clearTimeout(timer);const x=await r.json().catch(()=>({}));if(!r.ok||!x.user)throw new Error();writeLocal({token,expires_at:x.expires_at,auth_session_id:x.auth_session_id,user:x.user,course_run:x.course_run});setCookie(token);return x.user}catch{clearCookie();return null}}
  async function check(){const api=window.ANDES_LMS;if(!api)return setTimeout(check,80);try{const user=await api.ready();if(user)return unlocked(api,user);const recovered=await recoverFromCookie();recovered?location.reload():locked()}catch{const recovered=await recoverFromCookie();recovered?location.reload():locked()}}
  check();addEventListener('storage',e=>{if(e.key===STORE&&e.newValue&&document.getElementById('andes-access-gate'))location.reload()});addEventListener('pageshow',e=>{if(e.persisted&&document.getElementById('andes-access-gate')){try{if(localStorage.getItem(STORE)||readCookie())location.reload()}catch{}}});
})();