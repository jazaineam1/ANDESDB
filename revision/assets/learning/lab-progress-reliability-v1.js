(()=>{
'use strict';
if(window.__ANDES_LAB_PROGRESS_RELIABILITY_V1__)return;
window.__ANDES_LAB_PROGRESS_RELIABILITY_V1__=true;
const API='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1';
const AUTH='andesdb.lms.auth.v1',PENDING='andesdb.lms.pending.v3',LOCAL='andesdb.lab.reliable.v1';
const TTL=24*60*60*1000;
const safeJSON=(s,f)=>{try{return JSON.parse(s)}catch{return f}};
const auth=()=>safeJSON(localStorage.getItem(AUTH)||'null',null);
const owner=()=>String(auth()?.user?.id||auth()?.user?.username||'anonymous').replace(/[^a-zA-Z0-9_-]/g,'_');
const key=()=>`${LOCAL}.${owner()}`;
const read=()=>safeJSON(localStorage.getItem(key())||'{}',{})||{};
const write=x=>{try{localStorage.setItem(key(),JSON.stringify(x))}catch(_){}};
function prune(){const all=read(),now=Date.now();let dirty=false;for(const [code,v] of Object.entries(all)){if(!v?.at||now-new Date(v.at).getTime()>TTL){delete all[code];dirty=true}}if(dirty)write(all);return all}
function remember(code){if(!code)return;const all=prune();all[code]={at:new Date().toISOString()};write(all);window.dispatchEvent(new CustomEvent('andesdb:lab-local-complete',{detail:{code}}))}
function forget(code){const all=read();if(code in all){delete all[code];write(all)}}
function has(code){return Boolean(prune()[code])}
const sig=e=>JSON.stringify(e);
let flushing=null;
async function flushPendingNow(){
  if(flushing)return flushing;
  flushing=(async()=>{
    const a=auth(),token=a?.token;if(!token)return false;
    let q=safeJSON(localStorage.getItem(PENDING)||'[]',[])||[];if(!q.length)return true;
    const batch=q.slice(0,20),sent=batch.map(sig);
    try{
      const r=await fetch(`${API}/learning-track`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({events:batch}),cache:'no-store',keepalive:true});
      if(!r.ok)return false;
      const current=safeJSON(localStorage.getItem(PENDING)||'[]',[])||[];
      const counts=new Map();for(const s of sent)counts.set(s,(counts.get(s)||0)+1);
      const next=[];for(const e of current){const s=sig(e),n=counts.get(s)||0;if(n>0)counts.set(s,n-1);else next.push(e)}
      try{localStorage.setItem(PENDING,JSON.stringify(next))}catch(_){ }
      window.dispatchEvent(new CustomEvent('andesdb:pending-flushed',{detail:{count:batch.length}}));
      return true;
    }catch(_){return false}
  })().finally(()=>{flushing=null});
  return flushing;
}
async function reconcile(api){
  if(!api?.dashboard)return;
  try{
    const d=await api.dashboard('me',true),remote=new Set((d?.activity_progress||[]).filter(x=>x.status==='completed').map(x=>String(x.activity_code)));
    for(const code of Object.keys(read()))if(remote.has(code))forget(code);
    window.dispatchEvent(new CustomEvent('andesdb:lab-progress-reconciled',{detail:{remote:[...remote]}}));
    window.dispatchEvent(new Event('online'));
  }catch(_){ }
}
function schedule(api){
  [250,1000,3000,7000,15000].forEach(ms=>setTimeout(async()=>{await flushPendingNow();await reconcile(api)},ms));
}
async function install(){
  const started=Date.now();while(!window.ANDES_LMS&&Date.now()-started<12000)await new Promise(r=>setTimeout(r,30));
  const api=window.ANDES_LMS;if(!api)return;
  if(!api.__labReliableV1){
    api.__labReliableV1=true;
    if(typeof api.localCompleted==='function'){
      const local=api.localCompleted.bind(api);
      api.localCompleted=code=>Boolean(local(code)||has(String(code)));
    }
    if(typeof api.complete==='function'){
      const complete=api.complete.bind(api);
      api.complete=function(activity,score=1,meta={},session=null){
        const code=String(activity||'');remember(code);
        let result;
        try{result=complete(activity,score,{...meta,reliable_local:true},session)}catch(e){schedule(api);throw e}
        Promise.resolve(result).finally(()=>schedule(api));
        return result;
      };
    }
    api.flushPendingNow=flushPendingNow;
  }
  prune();
  setTimeout(()=>reconcile(api),350);
  addEventListener('online',()=>{flushPendingNow().then(()=>reconcile(api))});
  addEventListener('pageshow',()=>setTimeout(()=>reconcile(api),250));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>reconcile(api),250)});
}
window.__ANDES_LAB_RELIABILITY_READY__=install();
})();