(() => {
  'use strict';

  const TARGET = new Set(['2','3','4','5','7','8','10','12','13','14']);
  const TOTAL = 10;
  const STORE = 'andesdb.revision.toolkit.v1';
  const script = document.currentScript || [...document.scripts].find(s => /interactive-tools\.js(?:\?|$)/.test(s.src));
  if (!script || window.self !== window.top) return;
  const ROOT = new URL('../../', script.src);
  const SQLJS = new URL('assets/vendor/sqljs/', ROOT);
  const DB_URL = new URL('Presentaciones/M2/base-datos/dvdrental.db', ROOT);

  function sessionNumber() {
    const m = (location.pathname + ' ' + document.title).match(/sesion[-_\s]*(\d{1,2})/i);
    return m ? String(Number(m[1])) : null;
  }
  const SESSION = sessionNumber();
  if (!TARGET.has(SESSION)) return;

  const MISSIONS = {
    '2':'sql-s2','3':'sql-s3','4':'sql-s4','5':'sql-s5','7':'erd-s7','8':'erd-s8',
    '10':'decision-s10','12':'warehouse-s12','13':'bigquery-s13','14':'unnest-s14'
  };

  function loadState() {
    try {
      const x = JSON.parse(localStorage.getItem(STORE) || '{}');
      return { mode: x.mode === 'teacher' ? 'teacher' : 'student', completed: x.completed || {}, meta: x.meta || {} };
    } catch (_) { return { mode:'student', completed:{}, meta:{} }; }
  }
  let state = loadState();
  function saveState() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (_) {} }
  function complete(id) { if (!state.completed[id]) { state.completed[id] = new Date().toISOString(); saveState(); } updateProgress(); }
  function completedCount() { return Object.keys(MISSIONS).filter(k => state.completed[MISSIONS[k]]).length; }
  function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function injectStyles() {
    if (document.getElementById('andes-toolkit-css')) return;
    const st = document.createElement('style');
    st.id = 'andes-toolkit-css';
    st.textContent = `
#andes-toolkit-btn{position:fixed;right:12px;top:12px;z-index:2147482000;border:1px solid #ffffff66;background:#111827ee;color:#fff;border-radius:999px;padding:9px 13px;font:800 12px/1.1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 8px 28px #0005;cursor:pointer;backdrop-filter:blur(8px)}
#andes-toolkit-btn strong{color:#ffd600}.at-overlay{position:fixed;inset:0;z-index:2147483000;background:#000c;display:none;align-items:center;justify-content:center;padding:18px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111827}.at-overlay.open{display:flex}.at-panel{width:min(1100px,98vw);max-height:95vh;overflow:auto;background:#fff;border-radius:20px;box-shadow:0 30px 100px #0009}.at-head{position:sticky;top:0;z-index:5;background:#111827;color:#fff;padding:15px 18px;display:flex;align-items:center;gap:12px;border-radius:20px 20px 0 0}.at-head h2{font-size:18px;margin:0;flex:1}.at-progress{font-weight:900;color:#ffd600;white-space:nowrap}.at-mode,.at-close{border:1px solid #ffffff55;background:#ffffff14;color:#fff;border-radius:10px;padding:8px 10px;font-weight:800;cursor:pointer}.at-close{font-size:19px;line-height:1}.at-body{padding:20px;display:grid;gap:16px}.at-card{border:1px solid #d7dce2;border-radius:15px;padding:16px;background:#fff}.at-card h3{margin:0 0 8px;font-size:17px}.at-card p{line-height:1.45}.at-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.at-prompt{background:#fff8cc;border-color:#e7c900}.at-teacher{background:#eef6ff;border-color:#96c2ff}.at-teacher[hidden]{display:none}.at-muted{color:#64748b;font-size:13px}.at-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.at-btn{border:0;border-radius:10px;padding:9px 12px;background:#111827;color:#fff;font-weight:800;cursor:pointer}.at-btn.alt{background:#e5e7eb;color:#111827}.at-btn.good{background:#166534}.at-btn.warn{background:#92400e}.at-select,.at-input{width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:9px;background:#fff;color:#111827;font:inherit}.at-sql{width:100%;min-height:180px;resize:vertical;background:#0b1220;color:#e5edf6;border:1px solid #334155;border-radius:12px;padding:13px;font:14px/1.5 Consolas,'Cascadia Mono',monospace;tab-size:2}.at-feedback{display:none;border-radius:11px;padding:11px 13px;line-height:1.4}.at-feedback.show{display:block}.at-feedback.ok{background:#dcfce7;color:#14532d}.at-feedback.bad{background:#fee2e2;color:#7f1d1d}.at-feedback.info{background:#e0f2fe;color:#0c4a6e}.at-table-wrap{overflow:auto;max-height:310px;border:1px solid #e2e8f0;border-radius:11px}.at-table{border-collapse:collapse;width:100%;font-size:12px}.at-table th,.at-table td{padding:7px 9px;border-bottom:1px solid #e5e7eb;text-align:left;white-space:nowrap}.at-table th{position:sticky;top:0;background:#f8fafc}.at-hint{background:#f8fafc;border-left:4px solid #64748b;padding:10px 12px;border-radius:8px}.at-erd{display:grid;grid-template-columns:minmax(120px,1fr) minmax(150px,1.2fr) minmax(120px,1fr);gap:8px;align-items:center;margin:12px 0}.at-entity{border:2px solid #111827;border-radius:12px;padding:13px;text-align:center;font-weight:900;background:#fff}.at-rel{display:grid;gap:5px;text-align:center}.at-rel:before,.at-rel:after{content:'';height:2px;background:#64748b}.at-result-box{border-radius:12px;background:#f8fafc;padding:13px}.at-simbar{height:18px;background:#e2e8f0;border-radius:999px;overflow:hidden}.at-simbar>i{display:block;height:100%;background:#2563eb;width:100%;transition:width .25s}.at-json{background:#0b1220;color:#dbeafe;border-radius:12px;padding:12px;overflow:auto;font:12px/1.5 Consolas,monospace}.at-complete{border:1px solid #86efac;background:#f0fdf4;border-radius:12px;padding:11px;color:#166534;font-weight:800}.at-reset{margin-left:auto;color:#64748b;background:transparent;border:0;text-decoration:underline;cursor:pointer}.at-pill{display:inline-block;border-radius:999px;background:#eef2ff;padding:4px 8px;font-size:12px;font-weight:800;margin-right:5px}.at-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.at-fields label{font-size:13px;font-weight:800;display:grid;gap:5px}.at-role{display:grid;grid-template-columns:1.2fr .8fr;gap:8px;align-items:center}.at-mini-table{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.at-cell{padding:8px;border-radius:8px;background:#f1f5f9;font-size:12px}.at-cell.head{font-weight:900;background:#dbeafe}
@media(max-width:760px){#andes-toolkit-btn{top:auto;bottom:10px;right:10px}.at-overlay{padding:0}.at-panel{width:100vw;height:100vh;max-height:none;border-radius:0}.at-head{border-radius:0;flex-wrap:wrap}.at-grid,.at-fields{grid-template-columns:1fr}.at-body{padding:14px}.at-erd{grid-template-columns:1fr}.at-rel:before,.at-rel:after{display:none}}
`;
    document.head.appendChild(st);
  }

  let btn, overlay;
  function updateProgress() {
    const n = completedCount();
    if (btn) btn.innerHTML = `🧪 Lab · <strong>${n}/${TOTAL}</strong>`;
    overlay?.querySelectorAll('.at-progress').forEach(x => x.textContent = `${n}/${TOTAL} logrados`);
    overlay?.querySelectorAll('.at-complete[data-mission]').forEach(x => {
      x.hidden = !state.completed[x.dataset.mission];
    });
  }
  function setMode(mode) {
    state.mode = mode; saveState();
    overlay?.querySelectorAll('.at-teacher').forEach(x => x.hidden = mode !== 'teacher');
    const m = overlay?.querySelector('.at-mode'); if (m) m.textContent = mode === 'teacher' ? '👩‍🏫 Docente' : '🎓 Estudiante';
  }

  function shell(title, inner) {
    const mission = MISSIONS[SESSION];
    return `<div class="at-panel" role="dialog" aria-modal="true" aria-label="Laboratorio interactivo sesión ${SESSION}">
      <div class="at-head"><h2>${esc(title)}</h2><span class="at-progress"></span><button class="at-mode" type="button"></button><button class="at-close" type="button" aria-label="Cerrar">×</button></div>
      <div class="at-body">${inner}<div class="at-complete" data-mission="${mission}" hidden>✓ Reto logrado y guardado en este navegador.</div>
      <div class="at-toolbar"><span class="at-muted">El progreso se guarda con <code>localStorage</code> en este dispositivo.</span><button class="at-reset" type="button">Reiniciar progreso</button></div></div></div>`;
  }

  function baseEvents() {
    const close = () => overlay.classList.remove('open');
    overlay.querySelector('.at-close').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.at-mode').onclick = () => setMode(state.mode === 'teacher' ? 'student' : 'teacher');
    overlay.querySelector('.at-reset').onclick = () => {
      if (confirm('¿Reiniciar los 10 retos guardados en este navegador?')) { state.completed = {}; state.meta = {}; saveState(); updateProgress(); renderCurrent(); }
    };
    overlay.addEventListener('keydown', e => e.stopPropagation());
    setMode(state.mode); updateProgress();
  }

  const SQL_CHALLENGES = {
    '2': {
      title:'SQL Playground · SELECT, WHERE, ORDER BY y LIMIT',
      prompt:'Encuentra las 3 películas PG más largas. Devuelve exactamente las columnas title y length.',
      starter:"SELECT title, length\nFROM film\n-- completa la consulta\n;",
      solution:"SELECT title, length\nFROM film\nWHERE rating = 'PG'\nORDER BY length DESC, title ASC\nLIMIT 3;",
      hints:['Filtra las filas antes de ordenar: necesitas WHERE.', 'PG es un valor de la columna rating.', 'Ordena length de mayor a menor y termina con LIMIT 3.']
    },
    '3': {
      title:'SQL Playground · GROUP BY y HAVING',
      prompt:'Muestra los ratings con más de 180 películas y su duración promedio. Columnas: rating, cantidad_peliculas, duracion_promedio.',
      starter:"SELECT rating,\n       COUNT(*) AS cantidad_peliculas,\n       ROUND(AVG(length), 2) AS duracion_promedio\nFROM film\nGROUP BY rating\n-- ¿dónde filtras grupos?\nORDER BY rating;",
      solution:"SELECT rating, COUNT(*) AS cantidad_peliculas, ROUND(AVG(length), 2) AS duracion_promedio\nFROM film\nGROUP BY rating\nHAVING COUNT(*) > 180\nORDER BY rating;",
      hints:['WHERE filtra filas antes de agrupar; aquí la condición depende de COUNT.', 'La condición sobre grupos va en HAVING.', 'Usa HAVING COUNT(*) > 180.']
    },
    '4': {
      title:'SQL Playground · LEFT JOIN sin perder películas',
      prompt:'Muestra todas las películas, incluso las nunca alquiladas, con su número de alquileres. Columnas: film_id, title, alquileres. Una fila por película.',
      starter:"SELECT f.film_id, f.title,\n       COUNT(r.rental_id) AS alquileres\nFROM film AS f\n-- une inventory y rental sin perder películas\nGROUP BY f.film_id, f.title\nORDER BY f.film_id;",
      solution:"SELECT f.film_id, f.title, COUNT(r.rental_id) AS alquileres\nFROM film AS f\nLEFT JOIN inventory AS i ON i.film_id = f.film_id\nLEFT JOIN rental AS r ON r.inventory_id = i.inventory_id\nGROUP BY f.film_id, f.title\nORDER BY f.film_id;",
      hints:['Si usas INNER JOIN, desaparecen filas sin coincidencia.', 'film → inventory → rental son relaciones 1:N; agrupa de nuevo al grano película.', 'Usa LEFT JOIN dos veces y COUNT(r.rental_id), no COUNT(*).']
    },
    '5': {
      title:'SQL Playground · controla el grano antes del JOIN',
      prompt:'Construye una tabla final de una fila por película con film_id, title, alquileres e ingresos. Deben aparecer también películas sin alquiler.',
      starter:"WITH resumen AS (\n  -- lleva inventory/rental/payment al grano film_id\n)\nSELECT f.film_id, f.title,\n       COALESCE(r.alquileres, 0) AS alquileres,\n       COALESCE(r.ingresos, 0) AS ingresos\nFROM film AS f\nLEFT JOIN resumen AS r ON r.film_id = f.film_id\nORDER BY f.film_id;",
      solution:"WITH resumen AS (\n  SELECT i.film_id,\n         COUNT(DISTINCT r.rental_id) AS alquileres,\n         ROUND(COALESCE(SUM(p.amount), 0), 2) AS ingresos\n  FROM inventory AS i\n  LEFT JOIN rental AS r ON r.inventory_id = i.inventory_id\n  LEFT JOIN payment AS p ON p.rental_id = r.rental_id\n  GROUP BY i.film_id\n)\nSELECT f.film_id, f.title,\n       COALESCE(r.alquileres, 0) AS alquileres,\n       COALESCE(r.ingresos, 0) AS ingresos\nFROM film AS f\nLEFT JOIN resumen AS r ON r.film_id = f.film_id\nORDER BY f.film_id;",
      hints:['Declara primero el grano final: una fila = una película.', 'Agrega inventory/rental/payment por film_id antes de unir con film.', 'Una CTE puede ayudarte a producir primero el resumen por film_id.']
    }
  };

  let sqlPromise = null;
  async function loadDb() {
    if (sqlPromise) return sqlPromise;
    sqlPromise = (async () => {
      if (!window.initSqlJs) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script'); s.src = new URL('sql-wasm.js', SQLJS).href; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
        });
      }
      const SQL = await window.initSqlJs({ locateFile: f => new URL(f, SQLJS).href });
      const r = await fetch(DB_URL); if (!r.ok) throw new Error(`No se pudo cargar dvdrental.db (${r.status})`);
      return new SQL.Database(new Uint8Array(await r.arrayBuffer()));
    })();
    return sqlPromise;
  }
  function readonly(sql) {
    const clean = sql.replace(/--.*$/gm,' ').replace(/\/\*[\s\S]*?\*\//g,' ').trim();
    if (!/^(select|with|explain|pragma)\b/i.test(clean)) return false;
    return !/\b(insert|update|delete|drop|alter|create|replace|attach|detach|vacuum)\b/i.test(clean);
  }
  function firstResult(results) { return results && results.length ? { columns: results[0].columns, values: results[0].values } : { columns:[], values:[] }; }
  function norm(v) { if (v === null) return null; if (typeof v === 'number') return Math.round(v * 1e6) / 1e6; return String(v); }
  function sameResult(a,b) {
    if (a.columns.length !== b.columns.length || a.values.length !== b.values.length) return false;
    if (a.columns.some((c,i) => c.toLowerCase() !== b.columns[i].toLowerCase())) return false;
    for (let r=0;r<a.values.length;r++) for (let c=0;c<a.columns.length;c++) if (JSON.stringify(norm(a.values[r][c])) !== JSON.stringify(norm(b.values[r][c]))) return false;
    return true;
  }
  function tableHTML(res) {
    if (!res.columns.length) return '<div class="at-muted">La consulta no devolvió una tabla.</div>';
    const rows = res.values.slice(0,100);
    return `<div class="at-table-wrap"><table class="at-table"><thead><tr>${res.columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="at-muted">${res.values.length} fila(s)${res.values.length>100?' · se muestran las primeras 100':''}.</div>`;
  }
  function sqlHTML(c) {
    return shell(c.title, `<div class="at-card at-prompt"><h3>Reto autocorregible</h3><p>${esc(c.prompt)}</p><p class="at-muted">La corrección compara columnas, número de filas y valores con una consulta de referencia ejecutada sobre la misma base.</p></div>
      <div class="at-grid"><div class="at-card"><h3>Tu SQL</h3><textarea class="at-sql" id="at-sql">${esc(c.starter)}</textarea><div class="at-toolbar" style="margin-top:10px"><button class="at-btn" id="at-check">▶ Ejecutar y verificar</button><button class="at-btn alt" id="at-run">Ejecutar sin evaluar</button><button class="at-btn alt" id="at-hint">Pista 1/${c.hints.length}</button></div><div id="at-hintbox" class="at-hint" hidden></div></div>
      <div class="at-card"><h3>Resultado</h3><div id="at-feedback" class="at-feedback"></div><div id="at-result" style="margin-top:10px"><span class="at-muted">La base se carga al ejecutar.</span></div></div></div>
      <div class="at-card at-teacher" hidden><h3>Modo docente · solución y evidencia esperada</h3><pre class="at-json">${esc(c.solution)}</pre><div id="at-expected" class="at-muted">La salida esperada se calculará con dvdrental.</div></div>`);
  }
  function bindSql(c) {
    const ed = overlay.querySelector('#at-sql'), result = overlay.querySelector('#at-result'), fb = overlay.querySelector('#at-feedback');
    let hint = 0;
    async function execute(check) {
      fb.className = 'at-feedback show info'; fb.textContent = 'Cargando motor y ejecutando sobre dvdrental…';
      try {
        const sql = ed.value;
        if (!readonly(sql)) throw new Error('El playground de S2–S5 es de solo lectura. Usa SELECT/WITH; no se permiten cambios sobre la base.');
        const db = await loadDb();
        const actual = firstResult(db.exec(sql));
        result.innerHTML = tableHTML(actual);
        if (!check) { fb.className='at-feedback show info'; fb.textContent='Consulta ejecutada. Ahora verifica cuando quieras comparar con el objetivo.'; return; }
        const expected = firstResult(db.exec(c.solution));
        if (sameResult(actual, expected)) {
          fb.className='at-feedback show ok'; fb.innerHTML='<b>✓ Correcto.</b> Columnas, filas, orden y valores coinciden con el objetivo.'; complete(MISSIONS[SESSION]);
        } else {
          let msg = `La consulta es válida, pero la salida todavía no coincide. Obtuviste ${actual.values.length} fila(s); el objetivo tiene ${expected.values.length}.`;
          if (SESSION === '4' && actual.values.length < expected.values.length) msg += ' Probablemente perdiste películas sin alquiler: revisa si tus JOIN deben ser LEFT JOIN.';
          if ((SESSION === '4' || SESSION === '5') && actual.values.length > expected.values.length) msg += ' Estás multiplicando el grano: la salida final debe quedar en una fila por película.';
          if (actual.columns.length === expected.columns.length && actual.columns.some((x,i)=>x.toLowerCase()!==expected.columns[i].toLowerCase())) msg += ` Revisa los nombres/orden de columnas: se esperan ${expected.columns.join(', ')}.`;
          fb.className='at-feedback show bad'; fb.textContent=msg;
        }
        const exp = overlay.querySelector('#at-expected'); if (exp) exp.textContent = `Esperado: ${expected.columns.join(', ')} · ${expected.values.length} fila(s).`;
      } catch (e) { fb.className='at-feedback show bad'; fb.textContent = `No se pudo evaluar: ${e.message}`; }
    }
    overlay.querySelector('#at-check').onclick = () => execute(true);
    overlay.querySelector('#at-run').onclick = () => execute(false);
    overlay.querySelector('#at-hint').onclick = () => {
      const box = overlay.querySelector('#at-hintbox'); box.hidden=false; box.textContent=c.hints[Math.min(hint,c.hints.length-1)]; hint=Math.min(hint+1,c.hints.length-1); overlay.querySelector('#at-hint').textContent=`Pista ${Math.min(hint+1,c.hints.length)}/${c.hints.length}`;
    };
    if (state.mode === 'teacher') loadDb().then(db => { const ex=firstResult(db.exec(c.solution)); const x=overlay.querySelector('#at-expected'); if(x)x.textContent=`Esperado: ${ex.columns.join(', ')} · ${ex.values.length} fila(s).`; }).catch(()=>{});
  }

  function s7HTML() {
    const rel = (id,a,b) => `<div class="at-erd"><div class="at-entity">${a}</div><div class="at-rel"><select class="at-select" id="${id}"><option value="">elige cardinalidad…</option><option>1:1</option><option>1:N</option><option>N:1</option><option>N:M</option></select></div><div class="at-entity">${b}</div></div>`;
    return shell('ERD interactivo · convierte reglas en cardinalidades', `<div class="at-card at-prompt"><h3>Restaurante ABC</h3><p>Modifica las cardinalidades. No estás dibujando “lo bonito”: estás traduciendo reglas de negocio a un modelo.</p></div><div class="at-card">${rel('r1','Cliente','Pedido')}${rel('r2','Mesa','Pedido')}${rel('r3','Pedido','Producto')}<div class="at-toolbar"><button class="at-btn" id="at-erd-check">Validar modelo</button></div><div id="at-feedback" class="at-feedback"></div></div><div class="at-card at-teacher" hidden><h3>Modo docente</h3><p>Cliente 1:N Pedido · Mesa 1:N Pedido · Pedido N:M Producto. La N:M se resuelve con una entidad asociativa como <b>DetallePedido</b>.</p></div>`);
  }
  function bindS7() {
    overlay.querySelector('#at-erd-check').onclick=()=>{ const vals=['r1','r2','r3'].map(id=>overlay.querySelector('#'+id).value); const ok=vals[0]==='1:N'&&vals[1]==='1:N'&&vals[2]==='N:M'; const fb=overlay.querySelector('#at-feedback'); fb.className='at-feedback show '+(ok?'ok':'bad'); fb.textContent=ok?'✓ Modelo coherente. La relación Pedido–Producto necesita DetallePedido para guardar cantidad/precio.':'Aún hay una regla mal traducida. Pregunta: ¿cuántos pedidos puede tener un cliente?, ¿cuántos pedidos puede atender una mesa?, ¿un pedido puede tener muchos productos y un producto estar en muchos pedidos?'; if(ok) complete(MISSIONS[SESSION]); };
  }

  function s8HTML(){
    return shell('Cardinalidad bajo supuestos · el modelo cambia cuando cambia el negocio', `<div class="at-card at-prompt"><h3>Mesero ↔ Mesa</h3><p>Modela dos periodos distintos. La misma pareja de entidades puede necesitar relaciones diferentes.</p></div><div class="at-grid"><div class="at-card"><h3>Caso A · mesero fijo durante el periodo</h3><p>Cada mesa tiene un solo mesero responsable en el periodo; un mesero atiende varias mesas.</p><select id="s8a" class="at-select"><option value="">elige…</option><option>1:1</option><option>1:N</option><option>N:M</option></select></div><div class="at-card"><h3>Caso B · cambia por turno</h3><p>Una mesa puede ser atendida por distintos meseros en turnos distintos, y cada mesero atiende varias mesas.</p><select id="s8b" class="at-select"><option value="">elige…</option><option>1:1</option><option>1:N</option><option>N:M</option></select><div id="s8bridge" class="at-result-box" style="margin-top:10px">La tabla puente aparecerá cuando sea necesaria.</div></div></div><div class="at-toolbar"><button class="at-btn" id="s8check">Validar ambos supuestos</button></div><div id="at-feedback" class="at-feedback"></div><div class="at-card at-teacher" hidden><h3>Modo docente</h3><p>A: 1:N (mesero → mesas) si el supuesto es estable. B: N:M a lo largo del tiempo; conviene <code>asignacion_mesa_mesero(mesero_id, mesa_id, turno/desde/hasta)</code>.</p></div>`);
  }
  function bindS8(){ const b=overlay.querySelector('#s8b'),bridge=overlay.querySelector('#s8bridge'); const paint=()=>bridge.innerHTML=b.value==='N:M'?'<b>Tabla asociativa:</b> asignacion_mesa_mesero<br><span class="at-muted">mesero_id · mesa_id · turno · desde/hasta</span>':'La tabla puente aparecerá cuando sea necesaria.'; b.onchange=paint; overlay.querySelector('#s8check').onclick=()=>{const ok=overlay.querySelector('#s8a').value==='1:N'&&b.value==='N:M';const fb=overlay.querySelector('#at-feedback');fb.className='at-feedback show '+(ok?'ok':'bad');fb.textContent=ok?'✓ Correcto. Cambió el supuesto temporal y cambió el modelo.':'Revisa el tiempo: en B una mesa puede relacionarse con varios meseros a lo largo de distintos turnos.';if(ok)complete(MISSIONS[SESSION]);}; }

  function s10HTML(){
    const field=(id,label,opts)=>`<label>${label}<select class="at-select" id="${id}"><option value="">sin información</option>${opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label>`;
    return shell('Selector de requisitos · SQL, documentos o “aún no sé”', `<div class="at-card at-prompt"><h3>No decidas por volumen</h3><p>“Tenemos 50 millones de registros” no basta. Selecciona evidencia de acceso, consistencia, forma y transacciones.</p><div class="at-toolbar"><button class="at-btn alt at-preset" data-p="volume">Solo 50M</button><button class="at-btn alt at-preset" data-p="billing">Facturación</button><button class="at-btn alt at-preset" data-p="cart">Carrito mutable</button></div></div><div class="at-card"><div class="at-fields">${field('d1','Patrón de acceso',[['join','Cruces/reportes entre entidades'],['doc','Leer/escribir agregado completo']])}${field('d2','Consistencia',[['strict','Fuerte / transaccional'],['eventual','Eventual aceptable']])}${field('d3','Forma y evolución',[['stable','Esquema estable'],['flex','Estructura cambia con frecuencia']])}${field('d4','Transacciones multi-entidad',[['yes','Sí, son críticas'],['no','No son necesarias']])}</div><div id="decision" class="at-result-box" style="margin-top:12px"></div></div><div class="at-card at-teacher" hidden><h3>Modo docente</h3><p>La herramienta no enseña “SQL vs NoSQL” como dicotomía por tamaño. Con datos incompletos responde <b>información insuficiente</b>; con requisitos explícitos argumenta la recomendación.</p></div>`);
  }
  function bindS10(){
    const ids=['d1','d2','d3','d4'], out=overlay.querySelector('#decision');
    function rec(){ const v=ids.map(id=>overlay.querySelector('#'+id).value); if(v.some(x=>!x)){out.innerHTML='<b>Información insuficiente.</b><br><span class="at-muted">Faltan requisitos; el volumen por sí solo no decide la familia de base.</span>';return false;} let sql=0,doc=0; if(v[0]==='join')sql+=2;else doc+=2;if(v[1]==='strict')sql+=2;else doc++;if(v[2]==='stable')sql++;else doc+=2;if(v[3]==='yes')sql+=2;else doc++; const choice=sql===doc?'Arquitectura híbrida / investigar más':sql>doc?'Relacional (SQL)':'Documentos';out.innerHTML=`<b>Recomendación razonada: ${choice}</b><br><span class="at-muted">Puntaje orientativo SQL ${sql} · documentos ${doc}. La decisión final depende de restricciones reales.</span>`; state.meta.s10full=true; saveState(); maybeComplete(); return true; }
    function maybeComplete(){ if(state.meta.s10volume && state.meta.s10full) complete(MISSIONS[SESSION]); }
    ids.forEach(id=>overlay.querySelector('#'+id).onchange=rec);
    overlay.querySelectorAll('.at-preset').forEach(b=>b.onclick=()=>{ const p=b.dataset.p; const vals=p==='billing'?['join','strict','stable','yes']:p==='cart'?['doc','eventual','flex','no']:['','','','']; ids.forEach((id,i)=>overlay.querySelector('#'+id).value=vals[i]); if(p==='volume'){state.meta.s10volume=true;saveState();out.innerHTML='<b>50 millones de registros → información insuficiente.</b><br><span class="at-muted">Pregunta por patrones de acceso, consistencia, forma y transacciones antes de escoger tecnología.</span>';maybeComplete();}else rec(); });
    rec();
  }

  function s12HTML(){
    const role=(id,name)=>`<div class="at-role"><b>${name}</b><select id="${id}" class="at-select"><option value="">clasifica…</option><option value="fact">Hechos</option><option value="dim">Dimensión</option></select></div>`;
    return shell('Simulador de grano y esquema estrella', `<div class="at-card at-prompt"><h3>Pregunta analítica</h3><p>“¿Cuántas unidades de cada producto vendimos por fecha y cliente?” Primero decide qué representa <b>una fila</b>; luego organiza hechos y dimensiones.</p></div><div class="at-grid"><div class="at-card"><h3>1 · Elige el grano</h3><select id="grain" class="at-select"><option value="">una fila = …</option><option value="order">un pedido</option><option value="item">un producto dentro de un pedido</option><option value="event">un evento del pedido</option></select><div id="grainout" class="at-result-box" style="margin-top:10px">100 pedidos de ejemplo.</div></div><div class="at-card"><h3>2 · Construye la estrella</h3>${role('star1','ventas_detalle')}${role('star2','fecha')}${role('star3','cliente')}${role('star4','producto')}</div></div><div class="at-toolbar"><button id="s12check" class="at-btn">Validar diseño</button></div><div id="at-feedback" class="at-feedback"></div><div class="at-card at-teacher" hidden><h3>Modo docente</h3><p>Grano: una fila por producto del pedido. <b>ventas_detalle</b> es hechos; fecha, cliente y producto son dimensiones. El grano se declara antes de elegir medidas o hacer JOIN.</p></div>`);
  }
  function bindS12(){ const g=overlay.querySelector('#grain'),out=overlay.querySelector('#grainout');g.onchange=()=>{const map={order:'100 filas · pierde detalle por producto',item:'≈300 filas · conserva producto, fecha, cliente y unidades',event:'≈500 filas · demasiado fino para esta pregunta'};out.textContent=map[g.value]||'100 pedidos de ejemplo.';};overlay.querySelector('#s12check').onclick=()=>{const ok=g.value==='item'&&overlay.querySelector('#star1').value==='fact'&&['star2','star3','star4'].every(id=>overlay.querySelector('#'+id).value==='dim');const fb=overlay.querySelector('#at-feedback');fb.className='at-feedback show '+(ok?'ok':'bad');fb.textContent=ok?'✓ Grano y estrella coherentes con la pregunta analítica.':'Aún no. Empieza por “una fila = …”. Después identifica dónde viven las medidas y dónde los atributos descriptivos.';if(ok)complete(MISSIONS[SESSION]);}; }

  function s13HTML(){
    return shell('Simulador BigQuery · partición, clustering y bytes', `<div class="at-card at-prompt"><h3>Patrón de consulta</h3><p>Tabla anual de 365 GB. La mayoría de consultas filtra <b>7 días</b> y luego un <b>customer_id</b>. ¿Cómo organizarías físicamente la tabla?</p></div><div class="at-fields"><label>Partición<select id="part" class="at-select"><option value="none">Sin partición</option><option value="date">fecha</option><option value="customer">customer_id</option></select></label><label>Clustering<select id="cluster" class="at-select"><option value="none">Sin clustering</option><option value="customer">customer_id</option><option value="date">fecha</option></select></label><label><span>LIMIT</span><select id="lim" class="at-select"><option value="no">Sin LIMIT</option><option value="yes">LIMIT 100</option></select></label></div><div class="at-card"><h3>Estimación didáctica de bytes leídos</h3><div class="at-simbar"><i id="bytesbar"></i></div><p id="bytes" style="font-size:26px;font-weight:900;margin:10px 0"></p><p id="bytesnote" class="at-muted"></p></div><div class="at-toolbar"><button id="s13check" class="at-btn">Validar diseño</button></div><div id="at-feedback" class="at-feedback"></div><div class="at-card at-teacher" hidden><h3>Modo docente</h3><p>Para este patrón: particionar por fecha y clusterizar por customer_id. <code>LIMIT</code> limita filas devueltas, pero no garantiza reducir bytes escaneados.</p></div>`);
  }
  function bindS13(){ const p=overlay.querySelector('#part'),c=overlay.querySelector('#cluster'),l=overlay.querySelector('#lim'),bar=overlay.querySelector('#bytesbar'),txt=overlay.querySelector('#bytes'),note=overlay.querySelector('#bytesnote');function calc(){let gb=365;if(p.value==='date')gb=7;if(p.value==='customer')gb=365*0.35;if(c.value==='customer'&&p.value==='date')gb*=0.25;else if(c.value!=='none')gb*=0.65;bar.style.width=Math.max(2,gb/365*100)+'%';txt.textContent=gb.toFixed(gb<10?2:1)+' GB estimados';note.textContent=l.value==='yes'?'LIMIT 100 cambia la salida, no esta estimación de bytes procesados.':'Cambia las opciones y observa qué condición permite pruning.';}[p,c,l].forEach(x=>x.onchange=calc);calc();overlay.querySelector('#s13check').onclick=()=>{const ok=p.value==='date'&&c.value==='customer';const fb=overlay.querySelector('#at-feedback');fb.className='at-feedback show '+(ok?'ok':'bad');fb.textContent=ok?'✓ Diseño alineado con el patrón de filtros: partición para podar días y clustering para localizar customer_id dentro de las particiones.':'Revisa el patrón dominante: primero acotas un rango de fechas y dentro de ese rango filtras customer_id.';if(ok)complete(MISSIONS[SESSION]);}; }

  function s14HTML(){
    const json=`{\n  "pedido_id": 101,\n  "cliente": "Ana",\n  "items": [\n    {"producto":"A","cantidad":2},\n    {"producto":"B","cantidad":1}\n  ]\n}`;
    return shell('Simulador UNNEST · cambia el grano de la fila', `<div class="at-card at-prompt"><h3>Objetivo</h3><p>Partes de una fila por pedido con un ARRAY de items. Necesitas una salida con <b>una fila por producto comprado</b>.</p></div><div class="at-grid"><div class="at-card"><h3>Dato anidado</h3><pre class="at-json">${esc(json)}</pre><label style="display:grid;gap:5px;margin-top:10px;font-weight:800">Grano que necesitas<select id="u-grain" class="at-select"><option value="">elige…</option><option value="order">pedido</option><option value="item">item del pedido</option></select></label><button id="unnest" class="at-btn" style="margin-top:10px">Aplicar UNNEST(items)</button></div><div class="at-card"><h3>Vista de salida</h3><div id="utable"></div></div></div><div id="at-feedback" class="at-feedback"></div><div class="at-card at-teacher" hidden><h3>Modo docente</h3><p><code>UNNEST(items)</code> expande el ARRAY: el grano pasa de pedido a item. En BigQuery suele escribirse <code>FROM pedidos p, UNNEST(p.items) AS item</code>.</p></div>`);
  }
  function bindS14(){ const rowsOrder=[['101','Ana','[A×2, B×1]'],['102','Luis','[C×1, A×1, D×3]']],rowsItem=[['101','Ana','A','2'],['101','Ana','B','1'],['102','Luis','C','1'],['102','Luis','A','1'],['102','Luis','D','3']];let unnested=false;const box=overlay.querySelector('#utable');function draw(){const cols=unnested?['pedido_id','cliente','producto','cantidad']:['pedido_id','cliente','items'];const rows=unnested?rowsItem:rowsOrder;box.innerHTML=`<div class="at-mini-table" style="grid-template-columns:repeat(${cols.length},1fr)">${cols.map(x=>`<div class="at-cell head">${x}</div>`).join('')}${rows.flatMap(r=>r.map(x=>`<div class="at-cell">${x}</div>`)).join('')}</div><p class="at-muted">${rows.length} filas · una fila = ${unnested?'un item':'un pedido'}</p>`;}draw();overlay.querySelector('#unnest').onclick=()=>{unnested=true;draw();const ok=overlay.querySelector('#u-grain').value==='item';const fb=overlay.querySelector('#at-feedback');fb.className='at-feedback show '+(ok?'ok':'info');fb.textContent=ok?'✓ UNNEST produjo el grano requerido: una fila por item.':'UNNEST expandió el ARRAY. Ahora declara explícitamente cuál es el grano que necesitas.';if(ok)complete(MISSIONS[SESSION]);};overlay.querySelector('#u-grain').onchange=()=>{if(unnested&&overlay.querySelector('#u-grain').value==='item'){const fb=overlay.querySelector('#at-feedback');fb.className='at-feedback show ok';fb.textContent='✓ Correcto: una fila por item después de UNNEST.';complete(MISSIONS[SESSION]);}}; }

  function renderCurrent() {
    if (overlay) overlay.remove();
    overlay=document.createElement('div'); overlay.className='at-overlay'; overlay.id='andes-toolkit-overlay';
    let html, binder;
    if (SQL_CHALLENGES[SESSION]) { html=sqlHTML(SQL_CHALLENGES[SESSION]); binder=()=>bindSql(SQL_CHALLENGES[SESSION]); }
    else if(SESSION==='7'){html=s7HTML();binder=bindS7;}
    else if(SESSION==='8'){html=s8HTML();binder=bindS8;}
    else if(SESSION==='10'){html=s10HTML();binder=bindS10;}
    else if(SESSION==='12'){html=s12HTML();binder=bindS12;}
    else if(SESSION==='13'){html=s13HTML();binder=bindS13;}
    else {html=s14HTML();binder=bindS14;}
    overlay.innerHTML=html; document.body.appendChild(overlay); baseEvents(); binder(); setMode(state.mode); updateProgress();
  }

  function patchDownloadLink(){
    const base=decodeURIComponent(location.pathname.split('/').pop());
    document.querySelectorAll('a[download]').forEach(a=>{try{const u=new URL(a.getAttribute('href'),location.href);if(decodeURIComponent(u.pathname.split('/').pop())===base)a.href='__original__/'+encodeURIComponent(base);}catch(_){}});
  }

  function init(){
    injectStyles();
    btn=document.createElement('button');btn.id='andes-toolkit-btn';btn.type='button';document.body.appendChild(btn);updateProgress();
    renderCurrent();btn.onclick=()=>overlay.classList.add('open');
    document.addEventListener('keydown',e=>{if(e.altKey&&e.key.toLowerCase()==='l'){e.preventDefault();overlay.classList.toggle('open');}});
    patchDownloadLink();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
