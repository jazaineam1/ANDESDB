(() => {
  'use strict';

  const STORE = 'andesdb.revision.toolkit.v1';
  const script = document.currentScript || [...document.scripts].find(s => /interactive-nav(?:-base)?\.js(?:\?|$)/.test(s.src));
  if (!script || window.self !== window.top) return;
  const ROOT = new URL('../../', script.src);

  const ROUTE = [
    {s:2,  mission:'sql-s2',        title:'SELECT, WHERE, ORDER BY y LIMIT', path:'Presentaciones/M2/sesion-2-bases-de-datos-y-primeras-consultas.html'},
    {s:3,  mission:'sql-s3',        title:'GROUP BY y HAVING',               path:'Presentaciones/M2/sesion-3-filtros-y-agregaciones.html'},
    {s:4,  mission:'sql-s4',        title:'JOIN sin perder filas',           path:'Presentaciones/M2/sesion-4-uniones-de-tablas.html'},
    {s:5,  mission:'sql-s5',        title:'Control del grano',               path:'Presentaciones/M2/sesion-5-algoritmica-de-tablas.html'},
    {s:7,  mission:'erd-s7',        title:'Cardinalidades y modelo ER',       path:'Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html'},
    {s:8,  mission:'erd-s8',        title:'Cardinalidad bajo supuestos',      path:'Presentaciones/M3/sesion-8-modelado-y-normalizacion.html'},
    {s:10, mission:'decision-s10',  title:'Selector SQL / NoSQL',            path:'Presentaciones/M4/sesion-10-sql-o-nosql.html'},
    {s:12, mission:'warehouse-s12', title:'Grano y esquema estrella',        path:'Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html'},
    {s:13, mission:'bigquery-s13',  title:'Partición, clustering y bytes',    path:'Presentaciones/M5/sesion-13-laboratorio-bigquery.html'},
    {s:14, mission:'unnest-s14',    title:'UNNEST y cambio de grano',        path:'Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html'}
  ];
  const EXTRA = new Map([
    [5, {s:6, label:'S6 · reglas de negocio', focus:'s6-reglas-evidencia'}],
    [8, {s:9, label:'S9 · constraints', focus:'s9-constraints'}],
    [10,{s:11,label:'S11 · documentos', focus:'s11-documentos'}],
    [14,{s:15,label:'S15 · integrador', focus:'s15-integrador'}]
  ]);

  function currentSession() {
    const m = (location.pathname + ' ' + document.title).match(/sesion[-_\s]*(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }
  const session = currentSession();
  const index = ROUTE.findIndex(x => x.s === session);
  if (index < 0) return;
  const here = ROUTE[index];

  function state() {
    try {
      const x = JSON.parse(localStorage.getItem(STORE) || '{}');
      return x && typeof x === 'object' ? x : {};
    } catch (_) { return {}; }
  }
  function done(item = here) { return Boolean(state().completed?.[item.mission]); }
  function completedCount() { return ROUTE.filter(done).length; }
  function targetURL(item) {
    const u = new URL(item.path, ROOT);
    u.searchParams.set('lab', '1');
    return u.href;
  }
  function hubURL(focus) {
    const u = new URL('learning-hub.html', ROOT);
    if (focus) u.searchParams.set('focus', focus);
    return u.href;
  }

  function injectStyles() {
    if (document.getElementById('andes-toolkit-nav-css')) return;
    const s = document.createElement('style');
    s.id = 'andes-toolkit-nav-css';
    s.textContent = `
.at-route{border:1px solid #cbd5e1;border-radius:14px;padding:13px 14px;background:#f8fafc;display:grid;gap:11px}
.at-route-top{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.at-route-kicker{font-size:12px;font-weight:900;color:#475569;text-transform:uppercase;letter-spacing:.05em}.at-route-title{font-weight:900;color:#0f172a}.at-route-dots{display:flex;gap:5px;flex-wrap:wrap}
.at-route-dot{width:25px;height:25px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;color:#64748b;font:800 10px/1 system-ui;display:grid;place-items:center;text-decoration:none}.at-route-dot:hover{border-color:#475569}.at-route-dot.done{background:#dcfce7;border-color:#86efac;color:#166534}.at-route-dot.current{outline:3px solid #facc15;outline-offset:1px}
.at-route-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.at-route-actions .at-route-spacer{flex:1}.at-route-btn{border:0;border-radius:10px;padding:10px 13px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:inherit}.at-route-btn.prev{background:#e2e8f0;color:#0f172a}.at-route-btn.next{background:#166534;color:#fff}.at-route-btn.next.pending{background:#124e78}.at-route-btn.hub{background:#fff;color:#0f172a;border:1px solid #cbd5e1}.at-route-btn.finish{background:#166534;color:#fff}.at-route-note{font-size:12px;color:#64748b;line-height:1.45}.at-route-note strong{color:#166534}.at-route-skip{background:#fff7d6;border:1px solid #facc15;border-radius:10px;padding:9px 11px;font-size:12px;color:#6b5400}.at-route-skip a{font-weight:900;color:#6b5400}.at-route-ready{animation:atPulse .7s ease 2}@keyframes atPulse{50%{box-shadow:0 0 0 5px #86efac55}}
@media(max-width:760px){.at-route-actions{display:grid;grid-template-columns:1fr 1fr}.at-route-actions .at-route-spacer{display:none}.at-route-btn{width:100%}.at-route-btn.hub{grid-column:1/-1}.at-route-dots{gap:4px}.at-route-dot{width:24px;height:24px}}
`;
    document.head.appendChild(s);
  }

  function renderRoute() {
    const overlay = document.getElementById('andes-toolkit-overlay');
    const body = overlay?.querySelector('.at-body');
    if (!body) return;

    let route = body.querySelector('.at-route');
    if (!route) {
      route = document.createElement('div');
      route.className = 'at-route';
      const footer = [...body.querySelectorAll('.at-toolbar')].at(-1);
      if (footer) body.insertBefore(route, footer);
      else body.appendChild(route);
    }

    const isDone = done();
    const prev = ROUTE[index - 1];
    const next = ROUTE[index + 1];
    const count = completedCount();
    const signature = ROUTE.map(item => done(item) ? '1' : '0').join('') + ':' + index;
    if (route.dataset.signature === signature) return;
    route.dataset.signature = signature;

    const dots = ROUTE.map((item, i) =>
      `<a class="at-route-dot${done(item)?' done':''}${i===index?' current':''}" href="${targetURL(item)}" title="Abrir S${item.s} · ${item.title}">${i + 1}</a>`
    ).join('');

    const nextControl = next
      ? `<a class="at-route-btn next${isDone?'':' pending'}" data-route-next href="${targetURL(next)}">${isDone?'Siguiente laboratorio':'Continuar igualmente'} → S${next.s}</a>`
      : `<a class="at-route-btn finish" href="${hubURL('s16-dp900')}">Ruta principal terminada → cierre</a>`;

    const skipped = EXTRA.get(here.s);
    const skippedBox = skipped
      ? `<div class="at-route-skip">Entre este laboratorio y el siguiente está <b>${skipped.label}</b>. No lo saltamos pedagógicamente: <a href="${hubURL(skipped.focus)}">abrir su micro-laboratorio</a>.</div>`
      : '';

    route.innerHTML = `
      <div class="at-route-top">
        <div><div class="at-route-kicker">Ruta principal · reto ${index + 1} de ${ROUTE.length} · ${count} logrados</div><div class="at-route-title">S${here.s} · ${here.title}</div></div>
        <div class="at-route-dots" aria-label="Navegar por laboratorios">${dots}</div>
      </div>
      <div class="at-route-actions">
        ${prev ? `<a class="at-route-btn prev" href="${targetURL(prev)}">← S${prev.s}</a>` : '<span></span>'}
        <a class="at-route-btn hub" href="${hubURL()}">Ver las 16 actividades</a>
        <span class="at-route-spacer"></span>
        ${nextControl}
      </div>
      ${skippedBox}
      <div class="at-route-note">${isDone
        ? `<strong>✓ Reto logrado.</strong> El resultado queda marcado, pero la navegación nunca se bloquea.`
        : `<b>Reto pendiente.</b> Puedes continuar, volver luego o abrir cualquier número de la ruta. Completar no es requisito para navegar.`}</div>`;

    if (isDone) route.classList.add('at-route-ready');
    else route.classList.remove('at-route-ready');
  }

  function autoOpen() {
    const u = new URL(location.href);
    if (u.searchParams.get('lab') !== '1') return;
    let tries = 0;
    const timer = setInterval(() => {
      const button = document.getElementById('andes-toolkit-btn');
      if (button) {
        clearInterval(timer);
        button.click();
        u.searchParams.delete('lab');
        history.replaceState(null, '', u.pathname + (u.search ? u.search : '') + u.hash);
      } else if (++tries > 80) clearInterval(timer);
    }, 100);
  }

  function init() {
    injectStyles();
    renderRoute();
    const observer = new MutationObserver(() => renderRoute());
    observer.observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['hidden','class']});
    addEventListener('storage', e => { if (e.key === STORE) renderRoute(); });
    addEventListener('andesdb:challenge-completed', renderRoute);
    autoOpen();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
