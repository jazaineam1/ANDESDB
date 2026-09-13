(()=>{
'use strict';
if(window.__ANDES_PRESENTATION_TELEMETRY__)return;window.__ANDES_PRESENTATION_TELEMETRY__=true;
if(!/\/revision\/Presentaciones\//i.test(location.pathname))return;
const API='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-track',STORE='andesdb.lms.auth.v1';
const readAuth=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}};
const sessionNumber=()=>{const m=(location.pathname+' '+document.title).match(/sesion[-_\s]*(\d{1,2})/i);return m?Number(m[1]):null};
function slideNumber(){const a=document.querySelector('.slide.active');if(a){const all=[...document.querySelectorAll('.slide')],i=all.indexOf(a);if(i>=0)return i+1}const p=document.querySelector('.reveal .slides section.present');if(p){const all=[...document.querySelectorAll('.reveal .slides section')],i=all.indexOf(p);if(i>=0)return i+1}const t=document.querySelector('#count,[data-slide-count],.slide-number')?.textContent||'',m=t.match(/(\d+)\s*(?:\/|of)/i);return m?Number(m[1]):null}
function slideTitle(){const x=document.querySelector('.slide.active,.reveal .slides section.present');return String(x?.dataset?.title||x?.querySelector?.('h1,h2')?.textContent||document.title||'').trim().slice(0,100)}
function sendLms(event_type,{slide_number=null,active_seconds_delta=0,metadata={}}={}){const a=readAuth();if(!a?.token)return;const body={event_type,session_number:sessionNumber(),activity_code:null,slide_number,active_seconds_delta,metadata,client_at:new Date().toISOString()};fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+a.token},body:JSON.stringify(body),keepalive:true}).catch(()=>{})}
function ga(name,params={}){try{window.ANDES_ANALYTICS?.event?.(name,{session_number:sessionNumber(),...params})}catch{}}
let lastSlide=slideNumber(),slideTimer=null,lastInteraction=Date.now(),lastHeartbeat=Date.now();
function noteInteraction(){lastInteraction=Date.now()}
['pointerdown','keydown','touchstart','scroll'].forEach(ev=>addEventListener(ev,noteInteraction,{passive:true}));
function checkSlide(source='navigation'){
  if(document.visibilityState==='hidden')return;
  const n=slideNumber();if(!n||n===lastSlide)return;lastSlide=n;
  clearTimeout(slideTimer);slideTimer=setTimeout(()=>{if(document.visibilityState==='hidden')return;const stable=slideNumber();if(stable!==n)return;sendLms('slide_viewed',{slide_number:n,metadata:{source}});ga('slide_viewed',{slide_number:n,slide_title:slideTitle(),navigation_source:source})},500)
}
document.addEventListener('click',()=>setTimeout(()=>checkSlide('click'),40),{passive:true});
document.addEventListener('keyup',e=>{if(['ArrowRight','ArrowLeft','PageDown','PageUp',' ','Enter'].includes(e.key))setTimeout(()=>checkSlide('keyboard'),40)},{passive:true});
const poll=setInterval(()=>checkSlide('poll'),1600);
function heartbeat(force=false){const now=Date.now();if(!force&&document.visibilityState==='hidden'){lastHeartbeat=now;return}const activeUntil=lastInteraction+5*60*1000,end=Math.min(now,activeUntil),delta=Math.floor(Math.max(0,end-lastHeartbeat)/1000);lastHeartbeat=now;if(delta>0)sendLms('heartbeat',{active_seconds_delta:Math.min(delta,75),metadata:{model:'presentation-lite'}})}
const beat=setInterval(()=>heartbeat(false),60000);
sendLms('page_opened',{slide_number:lastSlide,metadata:{source:'presentation-lite'}});ga('presentation_opened',{slide_number:lastSlide||undefined});if(lastSlide)ga('slide_viewed',{slide_number:lastSlide,slide_title:slideTitle(),navigation_source:'initial'});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(slideTimer);heartbeat(true)}else{lastHeartbeat=Date.now();lastInteraction=Date.now();setTimeout(()=>checkSlide('resume'),120)}});
addEventListener('pagehide',()=>{clearInterval(poll);clearInterval(beat);clearTimeout(slideTimer);heartbeat(true);sendLms('page_closed',{slide_number:slideNumber(),metadata:{reason:'pagehide'}})},{once:true});
})();