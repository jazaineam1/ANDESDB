(()=>{
'use strict';
if(window.__ANDES_LMS_INTEGRAL_PATCH__)return;window.__ANDES_LMS_INTEGRAL_PATCH__=true;
const PRIMARY={1:'s1-diagnostico',2:'sql-s2',3:'sql-s3',4:'sql-s4',5:'sql-s5',6:'s6-reglas-evidencia',7:'erd-s7',8:'erd-s8',9:'s9-constraints',10:'decision-s10',11:'s11-documentos',12:'warehouse-s12',13:'bigquery-s13',14:'unnest-s14',15:'s15-integrador',16:'s16-dp900'};
function clearLegacyProgress(){try{const k='andesdb.lms.local.v1',x=JSON.parse(localStorage.getItem(k)||'{}');if(x&&typeof x==='object'&&x.completed){delete x.completed;if(Object.keys(x).length)localStorage.setItem(k,JSON.stringify(x));else localStorage.removeItem(k)}}catch{}}
function practiceFromActivity(code,n){if(!code)return null;const m=String(code).match(new RegExp(`^s${n}-r([1-9])$`,'i'));if(m)return Number(m[1]);if(PRIMARY[n]===code)return 10;return null}
async function init(){let api=window.ANDES_LMS;for(let i=0;!api&&i<80;i++){await new Promise(r=>setTimeout(r,50));api=window.ANDES_LMS}if(!api)return;clearLegacyProgress();
  const course=window.ANDES_COURSE;try{await course?.ready?.()}catch{}
  if(course?.sessions?.length){api.ROUTE=course.sessions.map(s=>({n:Number(s.n),module:`M${s.module_number}`,title:s.titulo,path:s.href,activity:PRIMARY[Number(s.n)]||null}))}
  const originalComplete=api.complete?.bind(api);if(originalComplete&&!api.__serverFirstPatched){api.complete=async(...args)=>{const r=await originalComplete(...args);clearLegacyProgress();return r};api.localCompleted=()=>false;api.__serverFirstPatched=true}
  api.platform=window.ANDES_PLATFORM||null;api.course=course||null;api.resumeLink=ev=>{const n=Number(ev?.session_number);if(!n||n<1||n>16)return new URL('learning-hub.html',api.ROOT).href;const s=course?.session?.(n)||api.ROUTE?.find?.(x=>Number(x.n)===n);const p=practiceFromActivity(ev?.activity_code,n);if(p||/challenge|activity|lab/i.test(String(ev?.event_type||''))){const u=new URL('lab.html',api.ROOT);u.searchParams.set('session',String(n));if(p)u.searchParams.set('practice',String(p));return u.href}const u=new URL(s?.href||`learning-hub.html?session=${n}`,api.ROOT);if(ev?.slide_number)u.searchParams.set('slide',String(ev.slide_number));return u.href};
}
init();
})();