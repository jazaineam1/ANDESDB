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

const statusEl = document.getElementById('status');
const sqlEl = document.getElementById('sql');
const resultEl = document.getElementById('result');
const metaEl = document.getElementById('meta');
let db;
let conn;
let currentName = 'ventas_dirty.csv';

function status(text) { statusEl.textContent = text; }
function safe(v) { return v == null ? 'NULL' : typeof v === 'bigint' ? v.toString() : String(v); }

async function init() {
  try {
    const bundle = await duckdb.selectBundle(bundles);
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    conn = await db.connect();
    status('✓ DuckDB-Wasm listo. Carga un archivo o usa el dataset de ejemplo.');
  } catch (err) {
    console.error(err);
    status('No fue posible iniciar DuckDB-Wasm. Comprueba que los motores locales estén publicados y recarga la página.');
  }
}

function queryFor(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.parquet')) return `SELECT * FROM '${name}' LIMIT 20;`;
  if (lower.endsWith('.json')) return `SELECT * FROM read_json_auto('${name}') LIMIT 20;`;
  return `SELECT * FROM read_csv_auto('${name}') LIMIT 20;`;
}

async function registerBytes(name, bytes) {
  if (!db) throw new Error('DuckDB todavía no está listo.');
  try { await db.dropFile(name); } catch (_) {}
  await db.registerFileBuffer(name, new Uint8Array(bytes));
  currentName = name;
  sqlEl.value = queryFor(name);
  status(`✓ ${name} cargado en memoria. No se subió a ningún servidor.`);
}

async function loadPreset() {
  status('Cargando dataset de ejemplo…');
  const url = new URL('../Presentaciones/M6/Datos/ventas_dirty.csv', import.meta.url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar el dataset (${res.status}).`);
  await registerBytes('ventas_dirty.csv', await res.arrayBuffer());
}

async function loadFile(file) {
  if (!file) return;
  await registerBytes(file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), await file.arrayBuffer());
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
  metaEl.textContent = `${rows.length} fila(s) materializadas · ${fields.length} columna(s) · ${elapsed.toFixed(1)} ms${rows.length > limit ? ` · mostrando primeras ${limit}` : ''}`;
}

async function run() {
  if (!conn) { status('DuckDB todavía se está preparando.'); return; }
  const sql = sqlEl.value.trim();
  if (!sql) return;
  const start = performance.now();
  try {
    const table = await conn.query(sql);
    renderTable(table, performance.now() - start);
    status('✓ Consulta ejecutada localmente.');
  } catch (err) {
    console.error(err);
    resultEl.innerHTML = `<div class="status" style="padding:14px;color:#991b1b"><b>Error:</b> ${String(err.message || err).replace(/[<>]/g, '')}</div>`;
    metaEl.textContent = '';
    status('La consulta produjo un error. Léelo antes de cambiar código al azar.');
  }
}

document.getElementById('preset').addEventListener('click', () => loadPreset().catch(e => status(e.message)));
document.getElementById('file').addEventListener('change', e => loadFile(e.target.files[0]).catch(err => status(err.message)));
document.getElementById('run').addEventListener('click', run);
document.getElementById('count').addEventListener('click', () => {
  sqlEl.value = currentName.toLowerCase().endsWith('.parquet')
    ? `SELECT COUNT(*) AS filas FROM '${currentName}';`
    : currentName.toLowerCase().endsWith('.json')
      ? `SELECT COUNT(*) AS filas FROM read_json_auto('${currentName}');`
      : `SELECT COUNT(*) AS filas FROM read_csv_auto('${currentName}');`;
});
document.getElementById('schema').addEventListener('click', () => {
  const source = currentName.toLowerCase().endsWith('.parquet') ? `'${currentName}'`
    : currentName.toLowerCase().endsWith('.json') ? `read_json_auto('${currentName}')`
    : `read_csv_auto('${currentName}')`;
  sqlEl.value = `DESCRIBE SELECT * FROM ${source};`;
});

init();
