(() => {
  'use strict';

  const SQLJS_VERSION = '1.14.1';
  const SQLJS_BASE = new URL('../../assets/vendor/sqljs/', location.href).href;
  const DB_URL = 'base-datos/s9-normalizacion.db';
  const MAX_ROWS = 200;

  let dbPromise = null;
  let activePreset = null;

  const PRESETS = [
    {
      id: '1fn-obvio',
      label: '1 · el obvio',
      marker: "platos = 'Ajiaco'",
      sql: `SELECT *
FROM lab_1fn_pedido_mal
WHERE platos = 'Ajiaco';`,
      level: null,
      expected: '0 filas',
      explanation: 'Cero filas. Y si hay ajiaco: esta en dos de los tres pedidos. La celda no guarda «Ajiaco», guarda «Ajiaco x2; Limonada x4», que es otra cosa distinta.'
    },
    {
      id: '1fn-listo',
      label: '2 · el listo',
      marker: "platos LIKE '%Ajiaco%'",
      sql: `SELECT *
FROM lab_1fn_pedido_mal
WHERE platos LIKE '%Ajiaco%';`,
      level: null,
      expected: '2 filas',
      explanation: 'Dos filas. Encuentra los PEDIDOS que mencionan ajiaco, no las CANTIDADES. Sabemos en cuantos pedidos aparece, y seguimos sin saber cuantos se vendieron.'
    },
    {
      id: '1fn-cierra',
      label: '3 · el que cierra',
      marker: 'SUM(cantidad) AS ajiacos',
      sql: `SELECT SUM(cantidad) AS ajiacos
FROM lab_1fn_pedido_mal
WHERE platos LIKE '%Ajiaco%';`,
      level: null,
      explanation: 'Error: no existe ninguna columna «cantidad». Ahi acaba el camino. La pregunta no es dificil: es imposible, porque no hay nada que sumar. El dato esta escrito, pero para la base es una frase, y una frase no se suma.'
    },
    {
      id: '1fn-bien',
      label: 'La misma pregunta, en 1FN',
      marker: 'FROM lab_1fn_linea_bien',
      sql: `SELECT SUM(cantidad) AS ajiacos_vendidos
FROM lab_1fn_linea_bien
WHERE plato = 'Ajiaco';`,
      level: null,
      expected: '3',
      explanation: 'Tres. Los mismos datos, ni uno mas ni uno menos: solo cambio la forma. Prueben ahora GROUP BY plato y sale la carta entera con sus cantidades — eso tampoco se podia antes.'
    },
    {
      id: '2fn-mal',
      label: 'La carta, desde los pedidos',
      marker: 'COUNT(DISTINCT plato_id)',
      sql: `SELECT COUNT(DISTINCT plato_id) AS platos_en_la_carta
FROM lab_2fn_linea_mal;`,
      level: null,
      expected: '2',
      explanation: 'Dos. Y la carta tiene tres: el tamal existe, esta en la cocina, y aqui no aparece porque nadie lo ha pedido todavia. En esta estructura un plato no existe hasta que alguien lo pide.'
    },
    {
      id: '2fn-repes',
      label: 'El nombre, escrito tres veces',
      marker: 'GROUP BY nombre_plato',
      sql: `SELECT nombre_plato, COUNT(*) AS veces_escrito
FROM lab_2fn_linea_mal
GROUP BY nombre_plato;`,
      level: null,
      explanation: 'Ajiaco: 3. Renombrarlo son tres UPDATE, y si se escapa uno la base dira dos nombres para el mismo plato sin dar un solo error.'
    },
    {
      id: '2fn-bien',
      label: 'La carta, en 2FN',
      marker: 'FROM lab_2fn_plato_bien',
      sql: `SELECT COUNT(*) AS platos_en_la_carta
FROM lab_2fn_plato_bien;`,
      level: null,
      expected: '3',
      explanation: 'Tres. El tamal cabe sin que nadie lo haya pedido, que es como funciona un restaurante. Y el nombre esta escrito una sola vez: renombrarlo es un UPDATE, no tres.'
    },
    {
      id: '3fn-mal',
      label: 'El salon, desde los pedidos',
      marker: 'FROM lab_3fn_pedido_mal',
      sql: `SELECT SUM(puestos) AS puestos_del_salon
FROM lab_3fn_pedido_mal;`,
      level: null,
      expected: '14',
      explanation: 'Catorce. Sin error y sin aviso: la consulta funciono perfectamente y la respuesta es falsa. La mesa 1 tiene tres pedidos, asi que sus cuatro puestos se contaron tres veces.'
    },
    {
      id: '3fn-mesa3',
      label: 'Y la mesa 3',
      marker: 'WHERE mesa_id = 3',
      sql: `SELECT DISTINCT mesa_id, puestos
FROM lab_3fn_pedido_mal
WHERE mesa_id = 3;`,
      level: null,
      expected: '0 filas',
      explanation: 'Cero filas. La mesa 3 esta en el salon, la estan viendo. Pero nunca ha tenido un pedido, y en esta tabla las mesas solo existen si alguien se sento en ellas.'
    },
    {
      id: '3fn-bien',
      label: 'El salon, en 3FN',
      marker: 'FROM lab_3fn_mesa_bien',
      sql: `SELECT SUM(puestos) AS puestos_del_salon
FROM lab_3fn_mesa_bien;`,
      level: null,
      expected: '11',
      explanation: 'Once: cuatro, dos y cinco. Cada mesa cuenta una vez, y la mesa 3 por fin cuenta. El 14 de antes estaba mal por partida doble: contaba de mas las mesas usadas y se dejaba fuera la que no.'
    }
  ];

  const SANDBOX = {
    id: 'sandbox',
    label: 'Consulta libre',
    sql: `SELECT * FROM lab_1fn_linea_bien;`,
    level: null,
    explanation: 'Modo libre de lectura sobre las seis tablas del laboratorio: lab_1fn_pedido_mal, lab_1fn_linea_bien, lab_2fn_linea_mal, lab_2fn_pedido_bien, lab_2fn_plato_bien, lab_2fn_linea_bien, lab_3fn_pedido_mal, lab_3fn_mesa_bien y lab_3fn_pedido_bien. Nada de lo que escribas toca la base: se trabaja sobre una copia en tu propio navegador.'
  };

  function injectStyles() {
    if (document.getElementById('sqlLabS9Styles')) return;
    const style = document.createElement('style');
    style.id = 'sqlLabS9Styles';
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
      #sqlLabEditor{width:100%;flex:1;min-height:12rem;resize:none;border:2px solid #cbd6df;border-radius:12px;background:#0d1b26;color:#eef6fb;padding:1rem;font:14px/1.5 Consolas,"Cascadia Mono",monospace;tab-size:2;outline:none}
      #sqlLabEditor:focus{border-color:#ff8a24;box-shadow:0 0 0 3px rgba(255,138,36,.16)}
      .sql-lab-buttons{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:.75rem}
      .sql-lab-buttons button{border:2px solid #124e78;background:#fff;color:#124e78;border-radius:999px;padding:.55rem 1rem;font-weight:800;cursor:pointer}
      .sql-lab-buttons .primary{background:#124e78;color:#fff}.sql-lab-buttons button:hover{filter:brightness(.94)}
      .sql-lab-status{font-size:.82rem;color:#5a6772;margin-top:.65rem;min-height:1.2rem}
      .sql-lab-status.bad{color:#a52a2a;font-weight:700}.sql-lab-status.good{color:#146c43;font-weight:700}
      #sqlLabResult{flex:1;min-height:0;overflow:auto;border:1px solid #dfe6ec;border-radius:12px;background:#fff}
      .sql-lab-empty{display:grid;place-items:center;height:100%;min-height:12rem;padding:2rem;text-align:center;color:#77838e}
      .sql-lab-resultset{padding:.75rem}.sql-lab-resultset + .sql-lab-resultset{border-top:3px solid #ffd600}
      .sql-lab-resultmeta{font-size:.77rem;color:#66727d;margin:0 0 .45rem;font-weight:700}
      .sql-lab-tablewrap{overflow:auto;max-width:100%}
      .sql-lab-table{border-collapse:collapse;width:max-content;min-width:100%;font-size:.8rem}
      .sql-lab-table th{position:sticky;top:0;background:#124e78;color:#fff;text-align:left;padding:.48rem .62rem;white-space:nowrap}
      .sql-lab-table td{padding:.43rem .62rem;border-bottom:1px solid #e3e8ed;white-space:nowrap;max-width:28rem;overflow:hidden;text-overflow:ellipsis}
      .sql-lab-table tr:nth-child(even) td{background:#f5f9fc}.sql-lab-null{color:#9aa3aa;font-style:italic}
      .sql-lab-footer{border-top:1px solid #dfe6ec;padding:.8rem 1rem;background:#fff8e1}
      .sql-lab-level{display:none}.sql-lab-level.show{display:block}
      .sql-lab-level-title{font-size:.86rem;font-weight:900;margin-bottom:.5rem}
      .sql-lab-levels{display:flex;flex-wrap:wrap;gap:.45rem}
      .sql-lab-levels button{border:1.5px solid #aab7c2;background:#fff;border-radius:999px;padding:.42rem .8rem;font-weight:800;font-size:.78rem;cursor:pointer}
      .sql-lab-levels button.ok{background:#e9f8ef;border-color:#146c43;color:#0d5533}.sql-lab-levels button.no{background:#fff1f0;border-color:#a52a2a;color:#8d2020}
      .sql-lab-feedback{display:none;margin-top:.55rem;padding:.58rem .72rem;border-radius:9px;font-size:.79rem;line-height:1.35}
      .sql-lab-feedback.show{display:block}.sql-lab-feedback.good{background:#e9f8ef;color:#0d5533}.sql-lab-feedback.bad{background:#fff1f0;color:#8d2020}
      .sql-lab-expected{font-weight:900;color:#124e78}
      @media(max-width:760px){
        .sql-lab-overlay{padding:0}.sql-lab-panel{width:100vw;height:100dvh;border-radius:0}
        .sql-lab-main{grid-template-columns:1fr;grid-template-rows:minmax(15rem,46%) 1fr;overflow:hidden}
        .sql-lab-editor{border-right:0;border-bottom:1px solid #dfe6ec;padding:.75rem}.sql-lab-results{padding:.75rem}
        #sqlLabEditor{min-height:8rem;font-size:12px}.sql-lab-head{padding:.65rem .8rem}.sql-lab-footer{padding:.65rem .75rem}
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
        if (!response.ok) throw new Error(`No se pudo cargar s9-normalizacion.db (${response.status}).`);
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
    if (document.getElementById('sqlLabOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'sqlLabOverlay';
    overlay.className = 'sql-lab-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Laboratorio SQL de la sesión 6');
    overlay.innerHTML = `
      <div class="sql-lab-panel">
        <div class="sql-lab-head">
          <div><strong id="sqlLabTitle">Laboratorio SQL</strong><small>SQLite en tu navegador · las tablas del laboratorio · nada se guarda en el servidor</small></div>
          <button class="sql-lab-close" id="sqlLabClose" aria-label="Cerrar laboratorio">×</button>
        </div>
        <div class="sql-lab-main">
          <section class="sql-lab-editor">
            <div class="sql-lab-kicker">Consulta · puedes editarla</div>
            <textarea id="sqlLabEditor" spellcheck="false" aria-label="Editor SQL"></textarea>
            <div class="sql-lab-buttons">
              <button class="primary" id="sqlLabExecute">▶ Ejecutar</button>
              <button id="sqlLabReset">Restablecer</button>
              <button id="sqlLabFree">Consulta libre</button>
            </div>
            <div class="sql-lab-status" id="sqlLabStatus">Pulsa Ejecutar. Atajo: Ctrl/⌘ + Enter.</div>
          </section>
          <section class="sql-lab-results">
            <div class="sql-lab-kicker">Resultado real</div>
            <div id="sqlLabResult"><div class="sql-lab-empty">La base se carga cuando ejecutes tu primera consulta.</div></div>
          </section>
        </div>
        <div class="sql-lab-footer">
          <div class="sql-lab-level" id="sqlLabLevel">
            <div class="sql-lab-level-title">Ahora interpreta el resultado: ¿de qué nivel es la conclusión?</div>
            <div class="sql-lab-levels">
              <button data-level="restriccion">Restricción</button>
              <button data-level="permiso">Permiso</button>
              <button data-level="patron">Patrón</button>
              <button data-level="hipotesis">Hipótesis</button>
            </div>
            <div class="sql-lab-feedback" id="sqlLabFeedback"></div>
          </div>
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

    document.getElementById('sqlLabClose').onclick = closeLab;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeLab(); });
    document.getElementById('sqlLabExecute').onclick = executeSQL;
    document.getElementById('sqlLabReset').onclick = () => setPreset(activePreset || SANDBOX);
    document.getElementById('sqlLabFree').onclick = () => setPreset(SANDBOX);
    overlay.querySelectorAll('[data-level]').forEach(btn => {
      btn.onclick = () => checkLevel(btn.dataset.level, btn);
    });
  }

  function setPreset(preset) {
    activePreset = preset || SANDBOX;
    document.getElementById('sqlLabTitle').textContent = `Laboratorio SQL · ${activePreset.label}`;
    document.getElementById('sqlLabEditor').value = activePreset.sql;
    document.getElementById('sqlLabStatus').className = 'sql-lab-status';
    document.getElementById('sqlLabStatus').textContent = activePreset.expected
      ? `Resultado de control: ${activePreset.expected}. Ejecuta y comprueba.`
      : 'Pulsa Ejecutar. Atajo: Ctrl/⌘ + Enter.';
    document.getElementById('sqlLabResult').innerHTML = '<div class="sql-lab-empty">Ejecuta la consulta para ver el resultado real.</div>';
    const level = document.getElementById('sqlLabLevel');
    level.classList.toggle('show', Boolean(activePreset.level));
    level.querySelectorAll('[data-level]').forEach(b => b.classList.remove('ok', 'no'));
    const fb = document.getElementById('sqlLabFeedback');
    fb.className = 'sql-lab-feedback';
    fb.textContent = '';
  }

  function openLab(preset) {
    buildOverlay();
    setPreset(preset || SANDBOX);
    document.getElementById('sqlLabOverlay').classList.add('open');
    setTimeout(() => document.getElementById('sqlLabEditor').focus(), 0);
  }

  function closeLab() {
    const overlay = document.getElementById('sqlLabOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  function renderResults(results, elapsed) {
    const box = document.getElementById('sqlLabResult');
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
    const st = document.getElementById('sqlLabStatus');
    st.className = 'sql-lab-status good';
    st.textContent = `✓ Consulta ejecutada en ${elapsed.toFixed(1)} ms · ${results.length} conjunto(s) de resultados.`;
  }

  async function executeSQL() {
    const editor = document.getElementById('sqlLabEditor');
    const status = document.getElementById('sqlLabStatus');
    const button = document.getElementById('sqlLabExecute');
    const sql = editor.value.trim();
    if (!readonly(sql)) {
      status.className = 'sql-lab-status bad';
      status.textContent = 'Esta sesión está en modo lectura. Usa SELECT, WITH, PRAGMA o EXPLAIN; no modificamos la base.';
      return;
    }
    try {
      button.disabled = true;
      status.className = 'sql-lab-status';
      status.textContent = 'Cargando SQLite y s9-normalizacion.db…';
      const db = await getDB();
      status.textContent = 'Ejecutando…';
      const t0 = performance.now();
      const results = db.exec(sql);
      const elapsed = performance.now() - t0;
      renderResults(results, elapsed);
    } catch (err) {
      status.className = 'sql-lab-status bad';
      status.textContent = `Error: ${err.message || err}`;
      document.getElementById('sqlLabResult').innerHTML = `<div class="sql-lab-empty">${esc(err.message || err)}</div>`;
    } finally {
      button.disabled = false;
    }
  }

  function checkLevel(level, button) {
    if (!activePreset || !activePreset.level) return;
    const buttons = document.querySelectorAll('#sqlLabLevel [data-level]');
    buttons.forEach(b => b.classList.remove('ok', 'no'));
    const ok = level === activePreset.level;
    button.classList.add(ok ? 'ok' : 'no');
    if (!ok) {
      const correct = [...buttons].find(b => b.dataset.level === activePreset.level);
      if (correct) correct.classList.add('ok');
    }
    const names = { restriccion: 'restricción', permiso: 'permiso', patron: 'patrón', hipotesis: 'hipótesis' };
    const fb = document.getElementById('sqlLabFeedback');
    fb.className = `sql-lab-feedback show ${ok ? 'good' : 'bad'}`;
    fb.innerHTML = `<strong>${ok ? '✓ Correcto.' : `No: aquí es ${names[activePreset.level]}.`}</strong> ${esc(activePreset.explanation || '')}`;
  }

  function addRunButtons() {
    document.querySelectorAll('pre').forEach(pre => {
      if (pre.dataset.sqlLabReady === '1') return;
      const text = pre.textContent || '';
      const matches = PRESETS.filter(p => text.includes(p.marker));
      if (!matches.length) return;
      pre.dataset.sqlLabReady = '1';
      const bar = document.createElement('div');
      bar.className = 'sql-lab-actions';
      matches.forEach(preset => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sql-lab-run';
        b.textContent = preset.label;
        b.title = `Ejecutar ${preset.label} en s9-normalizacion.db`;
        b.onclick = e => { e.stopPropagation(); openLab(preset); };
        bar.appendChild(b);
      });
      pre.insertAdjacentElement('afterend', bar);
    });
  }

  function addToolbarButton() {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar || document.getElementById('sqlLabToolbar')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'sqlLabToolbar';
    b.className = 'ctl';
    b.textContent = 'SQL';
    b.title = 'Abrir laboratorio SQL';
    b.setAttribute('aria-label', 'Abrir laboratorio SQL');
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
