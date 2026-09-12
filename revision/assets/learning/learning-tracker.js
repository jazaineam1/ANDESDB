(() => {
  'use strict';

  if (window.ANDES_LMS?.version) return;

  const script = document.currentScript || [...document.scripts].find(s => /learning-tracker\.js(?:\?|$)/.test(s.src));
  if (!script) return;
  const ROOT = new URL('../../', script.src);
  const API = 'https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1';
  const STORE = 'andesdb.lms.auth.v1';
  const LOCAL = 'andesdb.lms.local.v1';

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

  function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function currentSession() {
    const m = (location.pathname + ' ' + document.title).match(/sesion[-_\s]*(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }
  function currentActivity() { return ROUTE.find(r => r.n === currentSession())?.activity || null; }
  function readAuth() { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { return null; } }
  function writeAuth(v) { try { v ? localStorage.setItem(STORE, JSON.stringify(v)) : localStorage.removeItem(STORE); } catch {} }
  function readLocal() { try { return JSON.parse(localStorage.getItem(LOCAL) || '{}'); } catch { return {}; } }
  function writeLocal(v) { try { localStorage.setItem(LOCAL, JSON.stringify(v)); } catch {} }
  function formatTime(seconds) {
    seconds = Math.max(0, Number(seconds || 0));
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
    return h ? `${h} h ${m} min` : `${m} min`;
  }

  let auth = readAuth();
  let me = auth?.user || null;
  let dashboardCache = null;
  let lastInteraction = Date.now();
  let lastHeartbeat = Date.now();
  let lastSlide = null;
  let overlay = null;
  let button = null;
  const completedSeen = new Set();
  const pending = [];

  let readyResolve;
  const readyPromise = new Promise(r => readyResolve = r);

  async function call(path, opts = {}) {
    const headers = { 'Content-Type':'application/json', ...(opts.headers || {}) };
    if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
    const res = await fetch(`${API}/${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) { auth = null; me = null; writeAuth(null); }
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  }

  async function login(username, password) {
    const data = await call('learning-auth', { method:'POST', body:JSON.stringify({ action:'login', username, password }) });
    auth = { token:data.token, expires_at:data.expires_at, auth_session_id:data.auth_session_id, user:data.user };
    me = data.user; writeAuth(auth); dashboardCache = null;
    await track('page_opened', { source:'login' }, { force:true });
    renderPanel();
    return me;
  }

  async function logout() {
    try { if (auth?.token) await call('learning-auth', { method:'POST', body:JSON.stringify({ action:'logout' }) }); } catch {}
    auth = null; me = null; dashboardCache = null; writeAuth(null); renderPanel();
  }

  async function validateAuth() {
    if (!auth?.token) { readyResolve(null); return null; }
    try {
      const data = await call('learning-auth', { method:'POST', body:JSON.stringify({ action:'me' }) });
      me = data.user;
      auth.user = me; auth.expires_at = data.expires_at; auth.auth_session_id = data.auth_session_id; writeAuth(auth);
      readyResolve(me);
      return me;
    } catch {
      auth = null; me = null; writeAuth(null); readyResolve(null); return null;
    }
  }

  function localComplete(activity, score = 1) {
    const x = readLocal();
    x.completed ||= {}; x.completed[activity] = { at:new Date().toISOString(), score };
    writeLocal(x);
  }

  async function track(event_type, metadata = {}, overrides = {}) {
    const session_number = overrides.session_number ?? currentSession();
    const activity_code = overrides.activity_code ?? null;
    const slide_number = overrides.slide_number ?? getSlideNumber();
    const active_seconds_delta = overrides.active_seconds_delta ?? 0;
    const event = { event_type, session_number, activity_code, slide_number, active_seconds_delta, metadata, client_at:new Date().toISOString() };
    if (!auth?.token && !overrides.force) { pending.push(event); if (pending.length > 30) pending.shift(); return false; }
    if (!auth?.token) return false;
    try {
      await call('learning-track', { method:'POST', body:JSON.stringify(event), keepalive:true });
      return true;
    } catch { return false; }
  }

  async function flushPending() {
    if (!auth?.token || !pending.length) return;
    const events = pending.splice(0, 20);
    try { await call('learning-track', { method:'POST', body:JSON.stringify({ events }), keepalive:true }); }
    catch { pending.unshift(...events); }
  }

  async function attempt(activity = currentActivity(), metadata = {}, session_number = currentSession()) {
    if (!activity) return;
    await track('challenge_attempt', metadata, { activity_code:activity, session_number });
  }
  async function hint(activity = currentActivity(), metadata = {}, session_number = currentSession()) {
    if (!activity) return;
    await track('hint_requested', metadata, { activity_code:activity, session_number });
  }
  async function fail(activity = currentActivity(), metadata = {}, session_number = currentSession()) {
    if (!activity) return;
    await track('challenge_failed', metadata, { activity_code:activity, session_number });
  }
  async function complete(activity = currentActivity(), score = 1, metadata = {}, session_number = null) {
    if (!activity) return;
    const route = ROUTE.find(r => r.activity === activity);
    session_number ??= route?.n ?? currentSession();
    localComplete(activity, score);
    completedSeen.add(activity);
    await track('challenge_completed', { score, ...metadata }, { activity_code:activity, session_number });
    dashboardCache = null;
    if (overlay?.classList.contains('open')) await renderPanel();
  }

  async function dashboard(scope = 'me', fresh = false) {
    if (!auth?.token) throw new Error('Debes iniciar sesión');
    if (scope === 'me' && dashboardCache && !fresh) return dashboardCache;
    const data = await call(`learning-dashboard?scope=${encodeURIComponent(scope)}`, { method:'GET' });
    if (scope === 'me') dashboardCache = data;
    return data;
  }

  function getSlideNumber() {
    const slides = [...document.querySelectorAll('.slide')];
    if (slides.length) {
      const i = slides.findIndex(s => s.classList.contains('active'));
      if (i >= 0) return i + 1;
    }
    const reveal = [...document.querySelectorAll('.reveal .slides section')];
    if (reveal.length) {
      const i = reveal.findIndex(s => s.classList.contains('present'));
      if (i >= 0) return i + 1;
    }
    const txt = document.querySelector('#count,[data-slide-count],.slide-number')?.textContent || '';
    const m = txt.match(/(\d+)\s*(?:\/|of)/i); return m ? Number(m[1]) : null;
  }

  function installStyles() {
    if (document.getElementById('andes-lms-css')) return;
    const st = document.createElement('style'); st.id='andes-lms-css';
    st.textContent = `
#andes-learning-btn{position:fixed;left:12px;bottom:12px;z-index:2147481800;border:1px solid #ffffff55;background:#111827ee;color:#fff;border-radius:999px;padding:10px 14px;font:800 12px/1.1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 8px 28px #0005;cursor:pointer;backdrop-filter:blur(8px)}
#andes-learning-btn b{color:#ffd600}.al-overlay{position:fixed;inset:0;z-index:2147483600;background:#000b;display:none;align-items:stretch;justify-content:flex-end;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111827}.al-overlay.open{display:flex}.al-panel{width:min(520px,100vw);height:100vh;overflow:auto;background:#f8fafc;box-shadow:-20px 0 60px #0007}.al-head{position:sticky;top:0;z-index:3;background:#111827;color:#fff;padding:16px;display:flex;gap:10px;align-items:center}.al-head h2{font-size:17px;margin:0;flex:1}.al-close{border:1px solid #ffffff55;background:#ffffff12;color:#fff;border-radius:10px;padding:7px 10px;font-size:18px;cursor:pointer}.al-body{padding:16px;display:grid;gap:13px}.al-card{background:#fff;border:1px solid #dbe1e8;border-radius:15px;padding:14px}.al-card h3{margin:0 0 8px;font-size:16px}.al-muted{font-size:12px;color:#64748b}.al-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.al-metric{background:#f1f5f9;border-radius:11px;padding:10px;text-align:center}.al-metric b{display:block;font-size:18px}.al-form{display:grid;gap:9px}.al-input{width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:10px;font:inherit}.al-btn{border:0;border-radius:10px;padding:9px 12px;background:#111827;color:#fff;font-weight:800;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.al-btn.alt{background:#e5e7eb;color:#111827}.al-btn.good{background:#166534}.al-actions{display:flex;gap:8px;flex-wrap:wrap}.al-route{display:grid;gap:7px}.al-row{display:grid;grid-template-columns:36px 1fr auto;gap:9px;align-items:center;border:1px solid #e2e8f0;border-radius:11px;padding:8px;text-decoration:none;color:#111827;background:#fff}.al-row:hover{border-color:#94a3b8}.al-num{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#e2e8f0;font-size:12px;font-weight:900}.al-row.done .al-num{background:#166534;color:#fff}.al-row.current{border-color:#eab308;background:#fffbea}.al-state{font-size:11px;font-weight:900;white-space:nowrap}.al-state.done{color:#166534}.al-state.progress{color:#a16207}.al-login-note{border-left:4px solid #eab308;background:#fffbeb;padding:10px;border-radius:8px;font-size:12px}.al-error{background:#fee2e2;color:#7f1d1d;border-radius:9px;padding:9px;font-size:13px;display:none}.al-error.show{display:block}
@media(max-width:760px){#andes-learning-btn{left:8px;bottom:8px}.al-panel{width:100vw}.al-grid{grid-template-columns:1fr 1fr}.al-overlay{justify-content:center}}
`;
    document.head.appendChild(st);
  }

  function installUI() {
    if (document.getElementById('andes-learning-btn')) return;
    button = document.createElement('button'); button.id='andes-learning-btn'; button.type='button';
    button.innerHTML='🎓 <span>Mi aprendizaje</span>';
    document.body.appendChild(button);
    overlay=document.createElement('div'); overlay.className='al-overlay'; overlay.id='andes-learning-overlay';
    overlay.innerHTML='<aside class="al-panel" role="dialog" aria-modal="true"><div class="al-head"><h2>🎓 Mi aprendizaje · ANDESDB</h2><button class="al-close" aria-label="Cerrar">×</button></div><div class="al-body" id="al-body"></div></aside>';
    document.body.appendChild(overlay);
    button.onclick=async()=>{overlay.classList.add('open'); await renderPanel();};
    overlay.querySelector('.al-close').onclick=()=>overlay.classList.remove('open');
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('open')});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.classList.remove('open')});
    updateButton();
  }

  function updateButton() {
    if (!button) return;
    const name = me?.display_name || me?.username;
    button.innerHTML = name ? `🎓 <span>${esc(name.split(' ')[0])}</span>` : '🎓 <span>Mi aprendizaje</span>';
  }

  async function renderPanel() {
    if (!overlay) return;
    const body=overlay.querySelector('#al-body'); updateButton();
    if (!me) {
      body.innerHTML=`<div class="al-card"><h3>Sincroniza tu progreso</h3><p>Inicia sesión para guardar tiempo activo, intentos, pistas y retos logrados entre dispositivos.</p><form class="al-form" id="al-login"><input class="al-input" name="username" autocomplete="username" placeholder="Usuario" required><input class="al-input" type="password" name="password" autocomplete="current-password" placeholder="Contraseña" required><div class="al-error" id="al-login-error"></div><button class="al-btn" type="submit">Entrar</button></form></div><div class="al-login-note"><b>Privacidad.</b> Se registra progreso, interacción académica y tiempo activo. No se usa el tiempo como calificación automática.</div><div class="al-card"><h3>También puedes practicar sin cuenta</h3><p class="al-muted">Los retos opcionales pueden funcionar localmente, pero no aparecerán en el panel docente hasta iniciar sesión.</p><a class="al-btn alt" href="${new URL('learning-hub.html',ROOT).href}">Abrir centro de aprendizaje</a></div>`;
      const form=body.querySelector('#al-login'); form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form);const err=body.querySelector('#al-login-error');err.className='al-error';try{await login(fd.get('username'),fd.get('password'));await flushPending();}catch(ex){err.textContent=ex.message;err.className='al-error show';}};
      return;
    }
    body.innerHTML='<div class="al-card"><b>Cargando progreso…</b></div>';
    let data;
    try { data=await dashboard('me',true); } catch(ex) { body.innerHTML=`<div class="al-card"><h3>No se pudo cargar</h3><p>${esc(ex.message)}</p></div>`; return; }
    const aps=new Map((data.activity_progress||[]).map(x=>[x.activity_code,x]));
    const sps=new Map((data.session_progress||[]).map(x=>[Number(x.session_number),x]));
    const local=readLocal().completed||{};
    const done=ROUTE.filter(r=>aps.get(r.activity)?.status==='completed'||local[r.activity]).length;
    const s=currentSession();
    const route=ROUTE.map(r=>{
      const ap=aps.get(r.activity), sp=sps.get(r.n); const isDone=ap?.status==='completed'||!!local[r.activity]; const inProgress=!isDone&&(ap||sp);
      const state=isDone?'✓ logrado':inProgress?'en curso':'pendiente';
      return `<a class="al-row ${isDone?'done':''} ${r.n===s?'current':''}" href="${new URL(r.path,ROOT).href}"><span class="al-num">${r.n}</span><span><b>${esc(r.title)}</b><br><span class="al-muted">${esc(r.module)}${sp?.active_seconds?` · ${formatTime(sp.active_seconds)}`:''}</span></span><span class="al-state ${isDone?'done':inProgress?'progress':''}">${state}</span></a>`;
    }).join('');
    const summary=data.summary||{};
    body.innerHTML=`<div class="al-card"><div style="display:flex;align-items:center;gap:10px"><div style="flex:1"><h3 style="margin:0">${esc(me.display_name||me.username)}</h3><span class="al-muted">${esc(me.role)}</span></div><button class="al-btn alt" id="al-logout">Salir</button></div></div><div class="al-grid"><div class="al-metric"><b>${done}/16</b><span class="al-muted">retos</span></div><div class="al-metric"><b>${formatTime(summary.active_seconds)}</b><span class="al-muted">tiempo activo</span></div><div class="al-metric"><b>${summary.attempts||0}</b><span class="al-muted">intentos</span></div></div><div class="al-card"><h3>Ruta de aprendizaje</h3><div class="al-route">${route}</div></div><div class="al-card"><h3>Practicar y reforzar</h3><p class="al-muted">Micro-laboratorios adicionales para conceptos que antes no tenían reto autocorregible.</p><div class="al-actions"><a class="al-btn good" href="${new URL('learning-hub.html',ROOT).href}">Centro de aprendizaje</a>${['teacher','admin'].includes(me.role)?`<a class="al-btn alt" href="${new URL('teacher-dashboard.html',ROOT).href}">Panel docente</a>`:''}</div></div><div class="al-login-note">El contador usa <b>tiempo activo</b>: una pestaña abandonada no suma indefinidamente.</div>`;
    body.querySelector('#al-logout').onclick=logout;
  }

  function installInteractionTracking() {
    const touch=()=>{lastInteraction=Date.now()};
    ['pointerdown','keydown','scroll','touchstart'].forEach(ev=>addEventListener(ev,touch,{passive:true}));
    document.addEventListener('click',e=>{
      const el=e.target.closest?.('button,a,[role="button"]'); if(!el)return;
      const id=el.id||null, text=(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,100);
      if(id==='at-check') attempt(currentActivity(),{source:'interactive-tools'});
      if(id==='at-hint') hint(currentActivity(),{source:'interactive-tools'});
      if(id==='andes-toolkit-btn') track('lab_opened',{source:'interactive-tools'},{activity_code:currentActivity()});
      if(id || text) track('ui_action',{id,text,tag:el.tagName.toLowerCase()});
    },true);

    const observe = new MutationObserver(() => {
      const slide=getSlideNumber();
      if(slide && slide!==lastSlide){lastSlide=slide;track('slide_viewed',{}, {slide_number:slide});}
      const a=currentActivity(); if(!a || completedSeen.has(a))return;
      const ok=[...document.querySelectorAll('.at-feedback.ok,.at-complete')].some(el=>!el.hidden && /correcto|reto logrado|completado|modelo coherente|correct/i.test(el.textContent||''));
      if(ok) complete(a,1,{source:'interactive-tools'});
    });
    observe.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  }

  function installHeartbeat() {
    setInterval(async()=>{
      const now=Date.now();
      if(document.visibilityState==='visible' && now-lastInteraction<90000){
        const delta=Math.min(30,Math.max(1,Math.round((now-lastHeartbeat)/1000)));
        lastHeartbeat=now;
        await track('heartbeat',{}, {active_seconds_delta:delta});
      } else lastHeartbeat=now;
    },30000);
    addEventListener('visibilitychange',()=>{lastInteraction=Date.now(); if(document.visibilityState==='visible'){lastHeartbeat=Date.now();track('page_opened',{resume:true});}});
    addEventListener('pagehide',()=>{track('page_closed',{reason:'pagehide'},{active_seconds_delta:0});});
  }

  window.ANDES_LMS = {
    version:'1.0.0', ROOT, ROUTE,
    ready:()=>readyPromise,
    user:()=>me,
    login, logout, track, attempt, hint, fail, complete, dashboard,
    open:async()=>{overlay?.classList.add('open');await renderPanel();},
    currentSession, currentActivity,
  };

  function init() {
    installStyles(); installUI(); installInteractionTracking(); installHeartbeat();
    validateAuth().then(async user=>{
      updateButton();
      if(user){await track('page_opened',{title:document.title,path:location.pathname});await flushPending();}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
