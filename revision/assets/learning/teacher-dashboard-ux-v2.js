(()=>{
'use strict';
if(window.__ANDES_TEACHER_UX_V2__)return;window.__ANDES_TEACHER_UX_V2__=true;
if(!/\/teacher-dashboard\.html$/i.test(location.pathname))return;
let lastRecipientEmail='';
const css=`
body{background:var(--andes-bg,var(--bg))!important}
.teacher-intro{margin:2px 0 18px;padding:14px 0 4px;border-top:1px solid var(--andes-line,var(--line))}
.teacher-intro strong{display:block;font-size:.83rem;letter-spacing:.08em;text-transform:uppercase;color:#8b6d00;margin-bottom:4px}
.teacher-intro span{color:var(--andes-muted,var(--muted));font-size:.86rem;line-height:1.5}
.assignment-card{display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:16px!important;background:var(--andes-paper,#fff)!important;border:1px solid var(--andes-line,#d7dadd)!important;border-radius:6px!important;box-shadow:none!important}
.assignment-card .row{display:contents}.assignment-card .row>div{min-width:0}.assignment-card b{display:block;font-size:1rem;line-height:1.25;color:var(--andes-ink,#171717);margin-bottom:4px}.assignment-card .muted{font-size:.82rem!important}.assignment-card [data-archive]{justify-self:end;min-width:104px;background:transparent!important;color:var(--andes-red,#a92b21)!important;border:1px solid color-mix(in srgb,var(--andes-red,#a92b21) 48%,transparent)!important}
.assignment-card [data-archive]:hover{background:color-mix(in srgb,var(--andes-red,#a92b21) 8%,transparent)!important}
.assignment-card.is-archiving{opacity:.55;pointer-events:none;transition:opacity .16s ease}.assignment-card.is-archived{opacity:0;transform:translateX(8px);transition:opacity .18s ease,transform .18s ease}
#andes-archive-dialog{width:min(520px,92vw);border:1px solid var(--andes-line,#d7dadd);border-radius:8px;padding:0;background:var(--andes-paper,#fff);color:var(--andes-ink,#171717);box-shadow:0 30px 90px rgba(0,0,0,.34)}
#andes-archive-dialog::backdrop{background:rgba(8,17,29,.68);backdrop-filter:blur(2px)}
.archive-dialog-head{padding:20px 20px 8px}.archive-dialog-head .ey{margin-bottom:7px}.archive-dialog-head h2{margin:0;font-size:1.55rem;line-height:1.12}.archive-dialog-body{padding:0 20px 18px;color:var(--andes-muted,#626b77);line-height:1.55}.archive-dialog-actions{display:flex;justify-content:flex-end;gap:9px;padding:14px 20px 20px;border-top:1px solid var(--andes-line,#d7dadd)}
.archive-dialog-actions button{min-width:110px}
.teacher-toast{position:fixed;right:18px;bottom:18px;z-index:1000;width:min(420px,calc(100vw - 36px));background:var(--andes-nav,#111820);color:#fff;border:1px solid #ffffff24;border-top:4px solid var(--andes-gold,#f2c300);border-radius:6px;padding:13px 15px;box-shadow:0 18px 44px rgba(0,0,0,.28);font:750 .86rem/1.4 system-ui;opacity:0;transform:translateY(8px);pointer-events:none;transition:.18s ease}
.teacher-toast.show{opacity:1;transform:none}.teacher-toast.ok{border-top-color:#54c493}.teacher-toast.err{border-top-color:#ff9c94}
#content>.card .ey,#content>.cols>.card .ey{margin-bottom:4px}
.credentials[data-mail-enhanced="1"]{border-color:color-mix(in srgb,var(--andes-blue,#234a73) 35%,var(--andes-line,#d7dadd))!important}.credential-delivery-note{margin-top:7px;color:var(--andes-muted,var(--muted));font-size:.76rem;line-height:1.45}.credentials .act.mail{background:var(--andes-blue,#234a73)!important;color:#fff!important;text-decoration:none}
@media(max-width:680px){.assignment-card{grid-template-columns:1fr;padding:14px!important}.assignment-card [data-archive]{justify-self:stretch;width:100%}.archive-dialog-actions{display:grid;grid-template-columns:1fr 1fr}.archive-dialog-actions button{width:100%}.teacher-toast{bottom:84px;right:14px;width:calc(100vw - 28px)}.credentials .actions{display:grid;grid-template-columns:1fr 1fr}.credentials .actions>*{width:100%}}
`;
function injectStyle(){if(document.getElementById('teacher-ux-v2-style'))return;const s=document.createElement('style');s.id='teacher-ux-v2-style';s.textContent=css;document.head.appendChild(s)}
function toast(text,type='ok'){let t=document.getElementById('teacher-toast');if(!t){t=document.createElement('div');t.id='teacher-toast';t.className='teacher-toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t)}t.textContent=text;t.className=`teacher-toast ${type} show`;clearTimeout(toast._timer);toast._timer=setTimeout(()=>t.classList.remove('show'),4200)}
function ensureDialog(){let d=document.getElementById('andes-archive-dialog');if(d)return d;d=document.createElement('dialog');d.id='andes-archive-dialog';d.innerHTML=`<div class="archive-dialog-head"><div class="ey">Gestión de entregas</div><h2>Archivar entrega</h2></div><div class="archive-dialog-body"><p id="archive-dialog-copy"></p><p><b>Los envíos existentes no se eliminan.</b> La entrega dejará de aparecer como activa para el grupo.</p></div><div class="archive-dialog-actions"><button type="button" class="btn alt" data-archive-cancel>Cancelar</button><button type="button" class="btn red" data-archive-confirm>Archivar</button></div>`;document.body.appendChild(d);d.querySelector('[data-archive-cancel]').addEventListener('click',()=>d.close('cancel'));d.addEventListener('click',e=>{if(e.target===d)d.close('cancel')});return d}
function askArchive(title){return new Promise(resolve=>{const d=ensureDialog(),copy=d.querySelector('#archive-dialog-copy'),confirmBtn=d.querySelector('[data-archive-confirm]');copy.textContent=`¿Quieres archivar “${title||'esta entrega'}”?`;const done=()=>{d.removeEventListener('close',closed);confirmBtn.removeEventListener('click',confirmed)};const closed=()=>{const yes=d.returnValue==='confirm';done();resolve(yes)};const confirmed=()=>d.close('confirm');d.addEventListener('close',closed,{once:true});confirmBtn.addEventListener('click',confirmed,{once:true});d.showModal()})}
function localizePills(){const map={approved:'Aprobado',pending:'Pendiente',rejected:'Rechazado',reviewed:'Revisado',submitted:'Enviado',high:'Alta',medium:'Media',low:'Baja'};document.querySelectorAll('.pill').forEach(p=>{const k=(p.textContent||'').trim().toLowerCase();if(map[k])p.textContent=map[k]})}
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());
function credentialMessage(box){const codes=[...box.querySelectorAll('code')].map(x=>(x.textContent||'').trim()).filter(Boolean);if(codes.length<2||!/contraseña temporal/i.test(box.textContent||''))return null;const username=codes[0],password=codes[1],portal='https://jazaineam1.github.io/ANDESDB/revision/portal.html';return {username,password,portal,text:`Hola.\n\nTu acceso temporal a ANDESDB es:\n\nUsuario: ${username}\nContraseña temporal: ${password}\nPortal: ${portal}\n\nAl ingresar, cambia la contraseña desde tu cuenta.\n\nANDESDB`}}
function enhanceCredentials(){document.querySelectorAll('.credentials:not([data-mail-enhanced])').forEach(box=>{const data=credentialMessage(box);if(!data)return;box.dataset.mailEnhanced='1';const actions=box.querySelector('.actions')||(()=>{const d=document.createElement('div');d.className='actions';box.appendChild(d);return d})();const target=validEmail(lastRecipientEmail)?lastRecipientEmail:(validEmail(data.username)?data.username:'');const a=document.createElement('a');a.className='act mail';a.dataset.mailCredentials='1';a.textContent=target?`Enviar a ${target}`:'Abrir correo';a.setAttribute('aria-label',target?`Enviar credenciales por correo a ${target}`:'Abrir aplicación de correo');const subject='Acceso temporal a ANDESDB';a.href=`mailto:${target}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(data.text)}`;actions.appendChild(a);const copy=document.createElement('button');copy.type='button';copy.className='act alt';copy.textContent='Copiar mensaje';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(data.text);copy.textContent='Mensaje copiado ✓'}catch{toast('No pude copiar el mensaje. Usa “Abrir correo”.','err')}});actions.appendChild(copy);const note=document.createElement('div');note.className='credential-delivery-note';note.textContent=target?`Destino preparado: mailto:${target}. Revisa el mensaje y pulsa enviar.`:'Se abrirá tu aplicación de correo con usuario, contraseña temporal y enlace al portal. Revisa el destinatario antes de enviar.';box.appendChild(note)})}
function rememberRecipient(target){const btn=target.closest?.('[data-access]');if(!btn)return;const item=btn.closest('.item');const text=item?.textContent||'';const match=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);lastRecipientEmail=match?.[0]||''}
function decorate(){
 document.querySelectorAll('[data-archive]').forEach(btn=>{const item=btn.closest('.item');if(item)item.classList.add('assignment-card');btn.setAttribute('aria-label','Archivar entrega');btn.title='Archivar entrega';});
 localizePills();
 enhanceCredentials();
 const head=document.querySelector('.head');if(head&&!document.querySelector('.teacher-intro')){const intro=document.createElement('div');intro.className='teacher-intro';intro.innerHTML='<strong>Panel docente</strong><span>Gestiona la cohorte, revisa evidencias y detecta dónde necesitan apoyo tus estudiantes.</span>';head.insertAdjacentElement('afterend',intro)}
}
async function archive(btn){
 const id=btn.dataset.archive;if(!id){toast('No encontramos el identificador de esta entrega. Recarga el panel e inténtalo de nuevo.','err');return}
 const card=btn.closest('.assignment-card,.item'),title=card?.querySelector('b')?.textContent?.trim()||'esta entrega';
 if(!await askArchive(title))return;
 const old=btn.textContent;btn.disabled=true;btn.textContent='Archivando…';card?.classList.add('is-archiving');
 try{
   if(!window.ANDES_PLATFORM?.archiveAssignment)throw new Error('El módulo de entregas aún no está listo.');
   const result=await window.ANDES_PLATFORM.archiveAssignment(id);
   if(result?.ok===false)throw new Error(result.error||'El servidor no confirmó el archivado.');
   card?.classList.remove('is-archiving');card?.classList.add('is-archived');
   toast(`✓ “${title}” fue archivada.`,'ok');
   setTimeout(()=>{card?.remove();document.getElementById('refresh')?.click()},190);
 }catch(err){card?.classList.remove('is-archiving');btn.disabled=false;btn.textContent=old;toast(err?.message||'No se pudo archivar la entrega. Intenta nuevamente.','err')}
}
injectStyle();
document.addEventListener('click',e=>{rememberRecipient(e.target);const btn=e.target.closest?.('[data-archive]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();archive(btn)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
new MutationObserver(decorate).observe(document.documentElement,{childList:true,subtree:true});
})();