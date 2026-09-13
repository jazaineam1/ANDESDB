(()=>{
'use strict';
if(window.__ANDES_PRESENTATION_PERFORMANCE__)return;
if(!/\/ANDESDB\/revision\/Presentaciones\//i.test(location.pathname))return;
window.__ANDES_PRESENTATION_PERFORMANCE__=true;

/* Agrupa observadores y red de telemetría para que una ráfaga de navegación no bloquee móvil. */
const NativeMO=window.MutationObserver;
if(NativeMO&&!window.__ANDES_NATIVE_MUTATION_OBSERVER__){
  window.__ANDES_NATIVE_MUTATION_OBSERVER__=NativeMO;
  class AndesMutationObserver{
    constructor(callback){
      let queued=false,records=[];
      this._inner=new NativeMO((rs,obs)=>{
        if(rs?.length)records.push(...rs);
        if(queued)return;
        queued=true;
        requestAnimationFrame(()=>{
          queued=false;
          const batch=records;records=[];
          try{callback(batch,obs)}catch(err){setTimeout(()=>{throw err},0)}
        });
      });
    }
    observe(target,options){return this._inner.observe(target,options)}
    disconnect(){return this._inner.disconnect()}
    takeRecords(){return this._inner.takeRecords()}
  }
  window.MutationObserver=AndesMutationObserver;
}

/*
 * learning-tracker-v3 usa una función track interna, así que envolver ANDES_LMS.track
 * no basta. Interceptamos únicamente POST slide_viewed y conservamos la última
 * diapositiva estable. Las diapositivas atravesadas en una ráfaga no cuentan como
 * lectura pedagógica y, sobre todo, no generan una tormenta de requests.
 */
const nativeFetch=window.fetch.bind(window);
let slideTimer=null,pendingSlideRequest=null,dashboardInflight=null;
function urlOf(input){try{return typeof input==='string'?input:input?.url||String(input)}catch{return''}}
function successfulBufferedResponse(){return new Response('{"ok":true,"buffered":true}',{status:200,headers:{'Content-Type':'application/json'}})}
function flushSlideRequest(){
  if(!pendingSlideRequest)return;
  const item=pendingSlideRequest;pendingSlideRequest=null;clearTimeout(slideTimer);slideTimer=null;
  const init={...(item.init||{}),keepalive:true};
  nativeFetch(item.input,init).catch(()=>{});
}
window.fetch=function(input,init={}){
  const url=urlOf(input),method=String(init?.method||'GET').toUpperCase();
  if(method==='POST'&&/\/functions\/v1\/learning-track(?:\?|$)/.test(url)&&typeof init?.body==='string'){
    try{
      const body=JSON.parse(init.body);
      if(body?.event_type==='slide_viewed'){
        pendingSlideRequest={input,init};
        clearTimeout(slideTimer);
        slideTimer=setTimeout(flushSlideRequest,450);
        return Promise.resolve(successfulBufferedResponse());
      }
    }catch(_){ }
  }
  if(method==='GET'&&/\/functions\/v1\/learning-dashboard\?[^#]*scope=me/i.test(url)){
    if(dashboardInflight)return dashboardInflight.then(r=>r.clone());
    dashboardInflight=nativeFetch(input,init).finally(()=>setTimeout(()=>{dashboardInflight=null},250));
    return dashboardInflight.then(r=>r.clone());
  }
  return nativeFetch(input,init);
};
addEventListener('pagehide',flushSlideRequest,{once:true});

function patchLms(){
  const api=window.ANDES_LMS;
  if(!api||api.__presentationPerfPatched)return false;
  api.__presentationPerfPatched=true;
  if(typeof api.dashboard==='function'){
    const originalDashboard=api.dashboard.bind(api);
    let inflight=null,lastValue=null,lastAt=0;
    api.dashboard=function(scope='me',fresh=false){
      if(scope!=='me')return originalDashboard(scope,fresh);
      const now=Date.now();
      if(inflight)return inflight;
      if(lastValue&&now-lastAt<1800)return Promise.resolve(lastValue);
      inflight=Promise.resolve(originalDashboard(scope,fresh)).then(v=>{lastValue=v;lastAt=Date.now();return v}).finally(()=>{inflight=null});
      return inflight;
    };
  }
  return true;
}
if(!patchLms()){
  let tries=0;const timer=setInterval(()=>{if(patchLms()||++tries>80)clearInterval(timer)},50);
}
})();