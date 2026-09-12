(()=>{
'use strict';
if(window.__ANDES_PRESENTATION_LMS_SYNC__)return;window.__ANDES_PRESENTATION_LMS_SYNC__=true;
const KEY='andesdb.revision.toolkit.v1';
const nativeGet=Storage.prototype.getItem,nativeSet=Storage.prototype.setItem,nativeRemove=Storage.prototype.removeItem;
try{const old=nativeGet.call(localStorage,KEY);if(old&&!nativeGet.call(sessionStorage,KEY))nativeSet.call(sessionStorage,KEY,old);nativeRemove.call(localStorage,KEY)}catch{}
if(!Storage.prototype.__andesToolkitSessionOnly){
  const g=Storage.prototype.getItem,s=Storage.prototype.setItem,r=Storage.prototype.removeItem;
  Storage.prototype.getItem=function(k){if(this===localStorage&&k===KEY)return g.call(sessionStorage,k);return g.call(this,k)};
  Storage.prototype.setItem=function(k,v){if(this===localStorage&&k===KEY)return s.call(sessionStorage,k,v);return s.call(this,k,v)};
  Storage.prototype.removeItem=function(k){if(this===localStorage&&k===KEY)return r.call(sessionStorage,k);return r.call(this,k)};
  Object.defineProperty(Storage.prototype,'__andesToolkitSessionOnly',{value:true,configurable:false});
}
const read=()=>{try{return JSON.parse(nativeGet.call(sessionStorage,KEY)||'{}')}catch{return{}}},write=x=>{try{nativeSet.call(sessionStorage,KEY,JSON.stringify(x))}catch{}};
function currentSession(){const m=(location.pathname+' '+document.title).match(/sesion[-_\s]*(\d{1,2})/i);return m?Number(m[1]):null}
const PRIMARY={1:'s1-diagnostico',2:'sql-s2',3:'sql-s3',4:'sql-s4',5:'sql-s5',6:'s6-reglas-evidencia',7:'erd-s7',8:'erd-s8',9:'s9-constraints',10:'decision-s10',11:'s11-documentos',12:'warehouse-s12',13:'bigquery-s13',14:'unnest-s14',15:'s15-integrador',16:'s16-dp900'};
const synced=new Set();
function fixCopy(){document.querySelectorAll('#andes-toolkit-overlay .at-toolbar .at-muted').forEach(x=>x.innerHTML='El progreso académico se guarda en <b>tu cuenta ANDESDB</b>; este panel usa solo una caché temporal de la pestaña.');document.querySelectorAll('#andes-toolkit-overlay .at-complete').forEach(x=>{if(!x.hidden)x.textContent='✓ Reto logrado y sincronizado con tu cuenta.'});document.querySelectorAll('#andes-toolkit-overlay .at-reset').forEach(x=>{x.textContent='Restablecer panel';x.title='Solo reinicia la interfaz temporal; no borra el progreso académico guardado.'})}
async function boot(){let api=window.ANDES_LMS;for(let i=0;!api&&i<80;i++){await new Promise(r=>setTimeout(r,50));api=window.ANDES_LMS}if(!api)return;const user=await api.ready();if(!user)return;try{const d=await api.dashboard('me',true),state=read();state.completed||={};for(const x of d.activity_progress||[])if(x.status==='completed'&&Object.values(PRIMARY).includes(x.activity_code))state.completed[x.activity_code]=x.completed_at||true;write(state)}catch{}
  const sync=async()=>{const st=read(),n=currentSession();for(const id of Object.keys(st.completed||{})){if(synced.has(id)||!Object.values(PRIMARY).includes(id))continue;synced.add(id);try{await api.complete(id,1,{source:'presentation-toolkit'},n)}catch{synced.delete(id)}}fixCopy()};await sync();setInterval(sync,900);new MutationObserver(fixCopy).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']})}
boot();
})();