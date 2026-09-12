(() => {
  'use strict';

  if (window.ANDES_LMS?.version?.startsWith('2.')) return;

  const script = document.currentScript || [...document.scripts].find(s => /learning-tracker-v2\.js(?:\?|$)/.test(s.src));
  if (!script) return;
  const ROOT = new URL('../../', script.src);
  const API = 'https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1';
  const STORE = 'andesdb.lms.auth.v1';
  const LOCAL = 'andesdb.lms.local.v1';
  const TOOLKIT_STORE = 'andesdb.revision.toolkit.v1';

  const ROUTE = [
    [1,'M1','Diagnóstico y contexto','Presentaciones/M1/sesion-1-diagnostico.html','s1-diagnostico'],
    [2,'M2','Bases de datos y primeras consultas','Presentaciones/M2/sesion-2-bases-de-datos-y-primeras-consultas.html','sql-s2'],
    [3,'M2','Filtros y agregaciones','Presentaciones/M2/sesion-3-filtros-y-agregaciones.html','sql-s3'],
    [4,'M2','Uniones de tablas','Presentaciones/M2/sesion-4-uniones-de-tablas.html','sql-s4'],
    [5,'M2','Algorítmica de tablas','Presentaciones/M2/sesion-5-algoritmica-de-tablas.html','sql-s5'],
    [6,'M3','Reglas de negocio','Presentaciones/M3/sesion-6-reglas-de-negocio.html','s6-reglas-evidencia'],
    [7,'M3','De las reglas al modelo','Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html','erd-s7'],
    [8,'M3','Modelado y normalización','Presentaciones/M3/sesion-8-modelado-y-normalizacion.html','erd-s8'],
    [9,'M3','DDL y restricciones en Supabase','Presentaciones/M3/sesion-9-ddl-supabase.html','s9-constraints'],
    [10,'M4','¿SQL o NoSQL?','Presentaciones/M4/sesion-10-sql-o-nosql.html','decision-s10'],
    [11,'M4','Documentos de verdad','Presentaciones/M4/sesion-11-documentos-de-verdad.html','s11-documentos'],
    [12,'M5','Fundamentos de data warehouse','Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html','warehouse-s12'],
    [13,'M5','Laboratorio BigQuery','Presentaciones/M5/sesion-13-laboratorio-bigquery.html','bigquery-s13'],
    [14,'M5','BigQuery anidado y mapa Azure','Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html','unnest-s14'],
    [15,'M6','Desafío final','Presentaciones/M6/sesion-15-desafio-final.html','s15-integrador'],
    [16,'M6','Cierre + DP-900','Presentaciones/M6/sesion-16-cierre-dp900.html','s16-dp900'],
  ].map(([n,module,title,path,activity]) => ({n,module,title,path,activity}));

  const MODULES = {
    M1:'Contexto', M2:'SQL', M3:'Modelado e implementación',
    M4:'NoSQL', M5:'Analítica y cloud', M6:'Integración y cierre'
  };

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readJSON = (key, fallback=null) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const writeAuth = v => { try { v ? localStorage.setItem(STORE, JSON.stringify(v)) : localStorage.removeItem(STORE); } catch {} };
  const formatTime = seconds => {
    seconds = Math.max(0, Number(seconds || 0));
    if (seconds < 60) return seconds > 0 ? '<1 min' : '0 min';
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
    return h ? `${h} h ${m} min` : `${m} min`;
  };
  const currentSession = () => {
    const m = (location.pathname + ' ' + document.title).match(/sesion[-_\s]*(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  };
  const currentActivity = () => ROUTE.find(r => r.n === currentSession())?.activity || null;
  const routeForActivity = a => ROUTE.find(r => r.activity === a);

  let auth = readJSON(STORE, null);
  let me = auth?.user || null;
  let overlay = null;
  let button = null;
  let dashboardCache = null;
  let lastInteraction = Date.now();
  let lastHeartbeat = Date.now();
  let lastSlide = null;
  const pending = [];
  const completedSeen = new Set(Object.keys(readJSON(LOCAL, {})?.completed || {}));
  let readyResolve;
  const readyPromise = new Promise(r => readyResolve = r);

  async function call(path, opts={}) {
    const headers = {'Content-Type':'application/json', ...(opts.headers || {})};
    if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
    const res = await fetch(`${API}/${path}`, {...opts, headers});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) { auth=null; me=null; writeAuth(null); updateButton(); }
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  }

  async function login(username,password) {
    const data = await call('learning-auth',{method:'POST',body:JSON.stringify({action:'login',username,password})});
    auth={token:data.token,expires_at:data.expires_at,auth_session_id:data.auth_session_id,user:data.user};
    me=data.user; writeAuth(auth); dashboardCache=null; updateButton();
    await track('page_opened',{source:'login'});
    await flushPending();
    try { await dashboard('me',true); } catch {}
    await renderPanel();
    return me;
  }

  async function logout() {
    try { if(auth?.token) await call('learning-auth',{method:'POST',body:JSON.stringify({action:'logout'})}); } catch {}
    auth=null; me=null; dashboardCache=null; writeAuth(null); updateButton();
    await renderPanel();
  }

  async function changePassword(current_password,new_password) {
    if (!auth?.token) throw new Error('Debes iniciar sesión');
    const data = await call('learning-password',{method:'POST',body:JSON.stringify({current_password,new_password})});
    return data;
  }

  async function validateAuth() {
    if(!auth?.token){readyResolve(null);return null;}
    try{
      const data=await call('learning-auth',{method:'POST',body:JSON.stringify({action:'me'})});
      me=data.user; auth.user=me; auth.expires_at=data.expires_at; auth.auth_session_id=data.auth_session_id; writeAuth(auth); updateButton();
      readyResolve(me); return me;
    }catch{auth=null;me=null;writeAuth(null);updateButton();readyResolve(null);return null;}
  }

  function localComplete(activity,score=1){
    const x=readJSON(LOCAL,{}) || {}; x.completed ||= {}; x.completed[activity]={at:new Date().toISOString(),score};
    try{localStorage.setItem(LOCAL,JSON.stringify(x));}catch{}
  }

  async function track(event_type,metadata={},overrides={}){
    const event={
      event_type,
      session_number:overrides.session_number ?? currentSession(),
      activity_code:overrides.activity_code ?? null,
      slide_number:overrides.slide_number ?? getSlideNumber(),
      active_seconds_delta:overrides.active_seconds_delta ?? 0,
      metadata,
      client_at:new Date().toISOString()
    };
    if(!auth?.token){pending.push(event);if(pending.length>40)pending.shift();return false;}
    try{await call('learning-track',{method:'POST',body:JSON.stringify(event),keepalive:true});dashboardCache=null;return true;}catch{return false;}
  }

  async function flushPending(){
    if(!auth?.token || !pending.length)return;
    const events=pending.splice(0,20);
    try{await call('learning-track',{method:'POST',body:JSON.stringify({events}),keepalive:true});if(pending.length)await flushPending();}
    catch{pending.unshift(...events);}
  }

  const attempt=(activity=currentActivity(),metadata={},session_number=currentSession()) => activity ? track('challenge_attempt',metadata,{activity_code:activity,session_number}) : Promise.resolve();
  const hint=(activity=currentActivity(),metadata={},session_number=currentSession()) => activity ? track('hint_requested',metadata,{activity_code:activity,session_number}) : Promise.resolve();
  const fail=(activity=currentActivity(),metadata={},session_number=currentSession()) => activity ? track('challenge_failed',metadata,{activity_code:activity,session_number}) : Promise.resolve();

  async function complete(activity=currentActivity(),score=1,metadata={},session_number=null){
    if(!activity)return false;
    const r=routeForActivity(activity); session_number ??= r?.n ?? currentSession();
    localComplete(activity,score);
    if(completedSeen.has(activity))return true;
    completedSeen.add(activity);
    await track('challenge_completed',{score,...metadata},{activity_code:activity,session_number});
    dashboardCache=null;
    if(overlay?.classList.contains('open'))await renderPanel();
    return true;
  }

  async function dashboard(scope='me',fresh=false){
    if(!auth?.token)throw new Error('Debes iniciar sesión');
    if(scope==='me' && dashboardCache && !fresh)return dashboardCache;
    const data=await call(`learning-dashboard?scope=${encodeURIComponent(scope)}`,{method:'GET'});
    if(scope==='me'){
      dashboardCache=data;
      (data.activity_progress||[]).filter(x=>x.status==='completed').forEach(x=>completedSeen.add(x.activity_code));
    }
    return data;
  }

  function getSlideNumber(){
    const slides=[...document.querySelectorAll('.slide')];
    if(slides.length){const i=slides.findIndex(s=>s.classList.contains('active'));if(i>=0)return i+1;}
    const reveal=[...document.querySelectorAll('.reveal .slides section')];
    if(reveal.length){const i=reveal.findIndex(s=>s.classList.contains('present'));if(i>=0)return i+1;}
    const txt=document.querySelector('#count,[data-slide-count],.slide-number')?.textContent||'';
    const m=txt.match(/(\d+)\s*(?:\/|of)/i);return m?Number(m[1]):null;
  }

  function installStyles(){
    if(document.getElementById('andes-lms-css'))return;
    const st=document.createElement('style');st.id='andes-lms-css';st.textContent=`
#andes-learning-btn{position:fixed;left:12px;bottom:12px;z-index:2147481800;border:1px solid #ffffff55;background:#111827f2;color:#fff;border-radius:999px;padding:10px 14px;font:800 12px/1.1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 8px 28px #0005;cursor:pointer;backdrop-filter:blur(8px)}
.al-overlay{position:fixed;inset:0;z-index:2147483600;background:#000b;display:none;align-items:stretch;justify-content:flex-end;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111827}.al-overlay.open{display:flex}.al-panel{width:min(620px,100vw);height:100vh;overflow:auto;overscroll-behavior:contain;background:#f6f7f9;box-shadow:-20px 0 60px #0007}.al-head{position:sticky;top:0;z-index:5;background:#101827;color:#fff;padding:14px 16px;display:flex;gap:10px;align-items:center;border-bottom:1px solid #ffffff18}.al-head-title{min-width:0;flex:1}.al-head h2{font-size:18px;margin:0;line-height:1.15}.al-head small{display:block;margin-top:3px;color:#b8c3d1;font-size:11px}.al-close{border:1px solid #ffffff55;background:#ffffff12;color:#fff;border-radius:12px;width:42px;height:42px;font-size:22px;cursor:pointer}.al-body{padding:14px;display:grid;gap:12px}.al-card{background:#fff;border:1px solid #dde3ea;border-radius:16px;padding:14px;box-shadow:0 5px 18px #0f172a08}.al-card h3{margin:0 0 8px;font-size:16px}.al-card p{margin:.3rem 0;line-height:1.45}.al-muted{font-size:12px;color:#64748b}.al-overview{padding:15px;background:linear-gradient(145deg,#0e1a24,#173247);color:#fff;border:0}.al-overview-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.al-overview h3{font-size:17px;margin:0}.al-big{font-size:27px;font-weight:900;line-height:1}.al-big small{font-size:12px;font-weight:700;color:#cbd5e1}.al-progressbar{height:9px;background:#ffffff1f;border-radius:999px;overflow:hidden;margin:12px 0 8px}.al-progressbar i{display:block;height:100%;background:#ffd600;border-radius:999px}.al-overview-note{font-size:12px;color:#dbe6ee}.al-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.al-metric{background:#ffffff0e;border:1px solid #ffffff16;border-radius:11px;padding:9px;text-align:center}.al-metric b{display:block;font-size:17px;color:#fff}.al-metric span{font-size:10px;color:#c8d5df}.al-next{display:flex;align-items:center;gap:10px;margin-top:11px;padding:9px 10px;background:#ffffff0d;border:1px solid #ffffff17;border-radius:11px;color:#fff;text-decoration:none}.al-next b{display:block;font-size:13px}.al-next span{font-size:11px;color:#cbd5e1}.al-next-arrow{margin-left:auto;font-size:20px}.al-form{display:grid;gap:9px}.al-input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px 11px;font:inherit;background:#fff}.al-input:focus{outline:3px solid #facc1538;border-color:#d4a900}.al-btn{border:0;border-radius:10px;padding:9px 12px;background:#111827;color:#fff;font-weight:800;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.al-btn.alt{background:#e8edf2;color:#111827}.al-btn.good{background:#166534}.al-actions{display:flex;gap:8px;flex-wrap:wrap}.al-error,.al-success{border-radius:9px;padding:9px;font-size:13px;display:none}.al-error.show{display:block;background:#fee2e2;color:#7f1d1d}.al-success.show{display:block;background:#dcfce7;color:#14532d}.al-login-note{border-left:4px solid #eab308;background:#fffbeb;padding:10px;border-radius:8px;font-size:12px}.al-legend{display:flex;gap:7px;flex-wrap:wrap;font-size:11px;color:#64748b;margin-top:6px}.al-legend span{display:inline-flex;align-items:center;gap:4px}.al-dot{width:8px;height:8px;border-radius:50%;display:inline-block}.al-dot.done{background:#15803d}.al-dot.practice{background:#d97706}.al-dot.visited{background:#2563eb}.al-dot.pending{background:#cbd5e1}.al-module{margin-top:9px}.al-module:first-child{margin-top:0}.al-module-head{display:flex;align-items:center;gap:7px;padding:2px 4px 7px;color:#475569}.al-module-head b{font-size:12px}.al-module-head span{font-size:11px;color:#94a3b8}.al-route{display:grid;gap:6px}.al-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto 18px;gap:9px;align-items:center;border:1px solid #e2e8f0;border-radius:12px;padding:9px 10px;text-decoration:none;color:#111827;background:#fff;min-height:60px}.al-row:hover{border-color:#94a3b8}.al-row.current{border:2px solid #eab308;background:#fffdf1;padding:8px 9px}.al-num{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#edf1f5;color:#475569;font-size:12px;font-weight:900}.al-row.done .al-num{background:#15803d;color:#fff}.al-row.practice .al-num{background:#fff3d4;color:#9a5500}.al-row.visited .al-num{background:#e7f0ff;color:#1d4ed8}.al-title{font-size:14px;font-weight:850;line-height:1.2}.al-sub{font-size:11px;color:#7b8794;margin-top:3px;white-space:normal}.al-state{font-size:10px;font-weight:900;white-space:nowrap;border-radius:999px;padding:5px 7px}.al-state.done{color:#166534;background:#dcfce7}.al-state.practice{color:#92400e;background:#fef3c7}.al-state.visited{color:#1d4ed8;background:#dbeafe}.al-state.pending{color:#64748b;background:#f1f5f9}.al-chevron{color:#94a3b8;font-size:18px}.al-account{display:grid;gap:9px}.al-account-line{display:flex;gap:10px;align-items:center;justify-content:space-between}.al-user b{display:block;font-size:14px}.al-user span{font-size:11px;color:#64748b}.al-details{border-top:1px solid #edf0f4;padding-top:9px}.al-details summary{cursor:pointer;font-weight:800;font-size:13px;color:#334155;list-style:none}.al-details summary::-webkit-details-marker{display:none}.al-details summary:after{content:'›';float:right;font-size:18px;transform:rotate(90deg)}.al-details[open] summary:after{transform:rotate(-90deg)}.al-password-help{font-size:11px;color:#64748b;margin:7px 0}.al-footnote{font-size:11px;color:#64748b;line-height:1.45}.al-skeleton{padding:30px;text-align:center;color:#64748b}
@media(max-width:760px){#andes-learning-btn{left:8px;bottom:8px}.al-panel{width:100vw}.al-overlay{justify-content:center}.al-body{padding:11px}.al-grid{grid-template-columns:repeat(3,1fr)}.al-row{grid-template-columns:32px minmax(0,1fr) auto 14px;padding:8px}.al-state{font-size:9px;padding:4px 6px}.al-title{font-size:13.5px}.al-card{padding:12px}}
`;
    document.head.appendChild(st);
  }

  function installUI(){
    if(document.getElementById('andes-learning-btn'))return;
    button=document.createElement('button');button.id='andes-learning-btn';button.type='button';button.innerHTML='🎓 <span>Mi aprendizaje</span>';document.body.appendChild(button);
    overlay=document.createElement('div');overlay.className='al-overlay';overlay.id='andes-learning-overlay';
    overlay.innerHTML=`<aside class="al-panel" role="dialog" aria-modal="true" aria-label="Mi aprendizaje"><div class="al-head"><div class="al-head-title"><h2>🎓 Mi aprendizaje</h2><small>ANDESDB · progreso y práctica</small></div><button class="al-close" aria-label="Cerrar">×</button></div><div class="al-body" id="al-body"></div></aside>`;
    document.body.appendChild(overlay);
    button.onclick=async()=>{overlay.classList.add('open');overlay.querySelector('.al-panel').scrollTop=0;await renderPanel();};
    overlay.querySelector('.al-close').onclick=()=>overlay.classList.remove('open');
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('open')});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.classList.remove('open')});
    updateButton();
  }

  function updateButton(){
    if(!button)return;const name=me?.display_name||me?.username;
    button.innerHTML=name?`🎓 <span>${esc(name.split(' ')[0])}</span>`:'🎓 <span>Mi aprendizaje</span>';
  }

  function deriveStatus(r,spMap,apMap){
    const ap=apMap.get(r.activity), sp=spMap.get(r.n);
    if(ap?.status==='completed' || sp?.status==='completed')return {key:'done',label:'✓ Logrado'};
    if(ap?.status==='in_progress' || Number(ap?.attempts||0)>0 || Number(ap?.hints_used||0)>0 || sp?.status==='in_progress')return {key:'practice',label:'En práctica'};
    if(sp || ap?.status==='not_started')return {key:'visited',label:'Visitada'};
    return {key:'pending',label:'Pendiente'};
  }

  function routeHTML(data){
    const spMap=new Map((data.session_progress||[]).map(x=>[Number(x.session_number),x]));
    const apMap=new Map((data.activity_progress||[]).map(x=>[x.activity_code,x]));
    const cur=currentSession();
    const grouped={};ROUTE.forEach(r=>(grouped[r.module] ||= []).push(r));
    return Object.entries(grouped).map(([mod,items])=>{
      const rows=items.map(r=>{
        const st=deriveStatus(r,spMap,apMap),sp=spMap.get(r.n),ap=apMap.get(r.activity);
        const details=[];
        if(Number(sp?.active_seconds||0)>0)details.push(formatTime(sp.active_seconds));
        if(Number(ap?.attempts||0)>0)details.push(`${ap.attempts} ${Number(ap.attempts)===1?'intento':'intentos'}`);
        if(r.n===cur)details.unshift('Estás aquí');
        return `<a class="al-row ${st.key}${r.n===cur?' current':''}" href="${new URL(r.path,ROOT).href}"><span class="al-num">${r.n}</span><span><span class="al-title">${esc(r.title)}</span><span class="al-sub">${esc(r.module)}${details.length?' · '+esc(details.join(' · ')):''}</span></span><span class="al-state ${st.key}">${st.label}</span><span class="al-chevron">›</span></a>`;
      }).join('');
      return `<section class="al-module"><div class="al-module-head"><b>${mod}</b><span>${esc(MODULES[mod]||'')}</span></div><div class="al-route">${rows}</div></section>`;
    }).join('');
  }

  async function renderPanel(){
    if(!overlay)return;const body=overlay.querySelector('#al-body');updateButton();
    if(!me){
      body.innerHTML=`<section class="al-card"><h3>Guarda tu progreso</h3><p>Inicia sesión para conservar retos logrados, intentos, pistas y tiempo activo entre dispositivos.</p><div class="al-login-note"><b>Qué se registra:</b> progreso de aprendizaje y actividad académica. El tiempo no se usa como nota automática.</div><form class="al-form" id="al-login" style="margin-top:10px"><input class="al-input" name="username" autocomplete="username" placeholder="Usuario" required><input class="al-input" type="password" name="password" autocomplete="current-password" placeholder="Contraseña" required><button class="al-btn" type="submit">Iniciar sesión</button><div class="al-error" id="al-login-error"></div></form></section><section class="al-card"><h3>Sin iniciar sesión</h3><p class="al-muted">Puedes seguir usando las presentaciones y laboratorios, pero el registro central no se sincroniza.</p><a class="al-btn alt" href="${new URL('learning-hub.html',ROOT).href}">Abrir centro de aprendizaje</a></section>`;
      const form=body.querySelector('#al-login');form.onsubmit=async e=>{e.preventDefault();const err=body.querySelector('#al-login-error');err.className='al-error';const fd=new FormData(form);const submit=form.querySelector('button');submit.disabled=true;submit.textContent='Entrando…';try{await login(fd.get('username'),fd.get('password'));}catch(ex){err.textContent=ex.message;err.className='al-error show';submit.disabled=false;submit.textContent='Iniciar sesión';}};
      return;
    }

    body.innerHTML='<div class="al-skeleton">Actualizando progreso…</div>';
    let data;
    try{data=await dashboard('me',true);}catch(ex){body.innerHTML=`<section class="al-card"><div class="al-error show">${esc(ex.message)}</div><button class="al-btn" id="al-retry">Reintentar</button></section>`;body.querySelector('#al-retry').onclick=renderPanel;return;}

    const summary=data.summary||{};
    const completed=Number(summary.activities_completed||0),pct=Math.round(100*completed/ROUTE.length);
    const spMap=new Map((data.session_progress||[]).map(x=>[Number(x.session_number),x]));
    const apMap=new Map((data.activity_progress||[]).map(x=>[x.activity_code,x]));
    const next=ROUTE.find(r=>deriveStatus(r,spMap,apMap).key!=='done');
    const teacher=['teacher','admin'].includes(me.role);

    body.innerHTML=`
      <section class="al-card al-overview"><div class="al-overview-top"><div><h3>Tu progreso</h3><div class="al-overview-note">Un reto cuenta como logrado solo cuando su actividad requerida se valida correctamente.</div></div><div class="al-big">${completed}<small> / ${ROUTE.length}</small></div></div><div class="al-progressbar"><i style="width:${pct}%"></i></div><div class="al-grid"><div class="al-metric"><b>${pct}%</b><span>ruta lograda</span></div><div class="al-metric"><b>${formatTime(summary.active_seconds||0)}</b><span>tiempo activo</span></div><div class="al-metric"><b>${Number(summary.attempts||0)}</b><span>intentos</span></div></div>${next?`<a class="al-next" href="${new URL(next.path,ROOT).href}"><span>▶</span><span><b>Continuar con S${next.n}</b><span>${esc(next.title)}</span></span><span class="al-next-arrow">›</span></a>`:'<div class="al-next"><span>🏁</span><span><b>Ruta completada</b><span>Ya tienes las 16 actividades requeridas.</span></span></div>'}</section>
      <section class="al-card"><h3>Ruta de aprendizaje</h3><p class="al-muted">Los estados significan: logrado = validado; en práctica = ya intentaste; visitada = abriste la sesión; pendiente = todavía sin evidencia.</p><div class="al-legend"><span><i class="al-dot done"></i>Logrado</span><span><i class="al-dot practice"></i>En práctica</span><span><i class="al-dot visited"></i>Visitada</span><span><i class="al-dot pending"></i>Pendiente</span></div>${routeHTML(data)}</section>
      <section class="al-card al-account"><div class="al-account-line"><div class="al-user"><b>${esc(me.display_name||me.username)}</b><span>@${esc(me.username)} · ${esc(me.role)}</span></div><button class="al-btn alt" id="al-logout">Cerrar sesión</button></div><details class="al-details"><summary>Cambiar contraseña</summary><p class="al-password-help">Usa al menos 8 caracteres. Al cambiarla se cerrarán las otras sesiones abiertas de tu cuenta.</p><form class="al-form" id="al-password"><input class="al-input" type="password" name="current" autocomplete="current-password" placeholder="Contraseña actual" required><input class="al-input" type="password" name="next" autocomplete="new-password" minlength="8" maxlength="72" placeholder="Nueva contraseña" required><input class="al-input" type="password" name="repeat" autocomplete="new-password" minlength="8" maxlength="72" placeholder="Repite la nueva contraseña" required><button class="al-btn good" type="submit">Actualizar contraseña</button><div class="al-error" id="al-password-error"></div><div class="al-success" id="al-password-ok"></div></form></details><div class="al-actions"><a class="al-btn alt" href="${new URL('learning-hub.html',ROOT).href}">Centro de aprendizaje</a>${teacher?`<a class="al-btn alt" href="${new URL('teacher-dashboard.html',ROOT).href}">Panel docente</a>`:''}</div><div class="al-footnote">Privacidad: se registran eventos académicos mínimos para mostrar progreso y apoyar la enseñanza; no se registra cada tecla.</div></section>`;

    body.querySelector('#al-logout').onclick=logout;
    const pf=body.querySelector('#al-password');
    pf.onsubmit=async e=>{
      e.preventDefault();const fd=new FormData(pf),cur=String(fd.get('current')||''),nextp=String(fd.get('next')||''),repeat=String(fd.get('repeat')||'');
      const err=body.querySelector('#al-password-error'),ok=body.querySelector('#al-password-ok'),submit=pf.querySelector('button');err.className='al-error';ok.className='al-success';
      if(nextp!==repeat){err.textContent='Las nuevas contraseñas no coinciden.';err.className='al-error show';return;}
      if(nextp.length<8){err.textContent='La nueva contraseña debe tener al menos 8 caracteres.';err.className='al-error show';return;}
      submit.disabled=true;submit.textContent='Actualizando…';
      try{await changePassword(cur,nextp);pf.reset();ok.textContent='✓ Contraseña actualizada. Las demás sesiones abiertas fueron cerradas.';ok.className='al-success show';}
      catch(ex){err.textContent=ex.message;err.className='al-error show';}
      finally{submit.disabled=false;submit.textContent='Actualizar contraseña';}
    };
  }

  function installToolkitBridge(){
    if(window.__ANDES_LMS_TOOLKIT_BRIDGE__)return;window.__ANDES_LMS_TOOLKIT_BRIDGE__=true;
    const native=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      let before=null;if(this===localStorage && key===TOOLKIT_STORE)before=readJSON(TOOLKIT_STORE,{}) || {};
      const result=native.apply(this,arguments);
      if(this===localStorage && key===TOOLKIT_STORE){
        let after={};try{after=JSON.parse(String(value))||{};}catch{}
        const oldC=before?.completed||{},newC=after?.completed||{};
        for(const mission of Object.keys(newC))if(!oldC[mission]){
          const r=routeForActivity(mission);complete(mission,1,{source:'interactive-tools',verified:true},r?.n||currentSession());
          window.dispatchEvent(new CustomEvent('andesdb:challenge-completed',{detail:{activity:mission,session:r?.n||currentSession()}}));
        }
      }
      return result;
    };
  }

  function installInteractionTracking(){
    const touch=()=>{lastInteraction=Date.now()};['pointerdown','keydown','scroll','touchstart'].forEach(ev=>addEventListener(ev,touch,{passive:true}));
    document.addEventListener('click',e=>{
      const el=e.target.closest?.('button,a,[role="button"]');if(!el)return;
      const id=el.id||null;
      if(id==='at-check')attempt(currentActivity(),{source:'interactive-tools'});
      if(id==='at-hint')hint(currentActivity(),{source:'interactive-tools'});
      if(id==='andes-toolkit-btn')track('lab_opened',{source:'interactive-tools'},{activity_code:currentActivity()});
    },true);
    const observer=new MutationObserver(()=>{
      const slide=getSlideNumber();if(slide && slide!==lastSlide){lastSlide=slide;track('slide_viewed',{}, {slide_number:slide});}
    });
    observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','hidden']});
  }

  function installHeartbeat(){
    const s=currentSession();if(s)track('page_opened',{path:location.pathname});
    lastSlide=getSlideNumber();if(lastSlide)track('slide_viewed',{}, {slide_number:lastSlide});
    setInterval(()=>{
      const now=Date.now();const visible=document.visibilityState==='visible';const active=now-lastInteraction<90000;const elapsed=Math.max(0,Math.min(30,Math.round((now-lastHeartbeat)/1000)));lastHeartbeat=now;
      if(visible && active && elapsed>0)track('heartbeat',{}, {active_seconds_delta:elapsed});
      flushPending();
    },30000);
    addEventListener('visibilitychange',()=>{lastInteraction=Date.now();lastHeartbeat=Date.now();if(document.visibilityState==='visible')track('page_opened',{resume:true});});
    addEventListener('pagehide',()=>track('page_closed',{reason:'pagehide'}));
  }

  window.ANDES_LMS={version:'2.0.0',ROOT,ROUTE,ready:()=>readyPromise,user:()=>me,login,logout,changePassword,track,attempt,hint,fail,complete,dashboard,open:async()=>{overlay?.classList.add('open');overlay?.querySelector('.al-panel')?.scrollTo(0,0);await renderPanel();},currentSession,currentActivity};

  async function init(){
    installStyles();installUI();installToolkitBridge();installInteractionTracking();installHeartbeat();
    await validateAuth();
    if(me){try{await dashboard('me',true);}catch{}}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();