(()=>{
'use strict';
if(window.ANDES_PLATFORM?.version==='2.2.2')return;
const API='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-platform',STORE='andesdb.lms.auth.v1',CACHE_PREFIX='andesdb.platform.bootstrap.v2.',CACHE_TTL=45000;
let bootstrapCache=null,bootstrapOwner='';
const auth=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}};
const owner=()=>String(auth()?.user?.id||auth()?.user?.username||'anonymous');
const cacheKey=()=>CACHE_PREFIX+owner();
function readCached(){try{const x=JSON.parse(sessionStorage.getItem(cacheKey())||'null');if(x?.data&&Date.now()-Number(x.saved_at||0)<CACHE_TTL)return x.data}catch{}return null}
function writeCached(data){try{sessionStorage.setItem(cacheKey(),JSON.stringify({saved_at:Date.now(),data}))}catch{}}
if(!window.__ANDES_AUTH_FETCH_RESILIENCE__){
  window.__ANDES_AUTH_FETCH_RESILIENCE__=true;
  const nativeFetch=window.fetch.bind(window);const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  window.fetch=async function(input,init={}){const url=typeof input==='string'?input:(input?.url||'');let action='';if(url.includes('/functions/v1/learning-auth')&&String(init?.method||'GET').toUpperCase()==='POST'){try{action=JSON.parse(init.body||'{}').action||''}catch(_){ }}if(action!=='login'&&action!=='me')return nativeFetch(input,init);const timeout=action==='login'?15000:10000;const run=async()=>{const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout);try{return await nativeFetch(input,{...init,signal:c.signal})}finally{clearTimeout(timer)}};try{return await run()}catch(first){if(action==='me'&&first?.name!=='AbortError'){try{await sleep(300);return await run()}catch(second){throw second}}if(action==='login'&&first?.name!=='AbortError')throw new Error('No pudimos conectar con el servidor. Revisa la red y vuelve a pulsar Entrar; tu cuenta y progreso no se pierden.');throw first}}
}
async function call(action,payload={},ms=8000){const a=auth();const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',...(a?.token?{'Authorization':'Bearer '+a.token}:{})},body:JSON.stringify({action,...payload}),signal:c.signal});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||`HTTP ${r.status}`);return x}finally{clearTimeout(t)}}
async function refreshBootstrap(){const who=owner(),x=await call('bootstrap');bootstrapOwner=who;bootstrapCache=x;writeCached(x);dispatchEvent(new CustomEvent('andesdb:platform-updated',{detail:x}));return x}
async function bootstrap(fresh=false){const who=owner();if(!fresh&&bootstrapCache&&bootstrapOwner===who)return bootstrapCache;if(!fresh){const cached=readCached();if(cached){bootstrapOwner=who;bootstrapCache=cached;setTimeout(()=>refreshBootstrap().catch(()=>{}),120);return cached}}return refreshBootstrap()}
function invalidate(){bootstrapCache=null;bootstrapOwner='';try{sessionStorage.removeItem(cacheKey())}catch{}}
async function readAnnouncement(id){const x=await call('mark_announcement_read',{announcement_id:id});invalidate();return x}
async function saveBookmark(data){const x=await call('bookmark_save',data);invalidate();return x}
async function deleteBookmark(id){const x=await call('bookmark_delete',{id});invalidate();return x}
async function submitAssignment(data){const x=await call('submit_assignment',data,15000);invalidate();return x}
async function submissionUrl(submission_id){return call('submission_url',{submission_id})}
async function teacherOverview(){return call('teacher_overview',{},12000)}
async function userDetail(user_id){return call('user_detail',{user_id},10000)}
async function createAnnouncement(data){const x=await call('announcement_create',data);invalidate();return x}
async function deleteAnnouncement(id){const x=await call('announcement_delete',{id});invalidate();return x}
async function createAssignment(data){const x=await call('assignment_create',data);invalidate();return x}
async function archiveAssignment(id){const x=await call('assignment_delete',{id});invalidate();return x}
async function reviewSubmission(submission_id,score,feedback=''){return call('review_submission',{submission_id,score,feedback})}
async function setUserActive(user_id,active){return call('user_set_active',{user_id,active})}
async function revokeUserSessions(user_id){return call('user_revoke_sessions',{user_id})}
async function issueCertificate(user_id){return call('issue_certificate',{user_id})}
async function verifyCertificate(code){return call('verify_certificate',{code})}
window.ANDES_PLATFORM={version:'2.2.2',call,bootstrap,refreshBootstrap,invalidate,readAnnouncement,saveBookmark,deleteBookmark,submitAssignment,submissionUrl,teacherOverview,userDetail,createAnnouncement,deleteAnnouncement,createAssignment,archiveAssignment,reviewSubmission,setUserActive,revokeUserSessions,issueCertificate,verifyCertificate};
if(/\/revision\/portal\.html$/i.test(location.pathname)&&!document.querySelector('script[data-portal-ux-v2]')){const s=document.createElement('script');s.src=new URL('portal-ux-v2.js?v=20260913-ux2',document.currentScript?.src||location.href).href;s.dataset.portalUxV2='1';s.defer=true;document.head.appendChild(s)}
})();