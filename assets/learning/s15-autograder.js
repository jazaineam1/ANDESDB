(() => {
  'use strict';

  const VERSION = 's15-auto-v2';
  const STORE = 'andesdb.s15.autograder.v2';
  const AUTH_STORE = 'andesdb.lms.auth.v1';
  const API = 'https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-autograde-s15';
  const SQLJS_BASE = new URL('../vendor/sqljs/', document.currentScript.src).href;
  const DATA_BASE = new URL('../../Plantillas/proyecto-final/Datos/', document.currentScript.src).href;

  const CONCEPT = {
    c1: 'caso_snapshot',
    c2: 'evento_cambio',
    c3: 'uno_a_muchos',
    c4: 'count_inflado',
    c5: 'doc_caso_array_evidencias'
  };
  const ARCH = {
    a1: 'snapshot_historial',
    a2: 'documental',
    a3: 'separar_analitica',
    a4: 'no_cerrar_dominio'
  };
  const Q_WEIGHTS = {q1:8,q2:9,q3:9,q4:9};
  const HINTS = {
    c1:'casos.csv es un snapshot: una fila representa un caso y su estado actual.',
    c2:'eventos.csv está a otro grano: una fila representa un evento o cambio de un caso.',
    c3:'Un caso puede acumular varios eventos: la relación es 1:N.',
    c4:'COUNT(*) después del JOIN cuenta filas del JOIN, no casos.',
    c5:'En evidencias.json el documento representa un caso y el arreglo contiene sus evidencias.',
    d1:'Revisa las claves primarias de caso.caso_id y evento.evento_id.',
    d2:'evento.caso_id debe impedir eventos huérfanos mediante una FK real.',
    d3:'Los campos exigidos por el contrato deben rechazar NULL.',
    d4:'minutos_desde_anterior debe rechazar valores negativos.',
    d5:'No cierres el dominio de estado por lo que observaste en el CSV: la prueba introduce el estado Escalado.',
    q1:'Revisa el filtro Alta, el GROUP BY por barrio y el alias casos_alta.',
    q2:'Necesitas identificar el último evento por fecha para cada caso; MAX(estado) no significa último estado.',
    q3:'Suma minutos por caso y conserva aquellos cuyo último evento es Cerrado.',
    q4:'El JOIN multiplica filas. Cuenta casos a su propio grano y eventos al suyo.',
    a1:'Presente rápido + auditoría histórica requiere snapshot e historial con una regla de consistencia.',
    a2:'Forma variable y evolución frecuente favorecen documento para la pieza de evidencias.',
    a3:'La analítica histórica pesada debe separarse de la carga operacional.',
    a4:'Una lista observada no es un dominio cerrado si el negocio no lo confirmó.'
  };

  let SQL = null;
  let baseData = null;
  let lastReport = null;

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function readStore(){ try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}} }
  function writeStore(x){ try{localStorage.setItem(STORE,JSON.stringify(x))}catch{} }
  function auth(){ try{return JSON.parse(localStorage.getItem(AUTH_STORE)||'null')}catch{return null} }

  function parseCSV(text){
    const rows=[]; let row=[], cell='', quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i], next=text[i+1];
      if(ch==='"'){
        if(quoted && next==='"'){cell+='"';i++;}
        else quoted=!quoted;
      } else if(ch===',' && !quoted){row.push(cell);cell='';}
      else if((ch==='\n'||ch==='\r') && !quoted){
        if(ch==='\r'&&next==='\n')i++;
        row.push(cell);cell=''; if(row.some(v=>v!==''))rows.push(row); row=[];
      } else cell+=ch;
    }
    if(cell||row.length){row.push(cell);if(row.some(v=>v!==''))rows.push(row)}
    const head=rows.shift()||[];
    return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??''])));
  }

  async function init(){
    updateAuthStatus();
    restoreDraft();
    bindAutosave();
    setStatus('Cargando motor SQL y datos…','work');
    try{
      SQL=await window.initSqlJs({locateFile:f=>`${SQLJS_BASE}${f}`});
      const [c,e,j]=await Promise.all([
        fetch(`${DATA_BASE}casos.csv`,{cache:'no-store'}).then(r=>r.text()),
        fetch(`${DATA_BASE}eventos.csv`,{cache:'no-store'}).then(r=>r.text()),
        fetch(`${DATA_BASE}evidencias.json`,{cache:'no-store'}).then(r=>r.json())
      ]);
      baseData={casos:parseCSV(c),eventos:parseCSV(e),evidencias:j};
      $('#dataSummary').textContent=`${baseData.casos.length} casos · ${baseData.eventos.length} eventos · ${baseData.evidencias.length} documentos de evidencias`;
      setStatus('Evaluador listo. Tu borrador se guarda en este navegador.','ok');
    }catch(err){
      setStatus(`No se pudo iniciar el evaluador: ${err.message||err}`,'bad');
    }
    $('#checkConcepts')?.addEventListener('click',()=>renderChoiceFeedback('concept'));
    $('#checkDDL')?.addEventListener('click',async()=>renderTestFeedback('ddl',await runDDLTests()));
    $('#checkQueries')?.addEventListener('click',async()=>renderTestFeedback('queries',await runQueryTests()));
    $('#checkArch')?.addEventListener('click',()=>renderChoiceFeedback('arch'));
    $('#submitFinal')?.addEventListener('click',submitFinal);
    $('#copyReport')?.addEventListener('click',copyReport);
    $('#downloadReport')?.addEventListener('click',downloadReport);
  }

  function setStatus(msg,kind=''){
    const el=$('#engineStatus'); if(!el)return; el.textContent=msg; el.className=`status ${kind}`;
  }
  function updateAuthStatus(){
    const a=auth(), el=$('#lmsStatus'); if(!el)return;
    if(a?.token){el.innerHTML='<b>LMS conectado</b><span>El intento final se guardará automáticamente.</span>';el.className='lms ok'}
    else{el.innerHTML='<b>Modo local</b><span>La retroalimentación funciona, pero para guardar la nota debes iniciar sesión en ANDESDB.</span><a href="/ANDESDB/revision/">Abrir LMS</a>';el.className='lms warn'}
  }

  function collectAnswers(){
    const out={};
    $$('input[type=radio]:checked').forEach(r=>out[r.name]=r.value);
    return out;
  }
  function collectCode(){
    return {ddl:$('#ddl')?.value||'',q1:$('#q1')?.value||'',q2:$('#q2')?.value||'',q3:$('#q3')?.value||'',q4:$('#q4')?.value||''};
  }
  function saveDraft(){
    const old=readStore();
    writeStore({...old,answers:collectAnswers(),code:collectCode(),updated_at:new Date().toISOString()});
    const e=$('#savedAt'); if(e)e.textContent='Borrador guardado';
  }
  function bindAutosave(){
    let t;
    document.addEventListener('input',e=>{if(e.target.matches('textarea,input[type=radio]')){clearTimeout(t);t=setTimeout(saveDraft,250)}});
    document.addEventListener('change',e=>{if(e.target.matches('input[type=radio]'))saveDraft()});
  }
  function restoreDraft(){
    const s=readStore();
    for(const [k,v] of Object.entries(s.answers||{})){const r=document.querySelector(`input[name="${CSS.escape(k)}"][value="${CSS.escape(String(v))}"]`);if(r)r.checked=true}
    for(const [k,v] of Object.entries(s.code||{})){const e=document.getElementById(k);if(e)e.value=String(v)}
    if(s.attempts?.length){const last=s.attempts[s.attempts.length-1];$('#attemptInfo').textContent=`Último intento local: ${last.score}/100`}
  }

  function renderChoiceFeedback(which){
    const answers=collectAnswers();
    const key=which==='concept'?CONCEPT:ARCH;
    const target=$(`#${which}Feedback`); if(!target)return;
    let score=0; const per=which==='concept'?4:5;
    const rows=[];
    for(const [id,correct] of Object.entries(key)){
      const ok=answers[id]===correct; if(ok)score+=per;
      rows.push(`<li class="${ok?'good':'bad'}"><b>${id.toUpperCase()}</b> ${ok?'Correcto':esc(HINTS[id])}</li>`);
    }
    target.innerHTML=`<strong>${score}/${which==='concept'?20:20}</strong><ul>${rows.join('')}</ul>`;target.hidden=false;
  }

  function safeDDL(sql){
    const x=sql.replace(/--.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'').trim();
    if(!x)return {ok:false,error:'Escribe tu DDL antes de validar.'};
    if(/\b(ATTACH|DETACH|VACUUM|DROP|INSERT|UPDATE|DELETE|REPLACE)\b/i.test(x))return {ok:false,error:'En este bloque solo se permite DDL de creación y restricciones.'};
    return {ok:true,sql:x};
  }
  function succeeds(db,sql){try{db.run(sql);return true}catch{return false}}
  function fails(db,sql){try{db.run(sql);return false}catch{return true}}

  async function runDDLTests(){
    if(!SQL)throw new Error('El motor SQL todavía no está listo.');
    const raw=$('#ddl')?.value||'', chk=safeDDL(raw);
    const tests={d1:false,d2:false,d3:false,d4:false,d5:false};
    if(!chk.ok)return {...tests,_error:chk.error};
    const db=new SQL.Database();
    try{
      db.run('PRAGMA foreign_keys=ON;');
      db.run(chk.sql);
      const validCase=`INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9001,'2026-09-01','Alumbrado','Alta','Abierto','Prueba');`;
      const validEvent=`INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('T001',9001,'2026-09-01 10:00','Abierto',0);`;
      if(!succeeds(db,validCase))return {...tests,_error:'No pude insertar un caso válido con el contrato indicado. Revisa nombres de tablas/columnas y columnas adicionales obligatorias.'};
      tests.d1=fails(db,validCase);
      if(succeeds(db,validEvent))tests.d1=tests.d1&&fails(db,validEvent);
      tests.d2=fails(db,"INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('ORPH',999999,'2026-09-01 11:00','Abierto',0);");
      const nullCase=fails(db,"INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9002,'2026-09-01',NULL,'Media','Abierto','Prueba');");
      const nullEvent=fails(db,"INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('NULL1',9001,NULL,'Abierto',0);");
      tests.d3=nullCase&&nullEvent;
      tests.d4=fails(db,"INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('NEG1',9001,'2026-09-01 12:00','Abierto',-1);");
      const evolCase=succeeds(db,"INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9003,'2026-09-01','Semaforo','Alta','Escalado','Prueba');");
      const evolEvent=evolCase&&succeeds(db,"INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('EVOL1',9003,'2026-09-01 13:00','Escalado',10);");
      tests.d5=!!evolEvent;
    }catch(err){tests._error=String(err.message||err)}finally{db.close()}
    return tests;
  }

  function cloneData(x){return JSON.parse(JSON.stringify(x))}
  function variants(){
    const v0=cloneData(baseData);
    const v1=cloneData(baseData);
    v1.casos.push({caso_id:'1013',fecha_creacion:'2026-08-11',ciudadano_id:'C013',tipo:'Alumbrado',prioridad:'Alta',estado:'Abierto',canal:'Web',barrio:'Bosa'});
    v1.eventos.push({evento_id:'E025',caso_id:'1013',fecha_evento:'2026-08-11 08:00',estado:'Abierto',agente_id:'A06',minutos_desde_anterior:'0'});
    v1.eventos.push({evento_id:'E026',caso_id:'1002',fecha_evento:'2026-08-02 12:00',estado:'Abierto',agente_id:'A02',minutos_desde_anterior:'60'});
    const v2=cloneData(baseData);
    const c10=v2.casos.find(c=>c.caso_id==='1010'); if(c10)c10.estado='Cerrado';
    v2.eventos.push({evento_id:'E027',caso_id:'1010',fecha_evento:'2026-08-09 12:30',estado:'Cerrado',agente_id:'A03',minutos_desde_anterior:'300'});
    const c3=v2.casos.find(c=>c.caso_id==='1003'); if(c3)c3.estado='Escalado';
    v2.eventos.push({evento_id:'E028',caso_id:'1003',fecha_evento:'2026-08-03 12:00',estado:'Escalado',agente_id:'A04',minutos_desde_anterior:'230'});
    return [v0,v1,v2];
  }

  function makeSourceDB(data){
    const db=new SQL.Database();
    db.run(`CREATE TABLE casos_src(caso_id INTEGER,fecha_creacion TEXT,ciudadano_id TEXT,tipo TEXT,prioridad TEXT,estado TEXT,canal TEXT,barrio TEXT);
            CREATE TABLE eventos_src(evento_id TEXT,caso_id INTEGER,fecha_evento TEXT,estado TEXT,agente_id TEXT,minutos_desde_anterior INTEGER);`);
    let st=db.prepare('INSERT INTO casos_src VALUES(?,?,?,?,?,?,?,?)');
    for(const r of data.casos)st.run([+r.caso_id,r.fecha_creacion,r.ciudadano_id,r.tipo,r.prioridad,r.estado,r.canal,r.barrio]); st.free();
    st=db.prepare('INSERT INTO eventos_src VALUES(?,?,?,?,?,?)');
    for(const r of data.eventos)st.run([r.evento_id,+r.caso_id,r.fecha_evento,r.estado,r.agente_id,+r.minutos_desde_anterior]); st.free();
    return db;
  }
  function queryOnly(sql){
    const x=sql.replace(/--.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'').trim();
    if(!x)return {ok:false,error:'Consulta vacía'};
    if(!/^(SELECT|WITH)\b/i.test(x))return {ok:false,error:'Solo se permiten SELECT o WITH en las consultas evaluadas.'};
    if(/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA|REPLACE|VACUUM)\b/i.test(x))return {ok:false,error:'La consulta debe ser de solo lectura.'};
    const parts=x.split(';').map(s=>s.trim()).filter(Boolean);if(parts.length!==1)return {ok:false,error:'Entrega una sola consulta por caja.'};
    return {ok:true,sql:parts[0]};
  }
  function execRows(db,sql){
    const r=db.exec(sql); if(!r.length)return {columns:[],rows:[]};
    return {columns:r[0].columns.map(c=>c.toLowerCase()),rows:r[0].values};
  }
  const val=x=>typeof x==='number'?x:String(x??'');
  function normalize(result,task){
    const cols=result.columns;
    const req={
      q1:['barrio','casos_alta'],q2:['caso_id','estado_actual','ultimo_estado'],q3:['caso_id','minutos_hasta_cierre'],q4:['total_casos','total_eventos','casos_alta']
    }[task];
    if(JSON.stringify(cols)!==JSON.stringify(req))return {error:`Columnas esperadas: ${req.join(', ')}`};
    let rows=result.rows.map(r=>r.map(val));
    if(task!=='q4')rows.sort((a,b)=>String(a[0]).localeCompare(String(b[0]),'es',{numeric:true}));
    return {rows};
  }
  function expected(data,task){
    if(task==='q1'){
      const m=new Map();data.casos.filter(c=>c.prioridad==='Alta').forEach(c=>m.set(c.barrio,(m.get(c.barrio)||0)+1));
      return [...m].sort((a,b)=>a[0].localeCompare(b[0])).map(([b,n])=>[b,n]);
    }
    if(task==='q2'){
      return data.casos.map(c=>{
        const ev=data.eventos.filter(e=>e.caso_id===c.caso_id).sort((a,b)=>a.fecha_evento.localeCompare(b.fecha_evento));
        return [+c.caso_id,c.estado,ev.at(-1)?.estado||null];
      }).sort((a,b)=>a[0]-b[0]);
    }
    if(task==='q3'){
      const out=[];
      for(const c of data.casos){
        const ev=data.eventos.filter(e=>e.caso_id===c.caso_id).sort((a,b)=>a.fecha_evento.localeCompare(b.fecha_evento));
        if(ev.at(-1)?.estado==='Cerrado')out.push([+c.caso_id,ev.reduce((s,e)=>s+(+e.minutos_desde_anterior||0),0)]);
      }
      return out.sort((a,b)=>a[0]-b[0]);
    }
    if(task==='q4')return [[data.casos.length,data.eventos.length,data.casos.filter(c=>c.prioridad==='Alta').length]];
  }

  async function runQueryTests(){
    if(!SQL||!baseData)throw new Error('El evaluador todavía no está listo.');
    const tests={q1:false,q2:false,q3:false,q4:false,_detail:{}};
    for(const task of Object.keys(Q_WEIGHTS)){
      const raw=$(`#${task}`)?.value||'', chk=queryOnly(raw);
      if(!chk.ok){tests._detail[task]=chk.error;continue}
      let ok=true, detail='Pasa datos base y variaciones.';
      const vs=variants();
      for(let i=0;i<vs.length;i++){
        const db=makeSourceDB(vs[i]);
        try{
          const norm=normalize(execRows(db,chk.sql),task);
          if(norm.error){ok=false;detail=norm.error;break}
          const exp=expected(vs[i],task).map(r=>r.map(val));
          if(JSON.stringify(norm.rows)!==JSON.stringify(exp)){ok=false;detail=i===0?'El resultado no coincide con los datos base.':'Pasa los datos visibles, pero falla una variación automática: evita resultados hardcodeados y revisa el grano.';break}
        }catch(err){ok=false;detail=String(err.message||err);break}finally{db.close()}
      }
      tests[task]=ok;tests._detail[task]=detail;
    }
    return tests;
  }

  function renderTestFeedback(which,tests){
    const target=$(`#${which}Feedback`);if(!target)return;
    const ids=which==='ddl'?['d1','d2','d3','d4','d5']:['q1','q2','q3','q4'];
    const weights=which==='ddl'?Object.fromEntries(ids.map(x=>[x,5])):Q_WEIGHTS;
    const score=ids.reduce((s,id)=>s+(tests[id]?weights[id]:0),0);
    const max=which==='ddl'?25:35;
    const rows=ids.map(id=>`<li class="${tests[id]?'good':'bad'}"><b>${id.toUpperCase()}</b> ${tests[id]?'Prueba superada':esc(tests._detail?.[id]||HINTS[id])}</li>`);
    if(tests._error)rows.unshift(`<li class="bad">${esc(tests._error)}</li>`);
    target.innerHTML=`<strong>${score}/${max}</strong><ul>${rows.join('')}</ul>`;target.hidden=false;
  }

  function localGrade(answers,tests){
    let concept=0,ddl=0,queries=0,architecture=0;const failed=[];
    for(const [id,c] of Object.entries(CONCEPT)){if(answers[id]===c)concept+=4;else failed.push(id)}
    for(const id of ['d1','d2','d3','d4','d5']){if(tests[id])ddl+=5;else failed.push(id)}
    for(const [id,w] of Object.entries(Q_WEIGHTS)){if(tests[id])queries+=w;else failed.push(id)}
    for(const [id,c] of Object.entries(ARCH)){if(answers[id]===c)architecture+=5;else failed.push(id)}
    return {score:concept+ddl+queries+architecture,breakdown:{concept,ddl,queries,architecture},failed};
  }
  function feedbackText(report){
    const b=report.breakdown, lines=[`Resultado: ${report.score}/100`,`Grano ${b.concept}/20 · DDL ${b.ddl}/25 · SQL ${b.queries}/35 · Decisiones ${b.architecture}/20.`];
    if(report.failed.length){lines.push('Prioridades de mejora:');report.failed.forEach(id=>lines.push(`- ${HINTS[id]||id}`))}
    else lines.push('Todas las pruebas pasaron, incluidas las variaciones automáticas de datos.');
    return lines.join('\n');
  }
  function renderReport(report,savedInfo=''){
    lastReport={...report,feedback:report.feedback||feedbackText(report),savedInfo,generated_at:new Date().toISOString()};
    const b=report.breakdown;
    $('#report').innerHTML=`
      <div class="scoreHero"><strong>${report.score}</strong><span>/100</span><small>${esc(savedInfo||'Resultado local')}</small></div>
      <div class="scoreGrid">
        <article><b>${b.concept}/20</b><span>Grano</span></article><article><b>${b.ddl}/25</b><span>DDL</span></article><article><b>${b.queries}/35</b><span>SQL</span></article><article><b>${b.architecture}/20</b><span>Decisiones</span></article>
      </div>
      <pre class="feedbackText">${esc(lastReport.feedback)}</pre>`;
    $('#reportWrap').hidden=false;
  }

  async function submitFinal(){
    const btn=$('#submitFinal');btn.disabled=true;btn.textContent='Evaluando…';setStatus('Ejecutando pruebas y variaciones…','work');
    try{
      const answers=collectAnswers();
      const ddl=await runDDLTests();renderTestFeedback('ddl',ddl);
      const queries=await runQueryTests();renderTestFeedback('queries',queries);
      const tests={d1:!!ddl.d1,d2:!!ddl.d2,d3:!!ddl.d3,d4:!!ddl.d4,d5:!!ddl.d5,q1:!!queries.q1,q2:!!queries.q2,q3:!!queries.q3,q4:!!queries.q4};
      const local=localGrade(answers,tests);renderChoiceFeedback('concept');renderChoiceFeedback('arch');
      const payload={version:VERSION,answers,tests,code:collectCode(),client_at:new Date().toISOString()};
      const a=auth();
      if(a?.token){
        const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${a.token}`},body:JSON.stringify(payload)});
        const data=await res.json().catch(()=>({}));
        if(!res.ok)throw new Error(data.error||`No se pudo guardar en LMS (${res.status})`);
        renderReport(data,`Guardado en LMS · intento ${data.attempt}`);
        rememberAttempt(data.score,true,data.attempt);
        setStatus(`Intento ${data.attempt} guardado. Puedes corregir y volver a intentar.`,'ok');
      }else{
        renderReport(local,'Resultado local · no enviado al LMS');rememberAttempt(local.score,false,null);
        setStatus('Evaluación terminada localmente. Inicia sesión en ANDESDB para registrar la nota.','warn');
      }
    }catch(err){setStatus(`No se pudo terminar la evaluación: ${err.message||err}`,'bad')}
    finally{btn.disabled=false;btn.textContent='Evaluar y registrar intento'}
  }
  function rememberAttempt(score,saved,attempt){
    const s=readStore();s.attempts ||= [];s.attempts.push({at:new Date().toISOString(),score,saved,attempt});s.attempts=s.attempts.slice(-20);writeStore(s);$('#attemptInfo').textContent=`Último intento: ${score}/100${saved?' · guardado':''}`;
  }
  async function copyReport(){if(!lastReport)return;await navigator.clipboard.writeText(lastReport.feedback||feedbackText(lastReport));setStatus('Retroalimentación copiada.','ok')}
  function downloadReport(){
    if(!lastReport)return;const blob=new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`resultado-s15-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  window.addEventListener('storage',e=>{if(e.key===AUTH_STORE)updateAuthStatus()});
  window.addEventListener('DOMContentLoaded',init,{once:true});
})();
