(() => {
  'use strict';

  const SQLJS_VERSION = '1.14.1';
  const SQLJS_BASE = new URL('../../assets/vendor/sqljs/', location.href).href;
  const DB_URL = '../M2/base-datos/dvdrental.db';
  const MAX_ROWS = 200;

  let dbPromise = null;
  let activePreset = null;

  const PRESETS = [
    {
      id: 'schema-rental',
      label: 'Esquema rental',
      marker: "pragma_table_info('rental')",
      sql: `SELECT name, "notnull"\nFROM pragma_table_info('rental');`,
      level: null,
      explanation: 'Esta consulta no mira filas del negocio: mira la forma de la tabla. Un NOT NULL es una restricción implementada; una columna que admite NULL expresa un permiso del esquema.'
    },
    {
      id: 'sin-devolver',
      label: '1 · Sin devolver',
      marker: 'sin_devolver',
      sql: `SELECT COUNT(*) AS sin_devolver\nFROM rental\nWHERE return_date IS NULL;`,
      level: 'permiso',
      expected: '183',
      explanation: 'Los 183 casos confirman que ocurre. El permiso no lo demuestra el COUNT: viene de que return_date admite NULL.'
    },
    {
      id: 'solapes',
      label: '2 · Solapes',
      marker: 'AS solapes',
      sql: `SELECT COUNT(*) AS solapes\nFROM rental a\nJOIN rental b ON a.inventory_id = b.inventory_id\n             AND a.rental_id < b.rental_id\nWHERE a.rental_date < COALESCE(b.return_date, '9999-12-31')\n  AND b.rental_date < COALESCE(a.return_date, '9999-12-31');`,
      level: 'patron',
      expected: '0',
      explanation: 'Cero significa “no ocurrió en estos datos”, no “el sistema lo prohíbe”. Un cero no es una ley. Fíjate en la condición: dos intervalos se pisan cuando cada uno empieza antes de que acabe el otro, y un alquiler sin devolver sigue ocupando la copia.'
    },
    {
      id: 'ratings',
      label: '3 · Clasificaciones',
      marker: 'rating, COUNT(*) AS n',
      sql: `SELECT rating, COUNT(*) AS n\nFROM film\nGROUP BY rating\nORDER BY n DESC;`,
      level: 'restriccion',
      expected: '5 grupos',
      explanation: 'El GROUP BY muestra cinco valores en los datos. La certeza de restricción viene de una evidencia adicional: en el esquema original de PostgreSQL rating es un ENUM. La consulta sola sería únicamente un patrón observado.'
    },
    {
      id: 'sin-copias',
      label: '4 · Sin copias',
      marker: 'AS sin_copias',
      sql: `SELECT COUNT(*) AS sin_copias\nFROM film f\nLEFT JOIN inventory i ON f.film_id = i.film_id\nWHERE i.film_id IS NULL;`,
      level: 'permiso',
      expected: '42',
      explanation: 'Las 42 películas prueban que el caso ocurre. La conclusión “puede existir una película sin copias” se apoya en que el esquema no obliga a que exista una fila de inventory.'
    },
    {
      id: 'fechas',
      label: 'Fechas rental / payment',
      marker: 'MIN(rental_date)',
      sql: `SELECT MIN(rental_date) AS primer_alquiler,\n       MAX(rental_date) AS ultimo_alquiler\nFROM rental;\n\nSELECT MIN(payment_date) AS primer_pago,\n       MAX(payment_date) AS ultimo_pago\nFROM payment;`,
      level: 'hipotesis',
      expected: '2005–2006 vs 2007',
      explanation: 'Los rangos existen en este dataset, pero concluir que el negocio cobra uno o dos años después sería una interpretación sin confirmar. Aquí el dato de ejemplo es engañoso.'
    },
    {
      id: 'clientes-dos-tiendas',
      label: 'Clientes en dos tiendas',
      marker: 'clientes_en_las_dos',
      sql: `SELECT COUNT(*) AS clientes_en_las_dos\nFROM (\n  SELECT r.customer_id\n  FROM rental r\n  JOIN inventory i ON r.inventory_id = i.inventory_id\n  GROUP BY r.customer_id\n  HAVING COUNT(DISTINCT i.store_id) > 1\n);`,
      level: 'hipotesis',
      expected: '599',
      explanation: 'Que los 599 clientes hayan alquilado en ambas tiendas contradice una interpretación sencilla de customer.store_id. La base no puede explicar por qué: hay que preguntarlo.'
    },
    {
      id: 'otra-tienda',
      label: 'Alquileres en otra tienda',
      marker: 'alquileres_en_otra_tienda',
      sql: `SELECT COUNT(*) AS alquileres_en_otra_tienda\nFROM rental r\nJOIN inventory i ON r.inventory_id = i.inventory_id\nJOIN customer c ON r.customer_id = c.customer_id\nWHERE i.store_id <> c.store_id;`,
      level: 'hipotesis',
      expected: '8018',
      explanation: 'El número es real en el dataset; su significado de negocio no está documentado por las filas. Debe convertirse en una pregunta.'
    },
    {
      id: 'sin-pago',
      label: 'Alquileres sin pago',
      marker: 'alquileres_sin_pago',
      sql: `SELECT COUNT(*) AS alquileres_sin_pago\nFROM rental r\nLEFT JOIN payment p ON r.rental_id = p.rental_id\nWHERE p.rental_id IS NULL;`,
      level: 'hipotesis',
      expected: '1452',
      explanation: 'Puede ser promoción, cobro pendiente, fallo de carga u otra razón. El dato detecta el hallazgo, pero no explica la regla del negocio.'
    },
    {
      id: 'pagos-cero',
      label: 'Pagos en cero',
      marker: 'pagos_en_cero',
      sql: `SELECT COUNT(*) AS pagos_en_cero\nFROM payment\nWHERE amount = 0;`,
      level: 'hipotesis',
      expected: '24',
      explanation: 'Veinticuatro pagos de cero existen, pero no sabemos si son cortesías, anulaciones o un problema de calidad. La interpretación debe preguntarse.'
    },
    {
      id: 'staff-tienda',
      label: 'Empleados por tienda',
      marker: 'COUNT(*) AS empleados',
      sql: `SELECT store_id, COUNT(*) AS empleados\nFROM staff\nGROUP BY store_id;`,
      level: 'patron',
      expected: '1 por tienda',
      explanation: 'Hoy hay un empleado por tienda, pero nada en esta consulta demuestra que mañana no pueda haber dos. Es un patrón observado.'
    },
    {
      id: 'clientes-active',
      label: 'Cliente activo / inactivo',
      marker: 'customer.active',
      sql: `SELECT active, COUNT(*) AS n\nFROM customer\nGROUP BY active;`,
      level: 'hipotesis',
      expected: '15 inactivos · 584 activos',
      explanation: 'La consulta muestra cómo están los datos hoy. Para afirmar qué le pasa a un cliente cuando “se da de baja” hace falta conocer el proceso del negocio.'
    }
  ];

  const SANDBOX = {
    id: 'sandbox',
    label: 'Consulta libre',
    sql: `SELECT title, rating, length\nFROM film\nORDER BY title\nLIMIT 10;`,
    level: null,
    explanation: 'Modo libre de lectura. Puedes modificar la consulta y explorar dvdrental sin afectar la base original.'
  };

  function injectStyles() {
    if (document.getElementById('sqlLabS6Styles')) return;
    const style = document.createElement('style');
    style.id = 'sqlLabS6Styles';
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
        if (!response.ok) throw new Error(`No se pudo cargar dvdrental.db (${response.status}).`);
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
          <div><strong id="sqlLabTitle">Laboratorio SQL</strong><small>SQLite en tu navegador · dvdrental.db · nada se guarda en el servidor</small></div>
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
      status.textContent = 'Cargando SQLite y dvdrental.db…';
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
        b.title = `Ejecutar ${preset.label} en dvdrental.db`;
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
