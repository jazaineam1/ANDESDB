(()=>{
'use strict';
if(window.ANDES_SQL_ENGINE)return;
let worker=null,seq=0,ready=false,preparing=null;
const pending=new Map();
function start(){
  if(worker)return worker;
  worker=new Worker(new URL('lab-sql-worker-v1.js?v=20260913-mobile1',document.currentScript?.src||location.href));
  worker.onmessage=ev=>{const m=ev.data||{},p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.ok?p.resolve(m):p.reject(new Error(m.error||'Error SQL'))};
  worker.onerror=e=>{for(const p of pending.values())p.reject(new Error('No se pudo iniciar el motor SQL.'));pending.clear();console.error('ANDESDB SQL worker',e)};
  return worker;
}
function call(op,payload={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});start().postMessage({id,op,...payload})})}
function prepare(){if(ready)return Promise.resolve(true);if(preparing)return preparing;preparing=call('prepare').then(()=>{ready=true;window.dispatchEvent(new Event('andesdb:sql-ready'));return true}).catch(e=>{preparing=null;throw e});return preparing}
async function run(sql){await prepare();return (await call('run',{sql})).result}
async function explain(sql){await prepare();return (await call('explain',{sql})).valid}
async function validate(sql,reference){await prepare();const r=await call('validate',{sql,reference});return{got:r.got,match:r.match}}
function isReady(){return ready}
window.ANDES_SQL_ENGINE={version:'1.0.0',prepare,run,explain,validate,isReady};
})();