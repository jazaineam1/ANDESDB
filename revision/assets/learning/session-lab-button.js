(() => {
  'use strict';
  try {
    if (localStorage.getItem('andesdb.lab4.migrated') !== '1') {
      const key='andesdb.lms.local.v1';
      const x=JSON.parse(localStorage.getItem(key)||'{}');
      if (x && typeof x==='object') { x.completed={}; localStorage.setItem(key,JSON.stringify(x)); }
      localStorage.setItem('andesdb.lab4.migrated','1');
    }
  } catch (_) {}
  if (window.self !== window.top || document.getElementById('andes-session-lab-btn')) return;
  const script = document.currentScript || [...document.scripts].find(s => /session-lab-button\.js(?:\?|$)/.test(s.src));
  if (!script) return;
  const ROOT = new URL('../../', script.src);
  const m = (location.pathname + ' ' + document.title).match(/sesion[-_\s]*(\d{1,2})/i);
  const session = m ? Number(m[1]) : null;
  if (!session || session < 1 || session > 16) return;
  const primary={1:'s1-diagnostico',2:'sql-s2',3:'sql-s3',4:'sql-s4',5:'sql-s5',6:'s6-reglas-evidencia',7:'erd-s7',8:'erd-s8',9:'s9-constraints',10:'decision-s10',11:'s11-documentos',12:'warehouse-s12',13:'bigquery-s13',14:'unnest-s14',15:'s15-integrador',16:'s16-dp900'};
  const codes=[1,2,3,4,5,6,7,8,9].map(i=>`s${session}-r${i}`).concat(primary[session]);
  const a=document.createElement('a');a.id='andes-session-lab-btn';a.href=new URL(`lab.html?session=${session}`,ROOT).href;a.target='_self';a.textContent=`🧪 Laboratorio S${session} · 0/10`;
  a.addEventListener('click',e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();location.assign(a.href)}});
  const st=document.createElement('style');st.textContent=`#andes-session-lab-btn{position:fixed;right:12px;top:58px;z-index:2147481750;background:#0f1b28f2;color:#fff;text-decoration:none;border:1px solid #ffffff55;border-radius:999px;padding:10px 13px;font:850 12px/1 system-ui;box-shadow:0 8px 24px #0004;backdrop-filter:blur(8px)}#andes-toolkit-btn{display:none!important}@media(max-width:760px){#andes-session-lab-btn{top:auto;bottom:58px;right:10px}}`;document.head.appendChild(st);document.body.appendChild(a);
  function hideLegacy(){const old=document.getElementById('andes-toolkit-btn');if(old){old.style.display='none';old.setAttribute('aria-hidden','true')}}
  function localCount(){const api=window.ANDES_LMS;return api?codes.filter(c=>api.localCompleted?.(c)).length:0}
  function paint(n){a.textContent=`🧪 Laboratorio S${session} · ${Math.max(0,Math.min(10,Number(n)||0))}/10`}
  hideLegacy();paint(localCount());
  let busy=false,lastRemoteAt=0,debounce=null;
  async function refreshRemote(force=false){
    const api=window.ANDES_LMS;if(!api||busy)return false;
    const now=Date.now();if(!force&&now-lastRemoteAt<1800){paint(localCount());return true}
    busy=true;
    try{
      const u=await api.ready();if(!u){paint(localCount());return true}
      const d=await api.dashboard('me',false),ap=new Map((d.activity_progress||[]).map(x=>[x.activity_code,x]));
      paint(codes.filter(c=>ap.get(c)?.status==='completed'||api.localCompleted?.(c)).length);lastRemoteAt=Date.now();return true;
    }catch{paint(localCount());return false}finally{busy=false}
  }
  function scheduleRemote(delay=500){clearTimeout(debounce);debounce=setTimeout(()=>refreshRemote(false),delay)}
  addEventListener('andesdb:challenge-completed',()=>{paint(localCount());scheduleRemote(700)});
  addEventListener('storage',e=>{if(!e.key||e.key==='andesdb.lms.local.v1'){paint(localCount());scheduleRemote(900)}});
  (async()=>{for(let i=0;i<50&&!window.ANDES_LMS;i++)await new Promise(r=>setTimeout(r,80));hideLegacy();paint(localCount());if(window.ANDES_LMS)await refreshRemote(false)})();
})();