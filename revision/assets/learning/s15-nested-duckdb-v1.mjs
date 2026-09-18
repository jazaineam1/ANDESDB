import * as duckdb from '../vendor/duckdb/duckdb-browser.mjs';

const base = new URL('../vendor/duckdb/', import.meta.url);
const bundles = {
  mvp:{mainModule:new URL('duckdb-mvp.wasm',base).href,mainWorker:new URL('duckdb-browser-mvp.worker.js',base).href},
  eh:{mainModule:new URL('duckdb-eh.wasm',base).href,mainWorker:new URL('duckdb-browser-eh.worker.js',base).href}
};
let db=null,conn=null,readyError=null;
const stripSql=q=>String(q||'').replace(/--.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'').trim();
function translate(q){
  let sql=stripSql(q).replace(/\x60[^\x60]*casos_nested\x60/gi,'casos_nested');
  const from=sql.match(/\bfrom\s+casos_nested\s+(?:as\s+)?([A-Za-z_]\w*)/i);
  const parent=from?.[1]||'c';
  const re=/unnest\s*\(\s*(?:([A-Za-z_]\w*)\s*\.\s*)?evidencias\s*\)\s+(?:as\s+)?([A-Za-z_]\w*)/i;
  const m=sql.match(re);
  if(!m) throw new Error('No se encontró una expansión de la colección evidencias.');
  const prefix=m[1]||parent,alias=m[2];
  if(prefix!==parent) throw new Error('La colección debe pertenecer al alias de la tabla raíz.');
  sql=sql.replace(re,'UNNEST('+parent+'.evidencias) AS _u('+alias+')');
  return {sql,alias,parent};
}
async function init(){
  try{
    const bundle=await duckdb.selectBundle(bundles);
    const worker=new Worker(bundle.mainWorker);
    db=new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.ERROR),worker);
    await db.instantiate(bundle.mainModule,bundle.pthreadWorker);
    conn=await db.connect();
    const res=await fetch(new URL('../../Plantillas/proyecto-final/Datos/evidencias.json',import.meta.url),{cache:'no-store'});
    const txt=await res.text();
    await db.registerFileText('s15-evidencias.json',txt);
    await conn.query("CREATE OR REPLACE TABLE casos_nested AS SELECT * FROM read_json_auto('s15-evidencias.json');");
    return true;
  }catch(e){readyError=e;console.error('S15 DuckDB',e);return false}
}
const ready=init();
async function validate(q){
  const ok=await ready;if(!ok)throw new Error('DuckDB-Wasm no pudo iniciar: '+String(readyError?.message||readyError||'error'));
  const {sql}=translate(q);
  if(!/^\s*(select|with)\b/i.test(sql))throw new Error('Solo se admite una consulta SELECT/WITH.');
  if(/\b(insert|update|delete|drop|alter|create|copy|attach|detach)\b/i.test(sql))throw new Error('Solo lectura.');
  const table=await conn.query(sql);
  const fields=table.schema.fields.map(f=>f.name),rows=table.toArray();
  return {ok:true,sql,fields,rows:rows.slice(0,40).map(r=>fields.map(f=>r[f]==null?null:typeof r[f]==='bigint'?r[f].toString():r[f]))};
}
window.S15NestedDuckDB={ready,validate,translate,stripSql};
