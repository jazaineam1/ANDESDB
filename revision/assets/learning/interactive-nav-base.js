(() => {
  'use strict';

  const STORE = 'andesdb.revision.toolkit.v1';
  const script = document.currentScript || [...document.scripts].find(s => /interactive-nav\.js(?:\?|$)/.test(s.src));
  if (!script || window.self !== window.top) return;
  const ROOT = new URL('../../', script.src);

  const ROUTE = [
    {s:2,  mission:'sql-s2',       title:'SELECT, WHERE, ORDER BY y LIMIT', path:'Presentaciones/M2/sesion-2-bases-de-datos-y-primeras-consultas.html'},
    {s:3,  mission:'sql-s3',       title:'GROUP BY y HAVING',              path:'Presentaciones/M2/sesion-3-filtros-y-agregaciones.html'},
    {s:4,  mission:'sql-s4',       title:'JOIN sin perder filas',          path:'Presentaciones/M2/sesion-4-uniones-de-tablas.html'},
    {s:5,  mission:'sql-s5',       title:'Control del grano',              path:'Presentaciones/M2/sesion-5-algoritmica-de-tablas.html'},
    {s:7,  mission:'erd-s7',       title:'Cardinalidades y modelo ER',      path:'Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html'},
    {s:8,  mission:'erd-s8',       title:'Cardinalidad bajo supuestos',     path:'Presentaciones/M3/sesion-8-modelado-y-normalizacion.html'},
    {s:10, mission:'decision-s10', title:'Selector SQL / NoSQL',           path:'Presentaciones/M4/sesion-10-sql-o-nosql.html'},
    {s:12, mission:'warehouse-s12',title:'Grano y esquema estrella',        path:'Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html'},
    {s:13, mission:'bigquery-s13', title:'Partición, clustering y bytes',   path:'Presentaciones/M5/sesion-13-laboratorio-bigquery.html'},
    {s:14, mission:'unnest-s14',   title:'UNNEST y cambio de grano',        path:'Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html'}
  ];

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

  function injectStyles() {
    if (document.getElementById('andes-toolkit-nav-css')) return;
    const s = document.createElement('style');
    s.id = 'andes-toolkit-nav-css';
    s.textContent = `
.at-route{border:1px solid #cbd5e1;border-radius:14px;padding:13px 14px;background:#f8fafc;display:grid;gap:10px}
.at-route-top{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.at-route-kicker{font-size:12px;font-weight:900;color:#475569;text-transform:uppercase;letter-spacing:.05em}
.at-route-title{font-weight:900;color:#0f172a}.at-route-dots{display:flex;gap:5px;flex-wrap:wrap}
.at-route-dot{width:22px;height:22px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;color:#64748b;font:800 10px/1 system-ui;display:grid;place-items:center}
.at-route-dot.done{background:#dcfce7;border-color:#86efac;color:#166534}.at-route-dot.current{outline:3px solid #facc15;outline-offset:1px}
.at-route-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.at-route-actions .at-route-spacer{flex:1}
.at-route-btn{border:0;border-radius:10px;padding:10px 13px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:inherit}
.at-route-btn.prev{background:#e2e8f0;color:#0f172a}.at-route-btn.next{background:#166534;color:#fff}.at-route-btn.next.locked{background:#cbd5e1;color:#64748b;cursor:not-allowed}.at-route-btn.finish{background:#166534;color:#fff;cursor:default}
.at-route-note{font-size:12px;color:#64748b}.at-route-note strong{color:#166534}.at-route-ready{animation:atPulse .7s ease 2}@keyframes atPulse{50%{box-shadow:0 0 0 5px #86efac55}}
@media(max-width:760px){.at-route-actions{display:grid;grid-template-columns:1fr 1fr}.at-route-actions .at-route-spacer{display:none}.at-route-btn{width:100%}.at-route-btn.finish{grid-column:1/-1}}
`;
    document.head.appendChild(s);
  }

  function targetURL(item) {
    const u = new URL(item.path, ROOT);
    u.searchParams.set('lab', '1');
    return u.href;
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
    const dots = ROUTE.map((item, i) => `<span class="at-route-dot${done(item)?' done':''}${i===index?' current':''}" title="S${item.s} · ${item.title}">${i + 1}</span>`).join('');

    let nextControl;
    if (!next) {
      nextControl = isDone
        ? `<span class="at-route-btn finish">✓ Ruta completada · ${count}/${ROUTE.length}</span>`
        : `<button class="at-route-btn next locked" type="button" disabled>Completa este reto para terminar</button>`;
    } else if (isDone) {
      nextControl = `<a class="at-route-btn next" data-route-next href="${targetURL(next)}">Siguiente laboratorio → S${next.s}</a>`;
    } else {
      nextControl = `<button class="at-route-btn next locked" type="button" disabled>Completa este reto para avanzar</button>`;
    }

    route.innerHTML = `
      <div class="at-route-top">
        <div><div class="at-route-kicker">Ruta de laboratorios · reto ${index + 1} de ${ROUTE.length}</div><div class="at-route-title">S${here.s} · ${here.title}</div></div>
        <div class="at-route-dots" aria-label="Progreso de laboratorios">${dots}</div>
      </div>
      <div class="at-route-actions">
        ${prev ? `<a class="at-route-btn prev" href="${targetURL(prev)}">← S${prev.s}</a>` : '<span></span>'}
        <span class="at-route-spacer"></span>
        ${nextControl}
      </div>
      <div class="at-route-note">${isDone ? `<strong>✓ Reto logrado.</strong> Puedes continuar sin cerrar el laboratorio.` : 'Al validar correctamente se habilitará el siguiente laboratorio.'}</div>`;

    if (isDone) route.classList.add('at-route-ready');
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
      } else if (++tries > 60) clearInterval(timer);
    }, 100);
  }

  function init() {
    injectStyles();
    renderRoute();
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'attributes' || m.addedNodes.length || m.removedNodes.length)) renderRoute();
    });
    observer.observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['hidden','class']});
    addEventListener('storage', e => { if (e.key === STORE) renderRoute(); });
    autoOpen();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
