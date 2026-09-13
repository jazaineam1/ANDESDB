(()=>{
'use strict';
if(window.__ANDES_PRESENTATION_LMS_SYNC__)return;window.__ANDES_PRESENTATION_LMS_SYNC__=true;
const KEY='andesdb.revision.toolkit.v1',EVENT='andesdb:toolkit-state';
const nativeGet=Storage.prototype.getItem,nativeSet=Storage.prototype.setItem,nativeRemove=Storage.prototype.removeItem;
try{const old=nativeGet.call(localStorage,KEY);if(old&&!nativeGet.call(sessionStorage,KEY))nativeSet.call(sessionStorage,KEY,old);nativeRemove.call(localStorage,KEY)}catch{}
if(!Storage.prototype.__andesToolkitSessionOnly){
  const g=Storage.prototype.getItem,s=Storage.prototype.setItem,r=Storage.prototype.removeItem;
  Storage.prototype.getItem=function(k){if(this===localStorage&&k===KEY)return g.call(sessionStorage,k);return g.call(this,k)};
  Storage.prototype.setItem=function(k,v){
    if(this===localStorage&&k===KEY){const out=s.call(sessionStorage,k,v);queueMicrotask(()=>window.dispatchEvent(new CustomEvent(EVENT)));return out}
    return s.call(this,k,v)
  };
  Storage.prototype.removeItem=function(k){
    if(this===localStorage&&k===KEY){const out=r.call(sessionStorage,k);queueMicrotask(()=>window.dispatchEvent(new CustomEvent(EVENT)));return out}
    return r.call(this,k)
  };
  Object.defineProperty(Storage.prototype,'__andesToolkitSessionOnly',{value:true,configurable:false});
}
const read=()=>{try{return JSON.parse(nativeGet.call(sessionStorage,KEY)||'{}')}catch{return{}}},write=x=>{try{nativeSet.call(sessionStorage,KEY,JSON.stringify(x))}catch{}};
const PRIMARY={1:'s1-diagnostico',2:'sql-s2',3:'sql-s3',4:'sql-s4',5:'sql-s5',6:'s6-reglas-evidencia',7:'erd-s7',8:'erd-s8',9:'s9-constraints',10:'decision-s10',11:'s11-documentos',12:'warehouse-s12',13:'bigquery-s13',14:'unnest-s14',15:'s15-integrador',16:'s16-dp900'};
const SESSION_BY_ACTIVITY=new Map(Object.entries(PRIMARY).map(([n,id])=>[id,Number(n)])),synced=new Set();
let syncing=false,queued=false,copyTimer=null,toolkitObserver=null;
function fixCopy(){
  const root=document.getElementById('andes-toolkit-overlay');if(!root)return false;
  root.querySelectorAll('.at-toolbar .at-muted').forEach(x=>x.innerHTML='El progreso académico se guarda en <b>tu cuenta ANDESDB</b>; este panel usa solo una caché temporal de la pestaña.');
  root.querySelectorAll('.at-complete').forEach(x=>{if(!x.hidden)x.textContent='✓ Reto logrado y sincronizado con tu cuenta.'});
  root.querySelectorAll('.at-reset').forEach(x=>{x.textContent='Restablecer panel';x.title='Solo reinicia la interfaz temporal; no borra el progreso académico guardado.'});
  if(!toolkitObserver){toolkitObserver=new MutationObserver(()=>{clearTimeout(copyTimer);copyTimer=setTimeout(fixCopy,80)});toolkitObserver.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']})}
  return true;
}
async function boot(){
  let api=window.ANDES_LMS;for(let i=0;!api&&i<80;i++){await new Promise(r=>setTimeout(r,50));api=window.ANDES_LMS}if(!api)return;
  const user=await api.ready();if(!user)return;
  try{
    const d=await api.dashboard('me',false),state=read();state.completed||={};
    for(const x of d.activity_progress||[])if(x.status==='completed'&&SESSION_BY_ACTIVITY.has(x.activity_code)){state.completed[x.activity_code]=x.completed_at||true;synced.add(x.activity_code)}
    write(state);
  }catch{}
  const sync=async()=>{
    if(syncing){queued=true;return}syncing=true;
    try{
      const st=read();
      for(const id of Object.keys(st.completed||{})){
        if(synced.has(id)||!SESSION_BY_ACTIVITY.has(id))continue;
        synced.add(id);
        try{await api.complete(id,1,{source:'presentation-toolkit'},SESSION_BY_ACTIVITY.get(id))}catch{synced.delete(id)}
      }
    }finally{syncing=false;if(queued){queued=false;queueMicrotask(sync)}}
    fixCopy();
  };
  await sync();
  addEventListener(EVENT,()=>{clearTimeout(copyTimer);copyTimer=setTimeout(sync,120)});
  let tries=0;const find=setInterval(()=>{if(fixCopy()||++tries>30)clearInterval(find)},200);
}
boot().catch(()=>{});
})();