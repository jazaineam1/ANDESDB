(()=>{
'use strict';
if(window.__ANDES_PRESENTATION_PERFORMANCE__)return;
if(!/\/ANDESDB\/revision\/Presentaciones\//i.test(location.pathname))return;
window.__ANDES_PRESENTATION_PERFORMANCE__=true;

/*
 * Las presentaciones cambian varias clases por cada avance. Algunos runtimes LMS
 * observan esas mutaciones para detectar la diapositiva actual. En móviles, una
 * ráfaga de clics puede disparar docenas de callbacks y peticiones simultáneas.
 * Este guard agrupa observers futuros por frame y estabiliza telemetría/red.
 */
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

function patchLms(){
  const api=window.ANDES_LMS;
  if(!api||api.__presentationPerfPatched)return false;
  api.__presentationPerfPatched=true;

  if(typeof api.track==='function'){
    const originalTrack=api.track.bind(api);
    let slideTimer=null,slideArgs=null;
    api.track=function(eventType,metadata={},overrides={}){
      if(eventType==='slide_viewed'){
        slideArgs=[eventType,metadata,overrides];
        clearTimeout(slideTimer);
        slideTimer=setTimeout(()=>{
          const args=slideArgs;slideArgs=null;
          if(args)originalTrack(...args).catch(()=>{});
        },420);
        return Promise.resolve(true);
      }
      return originalTrack(eventType,metadata,overrides);
    };
    addEventListener('pagehide',()=>{
      if(!slideArgs)return;
      clearTimeout(slideTimer);
      const args=slideArgs;slideArgs=null;
      originalTrack(...args).catch(()=>{});
    },{once:true});
  }

  if(typeof api.dashboard==='function'){
    const originalDashboard=api.dashboard.bind(api);
    let inflight=null,lastValue=null,lastAt=0;
    api.dashboard=function(scope='me',fresh=false){
      if(scope!=='me')return originalDashboard(scope,fresh);
      const now=Date.now();
      if(inflight)return inflight;
      if(lastValue&&now-lastAt<1800)return Promise.resolve(lastValue);
      inflight=Promise.resolve(originalDashboard(scope,fresh)).then(v=>{
        lastValue=v;lastAt=Date.now();return v;
      }).finally(()=>{inflight=null});
      return inflight;
    };
  }
  return true;
}

if(!patchLms()){
  let tries=0;
  const timer=setInterval(()=>{if(patchLms()||++tries>80)clearInterval(timer)},50);
}
})();