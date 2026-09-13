(()=>{
'use strict';
if(window.__ANDES_LAB_UX_V6__)return;
window.__ANDES_LAB_UX_V6__=true;
const PRIMARY={1:'s1-diagnostico',2:'sql-s2',3:'sql-s3',4:'sql-s4',5:'sql-s5',6:'s6-reglas-evidencia',7:'erd-s7',8:'erd-s8',9:'s9-constraints',10:'decision-s10',11:'s11-documentos',12:'warehouse-s12',13:'bigquery-s13',14:'unnest-s14',15:'s15-integrador',16:'s16-dp900'};
const AUTH='andesdb.lms.auth.v1',PREFIX='andesdb.lab.answers.v2.',remoteCompleted=new Set();
const session=Number(new URLSearchParams(location.search).get('session'))||0;
const codeFor=i=>i===10?PRIMARY[session]:`s${session}-r${i}`;
const safeJSON=(s,f)=>{try{return JSON.parse(s)}catch{return f}};
const owner=()=>{const a=safeJSON(localStorage.getItem(AUTH)||'null',null);return String(a?.user?.id||a?.user?.username||'anonymous').replace(/[^a-zA-Z0-9_-]/g,'_')};
const key=()=>`${PREFIX}${owner()}.s${session}`;
const loadStore=()=>safeJSON(localStorage.getItem(key())||'{}',{})||{};
const saveStore=x=>{try{localStorage.setItem(key(),JSON.stringify(x))}catch(_){}};
const practice=()=>{const m=document.getElementById('task-num')?.textContent?.match(/Práctica\s+(\d+)/i);return m?Number(m[1]):Number(document.querySelector('.steps .current')?.dataset?.step||1)};
const trim=v=>String(v??'').slice(0,6000);
let persistTimer=0,persistPending=false,lastPersistSignature='';
function snapshot(i=practice()){
  const task=window.ANDES_LAB_CONTENT?.sessions?.[session]?.tasks?.[i-1];
  if(!task)return null;
  if(task.type==='sql')return {kind:'sql',value:trim(document.getElementById('sql-editor')?.value||'')};
  if(task.type==='classify')return {kind:'classify',values:[...document.querySelectorAll('[data-classify]')].map(x=>trim(x.value))};
  if(task.type==='order')return {kind:'order',values:[...document.querySelectorAll('.order-row span')].map(x=>trim(x.textContent))};
  return {kind:'text',value:trim(document.getElementById('text-answer')?.value||'')};
}
function put(i,slot,snap){
  if(!session||!i||!snap)return;
  const all=loadStore(),e=all[i]||{};
  e[slot]=snap;e.updated_at=new Date().toISOString();all[i]=e;
  const signature=JSON.stringify(all);
  if(signature===lastPersistSignature)return;
  saveStore(all);lastPersistSignature=signature;
}
function persistDraftNow(){
  clearTimeout(persistTimer);persistTimer=0;
  if(!persistPending)return;
  persistPending=false;
  const i=practice(),snap=snapshot(i);if(snap)put(i,'draft',snap);
  window.dispatchEvent(new CustomEvent('andesdb:lab-draft-saved',{detail:{session,practice:i}}));
}
function scheduleDraftSave(delay=700){
  persistPending=true;clearTimeout(persistTimer);
  persistTimer=setTimeout(persistDraftNow,delay);
}
const saveDraft=()=>{scheduleDraftSave(700)};
const saveCorrect=()=>{persistDraftNow();const i=practice(),snap=snapshot(i);if(snap){put(i,'correct',snap);put(i,'draft',snap)}return snap};
function preferred(i,api){const e=loadStore()[i],done=Boolean(api?.localCompleted?.(codeFor(i))||remoteCompleted.has(codeFor(i)));if(e)return (done&&e.correct)||e.draft||e.correct||null;if(done){const task=window.ANDES_LAB_CONTENT?.sessions?.[session]?.tasks?.[i-1];if(task?.type==='classify'&&Array.isArray(task.answers))return {kind:'classify',values:[...task.answers]};if(task?.type==='order'&&Array.isArray(task.answer))return {kind:'order',values:[...task.answer]}}return null}
function fire(el,type){try{el.dispatchEvent(new Event(type,{bubbles:true}))}catch(_){}}
const tick=()=>new Promise(r=>setTimeout(r,0));
async function restoreOrder(saved){
  if(!Array.isArray(saved?.values)||!saved.values.length)return;
  for(let target=0;target<saved.values.length;target++){
    let guard=0;
    while(guard++<20){
      const rows=[...document.querySelectorAll('.order-row')];
      if(!rows.length)return;
      const current=rows.map(r=>r.querySelector('span')?.textContent||'');
      const at=current.indexOf(saved.values[target]);
      if(at<0||at===target)break;
      if(at>target){rows[at].querySelector('[data-up]')?.click();await tick();}
      else{rows[at].querySelector('[data-down]')?.click();await tick();}
    }
  }
}
function ensureStyle(){if(document.getElementById('andes-lab-ux6-style'))return;const s=document.createElement('style');s.id='andes-lab-ux6-style';s.textContent=`
.mcq-row{display:block!important}.mcq-prompt{display:block;font-weight:850;margin-bottom:9px}.mcq-native{position:absolute!important;opacity:0!important;pointer-events:none!important;width:1px!important;height:1px!important}.mcq-options{display:grid;gap:8px}.mcq-option{display:grid;grid-template-columns:22px minmax(0,1fr);gap:9px;align-items:start;border:1px solid #d9e0e8;border-radius:10px;padding:10px 11px;background:#fff;cursor:pointer}.mcq-option:has(input:checked){border-color:#175cd3;box-shadow:0 0 0 3px #dbe7ff;background:#f8fbff}.mcq-option input{margin-top:3px;width:17px;height:17px}.answer-saved{margin-top:8px;font-size:.72rem;color:#166534;font-weight:750}.lab-editing .mobile-nav{display:none!important}.lab-editing main{padding-bottom:28px!important}`;document.head.appendChild(s)}
function enhanceMCQ(i){
  const task=window.ANDES_LAB_CONTENT?.sessions?.[session]?.tasks?.[i-1];if(!task?.mcq)return;
  const select=document.querySelector('[data-classify="0"]');if(!select||select.dataset.mcqEnhanced==='1')return;
  ensureStyle();select.dataset.mcqEnhanced='1';select.classList.add('mcq-native');
  const old=select.closest('.classify-row');if(!old)return;
  const row=document.createElement('div');row.className='classify-row mcq-row';
  const prompt=document.createElement('span');prompt.className='mcq-prompt';prompt.textContent=old.querySelector('span')?.textContent||'Selecciona una opción';row.appendChild(prompt);row.appendChild(select);
  const opts=document.createElement('div');opts.className='mcq-options';opts.setAttribute('role','radiogroup');
  [...select.options].filter(o=>o.value).forEach(o=>{const lab=document.createElement('label');lab.className='mcq-option';const radio=document.createElement('input');radio.type='radio';radio.name=`mcq-s${session}-p${i}`;radio.value=o.value;radio.checked=select.value===o.value;radio.addEventListener('change',()=>{if(radio.checked){select.value=radio.value;fire(select,'change');scheduleDraftSave(250)}});const text=document.createElement('span');text.textContent=o.textContent;lab.append(radio,text);opts.appendChild(lab)});row.appendChild(opts);old.replaceWith(row);
}
let restoring=false,lastSignature='';
async function restore(api){
  if(restoring)return;const i=practice(),task=window.ANDES_LAB_CONTENT?.sessions?.[session]?.tasks?.[i-1];if(!task)return;
  const sig=`${i}:${task.title}`;if(sig===lastSignature&&document.querySelector('[data-restored-v6="1"]')){enhanceMCQ(i);return}
  restoring=true;
  try{
    const saved=preferred(i,api);
    if(saved){
      if(task.type==='sql'){const e=document.getElementById('sql-editor');if(e&&saved.kind==='sql'){e.value=saved.value||'';fire(e,'input')}}
      else if(task.type==='classify'&&saved.kind==='classify'){
        [...document.querySelectorAll('[data-classify]')].forEach((e,k)=>{if(saved.values?.[k]!=null){e.value=saved.values[k];fire(e,'change')}});
      }else if(task.type==='order'&&saved.kind==='order')await restoreOrder(saved);
      else{const e=document.getElementById('text-answer');if(e&&saved.kind==='text'){e.value=saved.value||'';fire(e,'input')}}
    }
    enhanceMCQ(i);
    const root=document.getElementById('task');if(root)root.dataset.restoredV6='1';
    lastSignature=sig;
  }finally{restoring=false}
}
function installPersistence(api){
  document.addEventListener('input',e=>{if(e.target?.matches?.('#sql-editor,#text-answer'))scheduleDraftSave(700)},true);
  document.addEventListener('change',e=>{if(e.target?.matches?.('[data-classify]'))scheduleDraftSave(250)},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-up],[data-down]'))scheduleDraftSave(180)},true);
  document.addEventListener('focusin',e=>{if(e.target?.matches?.('#sql-editor,#text-answer'))document.body.classList.add('lab-editing')},true);
  document.addEventListener('focusout',e=>{if(e.target?.matches?.('#sql-editor,#text-answer')){persistDraftNow();setTimeout(()=>{if(!document.activeElement?.matches?.('#sql-editor,#text-answer'))document.body.classList.remove('lab-editing')},80)}},true);
  addEventListener('pagehide',persistDraftNow);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistDraftNow()});
  addEventListener('andesdb:lab-task-will-change',persistDraftNow);
  addEventListener('andesdb:lab-task-rendered',()=>restore(api));
  setTimeout(()=>restore(api),60);
}
function installFastProgress(api){
  if(api.__labFastProgressV6||typeof api.dashboard!=='function')return;api.__labFastProgressV6=true;
  const original=api.dashboard.bind(api),endpoint='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-progress';
  let inflight=null,last=null,lastAt=0;
  api.dashboard=function(scope='me',fresh=false){
    if(scope!=='me'||fresh!==true||!/\/lab\.html$/i.test(location.pathname))return original(scope,fresh);
    if(last&&Date.now()-lastAt<700)return Promise.resolve(last);
    if(inflight)return inflight;
    inflight=(async()=>{const a=safeJSON(localStorage.getItem(AUTH)||'null',null);if(!a?.token)return original(scope,fresh);const absorb=d=>{remoteCompleted.clear();for(const x of (d?.activity_progress||[]))if(x.status==='completed')remoteCompleted.add(String(x.activity_code));lastSignature='';setTimeout(()=>restore(api),0);return d};const c=new AbortController(),timer=setTimeout(()=>c.abort(),8000);try{const r=await fetch(endpoint,{method:'GET',headers:{Authorization:'Bearer '+a.token},signal:c.signal,cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);last=absorb(await r.json());lastAt=Date.now();return last}catch(e){console.warn('ANDESDB: progreso ligero no disponible; uso respaldo completo',e);return absorb(await original(scope,fresh))}finally{clearTimeout(timer);inflight=null}})();
    return inflight;
  };
}
function installOptimisticComplete(api){
  if(api.__labOptimisticV6||typeof api.complete!=='function')return;api.__labOptimisticV6=true;
  const original=api.complete.bind(api);
  api.complete=function(activity,score=1,meta={},s=null){
    const i=practice(),answer=saveCorrect();
    const enriched={...meta,answer:answer||undefined,answer_saved:true,ux:'lab-v6'};
    let p;
    try{p=original(activity,score,enriched,s)}catch(e){console.warn('ANDESDB: no se pudo iniciar sincronización',e);return Promise.resolve(false)}
    Promise.resolve(p).then(()=>{
      window.dispatchEvent(new CustomEvent('andesdb:answer-synced',{detail:{session,practice:i,activity}}));
      setTimeout(()=>window.dispatchEvent(new Event('online')),120);
    }).catch(e=>console.warn('ANDESDB: sincronización diferida',e));
    return Promise.resolve(true);
  };
}
window.__ANDES_LAB_PATCH_READY__=(async()=>{
  const started=Date.now();while(!window.ANDES_LMS&&Date.now()-started<12000)await new Promise(r=>setTimeout(r,30));
  const api=window.ANDES_LMS;if(!api)return false;
  ensureStyle();installFastProgress(api);installOptimisticComplete(api);installPersistence(api);return true;
})();
})();