(()=>{
'use strict';
if(window.__ANDES_EMAIL_ACCESS_V1__)return;window.__ANDES_EMAIL_ACCESS_V1__=true;
if(!/\/revision\/portal\.html$/i.test(location.pathname))return;
const hash=new URLSearchParams((location.hash||'').replace(/^#/,''));
const accessToken=hash.get('access_token');
if(!accessToken)return;
const STORE='andesdb.lms.auth.v1',COOKIE='andesdb_lms_session',COOKIE_PATH='/ANDESDB/revision/',COOKIE_AGE=34560000,API='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-auth';
const cleanUrl=location.pathname+location.search;
try{history.replaceState(null,'',cleanUrl)}catch(_){location.hash=''}
function show(text,type='working'){
 let box=document.getElementById('andes-email-access-status');
 if(!box){box=document.createElement('div');box.id='andes-email-access-status';box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.style.cssText='position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:24px;background:#08111df0;color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif';box.innerHTML='<div style="width:min(520px,92vw);background:#111b29;border:1px solid #344051;border-top:5px solid #ffd43b;padding:24px;box-shadow:0 24px 80px #0008"><div style="font-size:.72rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#ffd43b;margin-bottom:8px">ANDESDB · acceso por correo</div><div data-copy style="font-size:1.05rem;line-height:1.5;font-weight:750"></div></div>';document.body.appendChild(box)}
 const copy=box.querySelector('[data-copy]');if(copy)copy.textContent=text;if(type==='error')box.querySelector('div>div')?.style?.setProperty('color','#ff9c94')
}
function save(x){try{localStorage.setItem(STORE,JSON.stringify(x))}catch(_){}document.cookie=`${COOKIE}=${encodeURIComponent(x.token)}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_AGE}; Secure; SameSite=Lax`}
async function exchange(){
 show('Verificando el enlace y preparando tu curso…');
 const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);
 try{
   const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'exchange_supabase',access_token:accessToken}),signal:c.signal});
   const x=await r.json().catch(()=>({}));
   if(!r.ok||!x?.token)throw new Error(x.error||'El enlace no pudo validarse.');
   save(x);show('Acceso confirmado. Entrando a ANDESDB…');
   setTimeout(()=>location.replace('portal.html?access=email'),220);
 }catch(err){
   show((err?.name==='AbortError'?'La validación tardó demasiado. ':err?.message?err.message+' ':'No se pudo validar el enlace. ')+'Puedes volver al portal e iniciar sesión con tus credenciales temporales.','error');
   const box=document.getElementById('andes-email-access-status');if(box&&!box.querySelector('a')){const a=document.createElement('a');a.href='portal.html';a.textContent='Volver al portal';a.style.cssText='display:inline-flex;margin-top:16px;padding:10px 14px;background:#ffd43b;color:#302700;text-decoration:none;font-weight:900;border-radius:5px';box.querySelector('div')?.appendChild(a)}
 }finally{clearTimeout(t)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',exchange,{once:true});else exchange();
})();