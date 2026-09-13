(()=>{
'use strict';
if(window.__ANDES_LAB_RUNTIME_V7__)return;window.__ANDES_LAB_RUNTIME_V7__=true;
const PRIMARY={1:'s1-diagnostico',2:'sql-s2',3:'sql-s3',4:'sql-s4',5:'sql-s5',6:'s6-reglas-evidencia',7:'erd-s7',8:'erd-s8',9:'s9-constraints',10:'decision-s10',11:'s11-documentos',12:'warehouse-s12',13:'bigquery-s13',14:'unnest-s14',15:'s15-integrador',16:'s16-dp900'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const codeFor=(n,i)=>i===10?PRIMARY[n]:`s${n}-r${i}`;
const st={session:0,content:null,index:1,remoteDone:new Set(),order:{},draft:{},attempted:new Set(),renderRevision:0};
let api=null;
const $=id=>document.getElementById(id);
const localDone=i=>Boolean(api?.localCompleted?.(codeFor(st.session,i)));
const remoteDone=i=>st.remoteDone.has(codeFor(st.session,i));
const isDone=i=>localDone(i)||remoteDone(i);
const pendingSync=i=>localDone(i)&&!remoteDone(i);
function doneCount(){let n=0;for(let i=1;i<=10;i++)if(isDone(i))n++;return n}
function pendingCount(){let n=0;for(let i=1;i<=10;i++)if(pendingSync(i))n++;return n}
function refreshProgressUI(){
  const n=doneCount(),pending=pendingCount();
  if($('lab-count'))$('lab-count').textContent=`${n} / 10`;
  if($('lab-bar'))$('lab-bar').style.width=`${n*10}%`;
  if($('lab-status'))$('lab-status').textContent=n===10&&!pending?'✓ Laboratorio completado · todo sincronizado':pending?`${n}/10 completadas · ${pending} pendiente${pending===1?'':'s'} de sincronización`:'Completa las prácticas a tu ritmo';
  document.querySelectorAll('[data-step]').forEach(b=>{const i=Number(b.dataset.step),r=remoteDone(i),p=pendingSync(i);b.classList.toggle('done',r);b.classList.toggle('pending-sync',p);b.classList.toggle('current',i===st.index);b.setAttribute('aria-current',i===st.index?'step':'false');b.title=r?'Completada y sincronizada':p?'Completada en este dispositivo; pendiente de sincronización':'Pendiente';b.textContent=r?`✓ ${i}`:p?`↻ ${i}`:String(i)});
  const badge=$('task-badge');if(badge){const r=remoteDone(st.index),p=pendingSync(st.index);badge.textContent=r?'✓ Completado · sincronizado':p?'↻ Completado localmente · pendiente de sincronización':'Pendiente';badge.className=`badge ${r?'done':p?'pending':''}`}
}
async function syncProgress(){try{const u=await api?.ready?.();if(!u)return;const d=await api.dashboard('me',true);st.remoteDone=new Set((d.activity_progress||[]).filter(x=>x.status==='completed').map(x=>x.activity_code));refreshProgressUI()}catch(e){console.warn('ANDESDB: progreso remoto no disponible',e);refreshProgressUI()}}
function attempt(i,meta={}){const code=codeFor(st.session,i);if(st.attempted.has(code))return;st.attempted.add(code);Promise.resolve(api?.attempt?.(code,{source:'lab-v7',...meta},st.session)).catch(()=>{})}
async function complete(i,meta={}){const code=codeFor(st.session,i);try{await api?.complete?.(code,1,{source:'lab-v7',strategy:st.content.strategy,...meta},st.session)}finally{refreshProgressUI();setTimeout(()=>syncProgress(),500)}}
function fail(i,meta={}){Promise.resolve(api?.fail?.(codeFor(st.session,i),{source:'lab-v7',...meta},st.session)).catch(()=>{})}
function feedback(ok,msg){const e=$('feedback');if(!e)return;e.className=`feedback ${ok?'ok':'bad'}`;e.textContent=msg;e.tabIndex=-1;e.focus({preventScroll:true})}
function clearFeedback(){const e=$('feedback');if(!e)return;e.className='feedback';e.textContent='';e.removeAttribute('tabindex')}
function table(r){if(!r?.columns?.length)return'<div class="muted">La consulta no devolvió filas.</div>';const rows=(r.values||[]).slice(0,50);return`<div class="tablewrap"><table><thead><tr>${r.columns.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v===null?'NULL':v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="muted">${r.values.length} fila(s)${r.values.length>50?' · se muestran 50':''}.</div>`}
function assertSafeSQL(sql){if(!sql)throw new Error('Escribe una consulta antes de ejecutar.');if(/\b(insert|update|delete|drop|alter|create|attach|detach)\b/i.test(sql))throw new Error('Este laboratorio permite consultas de lectura (SELECT/WITH).')}
function sqlView(t,i){return`<div class="task-instruction"><h2>${esc(t.title)}</h2><p>${esc(t.prompt)}</p></div><div class="sql-status" id="sql-load">Editor listo · el motor SQL se prepara solo cuando ejecutes o revises la consulta.</div><label class="field-label" for="sql-editor">Tu SQL</label><textarea id="sql-editor" class="sql-editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off">${esc(st.draft[i]??t.starter??'')}</textarea><div class="actions"><button class="btn" id="run-btn">▶ Ejecutar</button><button class="btn good" id="verify-btn">✓ Ejecutar y validar</button>${t.hints?.length?'<button class="btn alt" id="hint-btn">Pista</button>':''}</div><div id="sql-result" class="resultbox"><div class="muted">Puedes escribir sin esperar ninguna carga. SQL se ejecuta fuera del hilo de la interfaz.</div></div>`}
function classifyView(t,i){const saved=st.draft[i]||{};return`<div class="task-instruction"><h2>${esc(t.title)}</h2><p>${esc(t.prompt)}</p></div><div class="classify-list">${t.items.map((item,k)=>`<label class="classify-row"><span>${esc(item)}</span><select data-classify="${k}"><option value="">Selecciona…</option>${t.categories.map(c=>`<option value="${esc(c)}" ${saved[k]===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label>`).join('')}</div><div class="actions"><button class="btn good" id="verify-btn">Validar clasificación</button></div>`}
function orderView(t,i){if(!st.order[i])st.order[i]=[...t.items];return`<div class="task-instruction"><h2>${esc(t.title)}</h2><p>${esc(t.prompt)}</p></div><div class="order-list">${st.order[i].map((x,k)=>`<div class="order-row"><b>${k+1}</b><span>${esc(x)}</span><button data-up="${k}" aria-label="Subir ${esc(x)}">↑</button><button data-down="${k}" aria-label="Bajar ${esc(x)}">↓</button></div>`).join('')}</div><div class="actions"><button class="btn good" id="verify-btn">Validar orden</button></div>`}
function textView(t,i){const evaluable=Boolean(t.codeLike||t.autoValidated);return`<div class="task-instruction"><h2>${esc(t.title)}</h2><p>${esc(t.prompt)}</p></div><label class="field-label" for="text-answer">${evaluable?'Tu respuesta técnica':'Tu respuesta'}</label><textarea id="text-answer" class="text-answer" placeholder="${esc(t.placeholder||'Escribe aquí…')}">${esc(st.draft[i]||'')}</textarea><div class="actions"><button class="btn good" id="verify-btn">${evaluable?'Comprobar estructura':'Enviar para revisión'}</button></div><div class="muted hintline">${evaluable?'El sistema comprueba únicamente requisitos técnicos mínimos; no sustituye una revisión de diseño.':'Las respuestas de diseño o arquitectura no se aprueban por palabras clave.'}</div>`}
function taskView(t,i){if(!t)return'<div class="error">No se pudo cargar esta práctica. Recarga la página.</div>';if(t.type==='sql')return sqlView(t,i);if(t.type==='classify')return classifyView(t,i);if(t.type==='order')return orderView(t,i);return textView(t,i)}
function setBusy(btn,busy,label='Procesando…'){if(!btn)return;if(busy){btn.dataset.oldText=btn.textContent;btn.disabled=true;btn.textContent=label}else{btn.disabled=false;btn.textContent=btn.dataset.oldText||btn.textContent;delete btn.dataset.oldText}}
function sqlEngineStatus(text){const status=$('sql-load');if(status)status.textContent=text}
function renderTask({scroll=true}={}){
  window.dispatchEvent(new CustomEvent('andesdb:lab-task-will-change',{detail:{session:st.session,index:st.index}}));
  const i=st.index,t=st.content.tasks?.[i-1];st.renderRevision++;clearFeedback();$('task-num').textContent=`Práctica ${i} de 10`;$('task').innerHTML=taskView(t,i);$('prev-btn').disabled=i===1;$('next-btn').hidden=i===10;refreshProgressUI();if(t)bindTask(t,i);window.dispatchEvent(new CustomEvent('andesdb:lab-task-rendered',{detail:{session:st.session,index:i,type:t?.type,revision:st.renderRevision}}));if(scroll)window.scrollTo({top:$('practice').offsetTop-8,behavior:'smooth'})
}
function bindTask(t,i){
  if(t.type==='sql'){
    const ed=$('sql-editor'),run=$('run-btn'),verify=$('verify-btn');let editRevision=0;
    ed.oninput=()=>{st.draft[i]=ed.value;editRevision++};
    run.onclick=async()=>{attempt(i,{action:'run'});const sql=ed.value.trim();try{assertSafeSQL(sql);if(!window.ANDES_SQL_ENGINE.isReady())sqlEngineStatus('Preparando motor SQL por primera vez…');setBusy(run,true,'Ejecutando…');const r=await window.ANDES_SQL_ENGINE.run(sql);sqlEngineStatus('✓ Base lista · próximas ejecuciones serán inmediatas');$('sql-result').innerHTML=table(r);clearFeedback()}catch(e){sqlEngineStatus('El editor sigue disponible · puedes corregir y volver a ejecutar');feedback(false,e.message)}finally{setBusy(run,false)}};
    verify.onclick=async()=>{attempt(i,{action:'verify'});const sql=ed.value.trim(),rev=editRevision;try{assertSafeSQL(sql);if(!window.ANDES_SQL_ENGINE.isReady())sqlEngineStatus('Preparando motor SQL por primera vez…');setBusy(verify,true,'Validando…');const r=await window.ANDES_SQL_ENGINE.validate(sql,t.reference);sqlEngineStatus('✓ Base lista · próximas ejecuciones serán inmediatas');$('sql-result').innerHTML=table(r.got);if(rev!==editRevision){feedback(false,'La consulta cambió mientras se validaba. Vuelve a validar la versión actual.');return}if(r.match){feedback(true,'✓ Correcto. Columnas, filas, orden y valores coinciden con el objetivo.');await complete(i,{type:'sql'})}else{feedback(false,'Aún no coincide. Revisa columnas, filtros, orden y número de filas. Tu consulta se conserva.');fail(i,{type:'sql'})}}catch(e){sqlEngineStatus('El editor sigue disponible · puedes corregir y volver a validar');feedback(false,e.message);fail(i,{type:'sql',error:String(e.message).slice(0,120)})}finally{setBusy(verify,false)}};
    const h=$('hint-btn');if(h)h.onclick=()=>{const n=Number(h.dataset.n||0);feedback(true,`Pista: ${t.hints[Math.min(n,t.hints.length-1)]}`);h.dataset.n=String(n+1);Promise.resolve(api?.hint?.(codeFor(st.session,i),{source:'lab-v7'},st.session)).catch(()=>{})};return
  }
  if(t.type==='classify'){
    document.querySelectorAll('[data-classify]').forEach(s=>s.onchange=()=>{st.draft[i]||={};st.draft[i][Number(s.dataset.classify)]=s.value});
    $('verify-btn').onclick=async()=>{attempt(i,{type:'classify'});const vals=t.items.map((_,k)=>document.querySelector(`[data-classify="${k}"]`).value),ok=vals.every((v,k)=>v===t.answers[k]);if(ok){feedback(true,`✓ ${t.explain||'Clasificación correcta.'}`);await complete(i,{type:'classify'})}else{const n=vals.filter((v,k)=>v===t.answers[k]).length;feedback(false,`${n}/${t.items.length} correctas. Ajusta las restantes; tus selecciones se conservan.`);fail(i,{type:'classify',correct:n})}};return
  }
  if(t.type==='order'){
    document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const k=Number(b.dataset.up);if(k>0){[st.order[i][k-1],st.order[i][k]]=[st.order[i][k],st.order[i][k-1]];renderTask({scroll:false})}});
    document.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{const k=Number(b.dataset.down);if(k<st.order[i].length-1){[st.order[i][k+1],st.order[i][k]]=[st.order[i][k],st.order[i][k+1]];renderTask({scroll:false})}});
    $('verify-btn').onclick=async()=>{attempt(i,{type:'order'});if(JSON.stringify(st.order[i])===JSON.stringify(t.answer)){feedback(true,`✓ ${t.explain||'Orden correcto.'}`);await complete(i,{type:'order'})}else{feedback(false,'El orden todavía no representa bien el proceso. Muévelo y vuelve a validar.');fail(i,{type:'order'})}};return
  }
  const ta=$('text-answer');ta.oninput=()=>st.draft[i]=ta.value;
  $('verify-btn').onclick=async()=>{attempt(i,{type:'text'});const value=ta.value.trim();if(value.length<8){feedback(false,'Desarrolla un poco más la respuesta.');return}if(!(t.codeLike||t.autoValidated)){feedback(false,'Esta evidencia requiere juicio humano y no puede aprobarse por coincidencia de palabras. Usa la entrega con rúbrica indicada para la sesión.');return}const ok=(t.requirements||[]).every(group=>group.some(pattern=>{try{return new RegExp(pattern,'i').test(value)}catch{return value.toLowerCase().includes(String(pattern).toLowerCase())}}));if(ok){feedback(true,`✓ ${t.explain||'Cumple los elementos técnicos mínimos.'}`);await complete(i,{type:'text',validation:'minimum-structure'})}else{feedback(false,'Falta al menos un requisito técnico mínimo. Tu respuesta no se borra.');fail(i,{type:'text'})}}
}
function makeSteps(){const e=$('steps');e.innerHTML=Array.from({length:10},(_,k)=>`<button data-step="${k+1}" aria-label="Ir a práctica ${k+1}">${k+1}</button>`).join('');e.onclick=ev=>{const b=ev.target.closest('[data-step]');if(!b)return;st.index=Number(b.dataset.step);renderTask()}}
function setupReview(){const box=$('review-card');if(!box)return;const url=st.content.reviewUrl;if(!url){box.hidden=true;return}box.hidden=false;$('review-link').href=url;$('review-title').textContent=st.content.reviewTitle||'Evidencia con revisión docente';$('review-copy').textContent=st.content.reviewCopy||'Las prácticas preparan el trabajo; la evidencia auténtica se entrega aparte y se valora con rúbrica.'}
async function init(){
  api=window.ANDES_LMS;const n=Number(new URLSearchParams(location.search).get('session')),c=window.ANDES_LAB_CONTENT?.sessions?.[n];
  if(!api||!c||!Number.isInteger(n)||n<1||n>16){document.body.innerHTML='<main style="padding:30px;font-family:system-ui"><h1>Laboratorio no disponible</h1><a href="portal.html">Volver al portal</a></main>';return}
  st.session=n;st.content=c;$('lab-title').textContent=`S${n} · ${c.title}`;$('lab-strategy').textContent=c.strategy;$('lab-intro').textContent=c.intro;document.title=`ANDESDB · Laboratorio S${n}`;
  const route=api.ROUTE.find(x=>x.n===n);$('back-pres').href=route?new URL(route.path,api.ROOT).href:'learning-hub.html';$('hub-link').href=`learning-hub.html?session=${n}`;
  setupReview();makeSteps();refreshProgressUI();renderTask({scroll:false});
  $('prev-btn').onclick=()=>{if(st.index>1){st.index--;renderTask()}};$('next-btn').onclick=()=>{if(st.index<10){st.index++;renderTask()}};
  $('logout-top').onclick=async()=>{await api.logout();location.replace('portal.html')};
  syncProgress();addEventListener('online',()=>setTimeout(syncProgress,400));addEventListener('pageshow',()=>setTimeout(syncProgress,350));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(syncProgress,400)})
}
const boot=()=>window.ANDES_LMS&&window.ANDES_LAB_CONTENT&&window.ANDES_SQL_ENGINE?init():setTimeout(boot,40);boot();
})();