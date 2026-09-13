/* ANDESDB SQL worker: keeps SQL.js + dvdrental off the UI thread. */
'use strict';
let db=null,readyPromise=null;
const normalize=v=>{if(v===null)return null;if(typeof v==='number')return Number.isInteger(v)?v:Number(v.toFixed(8));return String(v)};
function shape(r){if(!r?.length)return{columns:[],values:[]};return{columns:r[0].columns.map(x=>String(x).trim().toLowerCase()),values:r[0].values.map(row=>row.map(normalize))}}
function rowsKey(values){return values.map(r=>JSON.stringify(r)).sort().join('\n')}
function has(sql,re){return re.test(String(sql||''))}
function clauseHints(sql,reference){
  const checks=[
    ['WHERE',/\bwhere\b/i,'un filtro WHERE'],
    ['ORDER BY',/\border\s+by\b/i,'un ORDER BY'],
    ['LIMIT',/\blimit\b/i,'un LIMIT'],
    ['DISTINCT',/\bdistinct\b/i,'DISTINCT'],
    ['GROUP BY',/\bgroup\s+by\b/i,'un GROUP BY'],
    ['HAVING',/\bhaving\b/i,'un HAVING'],
    ['JOIN',/\b(?:inner\s+|left\s+|right\s+|full\s+)?join\b/i,'un JOIN'],
    ['WITH',/^\s*with\b/i,'una CTE con WITH']
  ];
  return checks.filter(([,re])=>has(reference,re)&&!has(sql,re)).map(([name,,label])=>({name,label}));
}
function diagnose(got,expected,sql,reference){
  const issues=[],ok=[];
  const sameColumns=JSON.stringify(got.columns)===JSON.stringify(expected.columns);
  const sameRowCount=got.values.length===expected.values.length;
  const sameRowsAnyOrder=sameColumns&&sameRowCount&&rowsKey(got.values)===rowsKey(expected.values);
  if(sameColumns)ok.push(`Las columnas ya coinciden (${expected.columns.join(', ')||'sin columnas'}).`);
  else{
    issues.push(`Columnas: tu salida tiene ${got.columns.length} (${got.columns.join(', ')||'ninguna'}); la consigna espera ${expected.columns.length} (${expected.columns.join(', ')||'ninguna'}).`);
    if(has(sql,/\bselect\s+\*/i)&&!has(reference,/\bselect\s+\*/i))issues.push('Estás usando SELECT *: devuelve columnas que la consigna no pidió. Selecciona solo las columnas solicitadas.');
  }
  if(sameRowCount)ok.push(`La cantidad de filas coincide (${expected.values.length}).`);
  else issues.push(`Filas: tu consulta devuelve ${got.values.length}; el objetivo devuelve ${expected.values.length}. Revisa filtros, agrupación y/o límite.`);
  if(sameRowsAnyOrder&&JSON.stringify(got.values)!==JSON.stringify(expected.values))issues.push('El conjunto de filas es correcto, pero el orden no. Revisa ORDER BY y, si hay empates, el segundo criterio de orden.');
  if(sameColumns&&sameRowCount&&!sameRowsAnyOrder){
    let mismatch=null;
    outer:for(let r=0;r<got.values.length;r++)for(let c=0;c<got.columns.length;c++)if(JSON.stringify(got.values[r][c])!==JSON.stringify(expected.values[r][c])){mismatch={row:r+1,column:got.columns[c]||`columna ${c+1}`};break outer}
    issues.push(`La forma del resultado ya es correcta, pero cambian los valores${mismatch?` desde la fila ${mismatch.row}, columna ${mismatch.column}`:''}. Revisa la condición, el JOIN o el cálculo, no solo la sintaxis.`);
  }
  const missing=clauseHints(sql,reference);
  if(missing.length)issues.push(`La consigna puede requerir ${missing.map(x=>x.label).join(', ')}. Tu consulta todavía no expresa ${missing.length===1?'esa parte':'esas partes'} de forma explícita.`);
  if(!issues.length)issues.push('La consulta está muy cerca: revisa alias, tipos y orden exacto de las columnas.');
  return{sameColumns,sameRowCount,sameRowsAnyOrder,gotColumns:got.columns,expectedColumns:expected.columns,gotRows:got.values.length,expectedRows:expected.values.length,issues:issues.slice(0,4),ok:ok.slice(0,2)};
}
function ensureReady(){
  if(db)return Promise.resolve(db);
  if(readyPromise)return readyPromise;
  readyPromise=(async()=>{
    importScripts(new URL('../vendor/sqljs/sql-wasm.js',self.location.href).href);
    const SQL=await self.initSqlJs({locateFile:f=>new URL(`../vendor/sqljs/${f}`,self.location.href).href});
    const r=await fetch(new URL('../../Presentaciones/M2/base-datos/dvdrental.db',self.location.href).href,{cache:'force-cache'});
    if(!r.ok)throw new Error('No se pudo cargar dvdrental.db');
    db=new SQL.Database(new Uint8Array(await r.arrayBuffer()));
    return db;
  })().catch(e=>{readyPromise=null;throw e});
  return readyPromise;
}
async function handle(msg){
  const database=await ensureReady();
  if(msg.op==='prepare')return{ready:true};
  if(msg.op==='run')return{result:shape(database.exec(msg.sql))};
  if(msg.op==='explain'){database.exec(`EXPLAIN QUERY PLAN ${msg.sql}`);return{valid:true}};
  if(msg.op==='validate'){
    const got=shape(database.exec(msg.sql)),expected=shape(database.exec(msg.reference)),match=JSON.stringify(got)===JSON.stringify(expected);
    return{got,match,diagnostic:match?null:diagnose(got,expected,msg.sql,msg.reference)};
  }
  throw new Error('Operación SQL no soportada');
}
self.onmessage=async ev=>{
  const {id,...msg}=ev.data||{};
  try{const data=await handle(msg);self.postMessage({id,ok:true,...data})}
  catch(e){self.postMessage({id,ok:false,error:String(e?.message||e||'Error SQL')})}
};