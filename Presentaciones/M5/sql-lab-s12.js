(() => {
  'use strict';

  const SQLJS_BASE = new URL('../../assets/vendor/sqljs/', location.href).href;
  const DB_URL = 'Datos/restaurante-abc.db';
  const MAX_ROWS = 200;

  let dbPromise = null;
  let activePreset = null;

  const PRESETS = [
    {
      id: 'pedido4-ingenuo',
      label: 'Ejecutar',
      marker: 'JOIN pedido_mesa pm',
      sql: `SELECT p.pedido_id,
       COUNT(*) AS filas,
       SUM(l.cantidad * l.precio_unitario) AS ingreso_calculado
FROM pedido p
JOIN pedido_mesa pm ON pm.pedido_id = p.pedido_id
JOIN linea_pedido l ON l.pedido_id = p.pedido_id
WHERE p.pedido_id = 4
GROUP BY p.pedido_id;`,
      level: null,
      expected: '368.000, en 6 filas',
      explanation: 'El pedido 4 ocupó dos mesas. pedido_mesa aporta una fila por cada una, y cada línea del pedido se multiplica por esas dos filas antes de sumarse.'
    },
    {
      id: 'pedido4-real',
      label: 'Ejecutar',
      marker: 'AS total',
      sql: `SELECT p.pedido_id,
       SUM(l.cantidad * l.precio_unitario) AS total
FROM pedido p
JOIN linea_pedido l ON l.pedido_id = p.pedido_id
WHERE p.pedido_id = 4
GROUP BY p.pedido_id;`,
      level: null,
      expected: '184.000',
      explanation: 'Sin pasar por pedido_mesa, cada línea se cuenta una sola vez. Este es el número real: coincide con la comprobación 2 de la sesión 9.'
    },
    {
      id: 'count-lineas',
      label: 'Ejecutar',
      marker: 'COUNT(*) FROM linea_pedido',
      sql: `SELECT COUNT(*) FROM linea_pedido;`,
      level: null,
      expected: '10',
      explanation: 'Toda tu base operacional, hoy, cabe en diez líneas. Así de pequeño es un OLTP real antes de que el negocio lleve meses funcionando.'
    }
  ];

  const SANDBOX = {
    id: 'sandbox',
    label: 'Consulta libre',
    sql: `SELECT *\nFROM pedido\nORDER BY pedido_id;`,
    level: null,
    explanation: 'Modo libre de lectura, sobre la misma base de la sesión 9: cliente, mesero, mesa, reserva, plato, ingrediente, receta, pedido, pedido_mesa, linea_pedido, pago.'
  };

  function injectStyles() {
    if (document.getElementById('sqlLabS12Styles')) return;
    const style = document.createElement('style');
    style.id = 'sqlLabS12Styles';
    style.textContent = `
      .sql-lab-actions{display:flex;flex-wrap:wrap;gap:.42em;margin:.48em 0 .15em;align-items:center}
      .sql-lab-run{border:1.5px solid #124e78;background:#e9f4ff;color:#124e78;border-radius:999px;padding:.42em .82em;font:800 .7em/1 "Segoe UI",Arial,sans-serif;cursor:pointer;box-shadow:0 1px 2px rgba(16,24,32,.06)}
      .sql-lab-run:hover,.sql-lab-run:focus-visible{background:#124e78;color:#fff;outline:none}
      .sql-lab-run::before{content:'▶ ';font-size:.9em}
      .sql-lab-overlay{position:fixed;inset:0;z-index:99999;background:rgba(5,14,22,.82);display:none;align-items:center;justify-content:center;padding:2.5vh 2.5vw;backdrop-filter:blur(3px)}
      .sql-lab-overlay.open{display:flex}
      .sql-lab-panel{width:min(1180px,96vw);height:min(820px,94vh);background:#fff;color:#1a1a1a;border-radius:18px;box-shadow:0 26px 80px rgba(0,0,0,.45);display:grid;grid-template-rows:auto 1fr auto;overflow:hidden;font-family:"Segoe UI",Arial,sans-serif}
      .sql-lab-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 1.1rem;border-bottom:1px solid #dfe6ec;background:#f7f9fb}
      .sql-lab-head strong{font-size:1rem;color:#124e78}.sql-lab-head small{display:block;color:#66727d;margin-top:.15rem}
      .sql-lab-close{border:0;background:#17202a;color:#fff;width:2.15rem;height:2.15rem;border-radius:50%;font-size:1.25rem;cursor:pointer}
      .sql-lab-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);min-height:0}
      .sql-lab-editor,.sql-lab-results{padding:1rem;min-width:0;min-height:0;display:flex;flex-direction:column}
      .sql-lab-editor{border-right:1px solid #dfe6ec;background:#fbfcfd}
      .sql-lab-kicker{font-size:.72rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#6b7480;margin-bottom:.45rem}
      #sqlLabS12Editor{width:100%;flex:1;min-height:12rem;resize:none;border:2px solid #cbd6df;border-radius:12px;background:#0d1b26;color:#eef6fb;padding:1rem;font:14px/1.5 Consolas,"Cascadia Mono",monospace;tab-size:2;outline:none}
      #sqlLabS12Editor:focus{border-color:#ff8a24;box-shadow:0 0 0 3px rgba(255,138,36,.16)}
      .sql-lab-buttons{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:.75rem}
      .sql-lab-buttons button{border:2px solid #124e78;background:#fff;color:#124e78;border-radius:999px;padding:.55rem 1rem;font-weight:800;cursor:pointer}
      .sql-lab-buttons .primary{background:#124e78;color:#fff}.sql-lab-buttons button:hover{filter:brightness(.94)}
      .sql-lab-status{font-size:.82rem;color:#5a6772;margin-top:.65rem;min-height:1.2rem}
      .sql-lab-status.bad{color:#a52a2a;font-weight:700}.sql-lab-status.good{color:#146c43;font-weight:700}
      #sqlLabS12Result{flex:1;min-height:0;overflow:auto;border:1px solid #dfe6ec;border-radius:12px;background:#fff}
      .sql-lab-empty{display:grid;place-items:center;height:100%;min-height:12rem;padding:2rem;text-align:center;color:#77838e}
      .sql-lab-resultset{padding:.75rem}.sql-lab-resultset + .sql-lab-resultset{border-top:3px solid #ffd600}
      .sql-lab-resultmeta{font-size:.77rem;color:#66727d;margin:0 0 .45rem;font-weight:700}
      .sql-lab-tablewrap{overflow:auto;max-width:100%}
      .sql-lab-table{border-collapse:collapse;width:max-content;min-width:100%;font-size:.8rem}
      .sql-lab-table th{position:sticky;top:0;background:#124e78;color:#fff;text-align:left;padding:.48rem .62rem;white-space:nowrap}
      .sql-lab-table td{padding:.43rem .62rem;border-bottom:1px solid #e3e8ed;white-space:nowrap;max-width:28rem;overflow:hidden;text-overflow:ellipsis}
      .sql-lab-table tr:nth-child(even) td{background:#f5f9fc}.sql-lab-null{color:#9aa3aa;font-style:italic}
      .sql-lab-footer{border-top:1px solid #dfe6ec;padding:.8rem 1rem;background:#fff8e1}
      .sql-lab-expect{font-size:.85rem}
      @media(max-width:760px){
        .sql-lab-overlay{padding:0}.sql-lab-panel{width:100vw;height:100dvh;border-radius:0}
        .sql-lab-main{grid-template-columns:1fr;grid-template-rows:minmax(15rem,46%) 1fr;overflow:hidden}
        .sql-lab-editor{border-right:0;border-bottom:1px solid #dfe6ec;padding:.75rem}.sql-lab-results{padding:.75rem}
        #sqlLabS12Editor{min-height:8rem;font-size:12px}.sql-lab-head{padding:.65rem .8rem}.sql-lab-footer{padding:.65rem .75rem}
      }
    `;
    document.head.appendChild(style);
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(s => s.src === src);
      if (existing && window.initSqlJs) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar el motor SQL local.'));
      document.head.appendChild(s);
    });
  }

  async function getDB() {
    if (!dbPromise) {
      dbPromise = (async () => {
        if (!window.initSqlJs) await loadScript(`${SQLJS_BASE}sql-wasm.js`);
        const SQL = await window.initSqlJs({ locateFile: file => `${SQLJS_BASE}${file}` });
        const response = await fetch(DB_URL, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`No se pudo cargar restaurante-abc.db (${response.status}).`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        return new SQL.Database(bytes);
      })();
    }
    return dbPromise;
  }

  function readonly(sql) {
    const stripped = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
    if (!stripped) return false;
    return !/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|VACUUM|REINDEX)\b/i.test(stripped);
  }

  function buildOverlay() {
    if (document.getElementById('sqlLabS12Overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'sqlLabS12Overlay';
    overlay.className = 'sql-lab-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Laboratorio SQL de la sesión 12');
    overlay.innerHTML = `
      <div class="sql-lab-panel">
        <div class="sql-lab-head">
          <div><strong id="sqlLabS12Title">Laboratorio SQL</strong><small>SQLite en tu navegador · una copia real del Restaurante ABC de la sesión 9 · nada se guarda en el servidor</small></div>
          <button class="sql-lab-close" id="sqlLabS12Close" aria-label="Cerrar laboratorio">×</button>
        </div>
        <div class="sql-lab-main">
          <section class="sql-lab-editor">
            <div class="sql-lab-kicker">Consulta · puedes editarla</div>
            <textarea id="sqlLabS12Editor" spellcheck="false" aria-label="Editor SQL"></textarea>
            <div class="sql-lab-buttons">
              <button class="primary" id="sqlLabS12Execute">▶ Ejecutar</button>
              <button id="sqlLabS12Reset">Restablecer</button>
              <button id="sqlLabS12Free">Consulta libre</button>
            </div>
            <div class="sql-lab-status" id="sqlLabS12Status">Pulsa Ejecutar. Atajo: Ctrl/⌘ + Enter.</div>
          </section>
          <section class="sql-lab-results">
            <div class="sql-lab-kicker">Resultado real</div>
            <div id="sqlLabS12Result"><div class="sql-lab-empty">La base se carga cuando ejecutes tu primera consulta.</div></div>
          </section>
        </div>
        <div class="sql-lab-footer">
          <div class="sql-lab-expect" id="sqlLabS12Expect"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const panel = overlay.querySelector('.sql-lab-panel');
    panel.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLab();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        executeSQL();
      }
    });

    document.getElementById('sqlLabS12Close').onclick = closeLab;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeLab(); });
    document.getElementById('sqlLabS12Execute').onclick = executeSQL;
    document.getElementById('sqlLabS12Reset').onclick = () => setPreset(activePreset || SANDBOX);
    document.getElementById('sqlLabS12Free').onclick = () => setPreset(SANDBOX);
  }

  function setPreset(preset) {
    activePreset = preset || SANDBOX;
    document.getElementById('sqlLabS12Title').textContent = `Laboratorio SQL · Restaurante ABC`;
    document.getElementById('sqlLabS12Editor').value = activePreset.sql;
    document.getElementById('sqlLabS12Status').className = 'sql-lab-status';
    document.getElementById('sqlLabS12Status').textContent = 'Pulsa Ejecutar. Atajo: Ctrl/⌘ + Enter.';
    document.getElementById('sqlLabS12Result').innerHTML = '<div class="sql-lab-empty">Ejecuta la consulta para ver el resultado real.</div>';
    const expect = document.getElementById('sqlLabS12Expect');
    expect.innerHTML = activePreset.expected
      ? `<b>Resultado esperado:</b> ${esc(activePreset.expected)}. ${esc(activePreset.explanation || '')}`
      : '';
  }

  function openLab(preset) {
    buildOverlay();
    setPreset(preset || SANDBOX);
    document.getElementById('sqlLabS12Overlay').classList.add('open');
    setTimeout(() => document.getElementById('sqlLabS12Editor').focus(), 0);
  }

  function closeLab() {
    const overlay = document.getElementById('sqlLabS12Overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function renderResults(results, elapsed) {
    const box = document.getElementById('sqlLabS12Result');
    if (!results.length) {
      box.innerHTML = '<div class="sql-lab-empty">La consulta se ejecutó correctamente, pero no devolvió una tabla de resultados.</div>';
      return;
    }
    box.innerHTML = results.map((set, idx) => {
      const total = set.values.length;
      const rows = set.values.slice(0, MAX_ROWS);
      const head = set.columns.map(c => `<th>${esc(c)}</th>`).join('');
      const body = rows.map(row => `<tr>${row.map(v => `<td>${v === null ? '<span class="sql-lab-null">NULL</span>' : esc(v)}</td>`).join('')}</tr>`).join('');
      const cap = total > MAX_ROWS ? ` · mostrando ${MAX_ROWS} de ${total}` : '';
      return `<div class="sql-lab-resultset"><p class="sql-lab-resultmeta">Resultado ${idx + 1} · ${total.toLocaleString('es-CO')} fila(s)${cap}</p><div class="sql-lab-tablewrap"><table class="sql-lab-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
    }).join('');
    const st = document.getElementById('sqlLabS12Status');
    st.className = 'sql-lab-status good';
    st.textContent = `✓ Consulta ejecutada en ${elapsed.toFixed(1)} ms · ${results.length} conjunto(s) de resultados.`;
  }

  async function executeSQL() {
    const editor = document.getElementById('sqlLabS12Editor');
    const status = document.getElementById('sqlLabS12Status');
    const button = document.getElementById('sqlLabS12Execute');
    const sql = editor.value.trim();
    if (!readonly(sql)) {
      status.className = 'sql-lab-status bad';
      status.textContent = 'Esta sesión está en modo lectura. Usa SELECT, WITH, PRAGMA o EXPLAIN; no modificamos la base.';
      return;
    }
    try {
      button.disabled = true;
      status.className = 'sql-lab-status';
      status.textContent = 'Cargando SQLite y restaurante-abc.db…';
      const db = await getDB();
      status.textContent = 'Ejecutando…';
      const t0 = performance.now();
      const results = db.exec(sql);
      const elapsed = performance.now() - t0;
      renderResults(results, elapsed);
    } catch (err) {
      status.className = 'sql-lab-status bad';
      status.textContent = `Error: ${err.message || err}`;
      document.getElementById('sqlLabS12Result').innerHTML = `<div class="sql-lab-empty">${esc(err.message || err)}</div>`;
    } finally {
      button.disabled = false;
    }
  }

  function addRunButtons() {
    document.querySelectorAll('pre').forEach(pre => {
      if (pre.dataset.sqlLabS12Ready === '1') return;
      const text = pre.textContent || '';
      const matches = PRESETS.filter(p => text.includes(p.marker));
      if (!matches.length) return;
      pre.dataset.sqlLabS12Ready = '1';
      const bar = document.createElement('div');
      bar.className = 'sql-lab-actions';
      matches.forEach(preset => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sql-lab-run';
        b.textContent = preset.label;
        b.title = `Ejecutar en restaurante-abc.db`;
        b.onclick = e => { e.stopPropagation(); openLab(preset); };
        bar.appendChild(b);
      });
      pre.insertAdjacentElement('afterend', bar);
    });
  }

  function addToolbarButton() {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar || document.getElementById('sqlLabS12Toolbar')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'sqlLabS12Toolbar';
    b.className = 'ctl';
    b.textContent = 'SQL';
    b.title = 'Abrir laboratorio SQL del Restaurante ABC';
    b.setAttribute('aria-label', 'Abrir laboratorio SQL del Restaurante ABC');
    b.onclick = e => { e.stopPropagation(); openLab(SANDBOX); };
    const timeBtn = document.getElementById('timeBtn');
    if (timeBtn) toolbar.insertBefore(b, timeBtn); else toolbar.appendChild(b);
  }

  function init() {
    injectStyles();
    buildOverlay();
    addRunButtons();
    addToolbarButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
