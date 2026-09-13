/* ANDESDB SQL worker: keeps SQL.js + dvdrental off the UI thread. */
'use strict';
let db=null,readyPromise=null;
const normalize=v=>{if(v===null)return null;if(typeof v==='number')return Number.isInteger(v)?v:Number(v.toFixed(8));return String(v)};
function shape(r){if(!r?.length)return{columns:[],values:[]};return{columns:r[0].columns.map(x=>String(x).trim().toLowerCase()),values:r[0].values.map(row=>row.map(normalize))}}
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
    const got=shape(database.exec(msg.sql)),expected=shape(database.exec(msg.reference));
    return{got,match:JSON.stringify(got)===JSON.stringify(expected)};
  }
  throw new Error('Operación SQL no soportada');
}
self.onmessage=async ev=>{
  const {id,...msg}=ev.data||{};
  try{const data=await handle(msg);self.postMessage({id,ok:true,...data})}
  catch(e){self.postMessage({id,ok:false,error:String(e?.message||e||'Error SQL')})}
};