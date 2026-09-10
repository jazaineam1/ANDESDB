import * as duckdb from '../assets/vendor/duckdb/duckdb-browser.mjs';

const base = new URL('../assets/vendor/duckdb/', import.meta.url);
const bundles = {
  mvp: {
    mainModule: new URL('duckdb-mvp.wasm', base).href,
    mainWorker: new URL('duckdb-browser-mvp.worker.js', base).href
  },
  eh: {
    mainModule: new URL('duckdb-eh.wasm', base).href,
    mainWorker: new URL('duckdb-browser-eh.worker.js', base).href
  }
};

const DATA_BASE = new URL('../Presentaciones/M5/Datos/', import.meta.url);
const TABLES = ['dim_plato', 'dim_mesero', 'dim_fecha', 'fact_venta', 'operacion_pedido_mesa_flat'];

const statusEl = document.getElementById('status');
const sqlEl = document.getElementById('sql');
const resultEl = document.getElementById('result');
const metaEl = document.getElementById('meta');
let db, conn;

function status(text) { statusEl.textContent = text; }
function safe(v) { return v == null ? 'NULL' : typeof v === 'bigint' ? v.toString() : String(v); }

async function init() {
  try {
    status('Cargando DuckDB-Wasm…');
    const bundle = await duckdb.selectBundle(bundles);
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    conn = await db.connect();

    status('Cargando las cinco tablas del Restaurante ABC…');
    for (const name of TABLES) {
      const url = new URL(`${name}.csv`, DATA_BASE);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`No se pudo descargar ${name}.csv (${res.status}).`);
      const bytes = await res.arrayBuffer();
      await db.registerFileBuffer(`${name}.csv`, new Uint8Array(bytes));
      await conn.query(`CREATE OR REPLACE TABLE ${name} AS SELECT * FROM read_csv_auto('${name}.csv');`);
    }
    status('✓ Listo. Las cinco tablas están cargadas: escribe SQL o usa un botón de ejemplo.');
  } catch (err) {
    console.error(err);
    status('No fue posible iniciar el laboratorio. Recarga la página; si persiste, revisa la consola del navegador.');
  }
}

function renderTable(table, elapsed) {
  const fields = table.schema.fields.map(f => f.name);
  const rows = table.toArray();
  const limit = Math.min(rows.length, 200);
  let html = '<table><thead><tr>' + fields.map(f => `<th>${f}</th>`).join('') + '</tr></thead><tbody>';
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    html += '<tr>' + fields.map(f => `<td>${safe(row[f])}</td>`).join('') + '</tr>';
  }
  html += '</tbody></table>';
  resultEl.innerHTML = html;
  metaEl.textContent = `${rows.length} fila(s) · ${fields.length} columna(s) · ${elapsed.toFixed(1)} ms${rows.length > limit ? ` · mostrando primeras ${limit}` : ''}`;
}

async function run() {
  if (!conn) { status('El laboratorio todavía se está preparando.'); return; }
  const sql = sqlEl.value.trim();
  if (!sql) return;
  const start = performance.now();
  try {
    const table = await conn.query(sql);
    renderTable(table, performance.now() - start);
    status('✓ Consulta ejecutada localmente, sobre tus cinco tablas.');
  } catch (err) {
    console.error(err);
    resultEl.innerHTML = `<div class="status" style="padding:14px;color:#991b1b"><b>Error:</b> ${String(err.message || err).replace(/[<>]/g, '')}</div>`;
    metaEl.textContent = '';
    status('La consulta produjo un error. Léelo: dice exactamente qué tabla o columna no encontró.');
  }
}

document.getElementById('run').addEventListener('click', run);
document.querySelectorAll('[data-preset]').forEach(btn => {
  btn.addEventListener('click', () => {
    sqlEl.value = btn.dataset.preset;
    run();
  });
});

init();
