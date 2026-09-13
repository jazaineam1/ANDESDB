(()=>{
'use strict';
if(window.ANDES_SQL_ENGINE)return;
let worker=null,seq=0,ready=false,preparing=null;
const pending=new Map();
function reset(reason='Motor SQL reiniciado'){
  try{worker?.terminate()}catch(_){ }
  worker=null;ready=false;preparing=null;
  for(const [id,p] of pending){clearTimeout(p.timer);p.reject(new Error(reason));pending.delete(id)}
}
function start(){
  if(worker)return worker;
  const base=document.currentScript?.src||new URL('assets/learning/lab-sql-engine-v1.js',location.href).href;
  worker=new Worker(new URL('lab-sql-worker-v1.js?v=20260913-mobile2',base));
  worker.onmessage=ev=>{const m=ev.data||{},p=pending.get(m.id);if(!p)return;clearTimeout(p.timer);pending.delete(m.id);m.ok?p.resolve(m):p.reject(new Error(m.error||'Error SQL'))};
  worker.onerror=e=>{console.error('ANDESDB SQL worker',e);reset('El motor SQL se reinició por un error. Intenta de nuevo.')};
  return worker;
}
function call(op,payload={},timeoutMs=9000){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{const p=pending.get(id);if(!p)return;pending.delete(id);try{worker?.terminate()}catch(_){ }worker=null;ready=false;preparing=null;reject(new Error('La operación SQL tardó demasiado. El motor se reinició; intenta de nuevo.'))},timeoutMs);pending.set(id,{resolve,reject,timer});try{start().postMessage({id,op,...payload})}catch(e){clearTimeout(timer);pending.delete(id);reset();reject(e)}})}
function prepare(){if(ready)return Promise.resolve(true);if(preparing)return preparing;preparing=call('prepare',{},15000).then(()=>{ready=true;preparing=null;window.dispatchEvent(new Event('andesdb:sql-ready'));return true}).catch(e=>{preparing=null;throw e});return preparing}
async function run(sql){await prepare();return (await call('run',{sql},9000)).result}
async function explain(sql){await prepare();return (await call('explain',{sql},7000)).valid}
async function validate(sql,reference){await prepare();const r=await call('validate',{sql,reference},10000);return{got:r.got,match:r.match}}
function isReady(){return ready}
window.ANDES_SQL_ENGINE={version:'1.1.0',prepare,run,explain,validate,isReady,reset};
})();