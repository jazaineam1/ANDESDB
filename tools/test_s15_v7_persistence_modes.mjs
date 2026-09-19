import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import initSqlJs from 'sql.js';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const html=fs.readFileSync(path.join(ROOT,'evaluador-s15-v7.html'),'utf8');
const evalJs=fs.readFileSync(path.join(ROOT,'assets/learning/s15-autograder-v7.js'),'utf8');
const practiceJs=fs.readFileSync(path.join(ROOT,'assets/learning/s15-autograder-v7-practice.js'),'utf8');
const dataDir=path.join(ROOT,'Plantillas/proyecto-final/Datos');
const SQL=await initSqlJs();
const STORE='andesdb.s15.workbench.v7';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(fn,label,timeout=5000){const t=Date.now();while(Date.now()-t<timeout){if(fn())return;await sleep(15)}throw new Error('Timeout: '+label)}
function click(window,el){assert.ok(el,'Elemento no encontrado');el.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}))}

const legacy={
  version:'s15-workbench-v7',
  mode:'evaluacion',
  checked:{sql:2,model:1,ddl:2,doc:1},
  checkedScore:{sql:6,model:8,ddl:7.5,doc:5},
  queryAttempts:{q1:2,q2:3,q3:1,q4:0,q5:2},
  ddlRuns:2,
  mutationRuns:{no_case_pk:1,wrong_fk:2},
  timing:{s1:123,s3:77,boss:42},
  model:{entities:{caso:['caso.caso_id','caso.barrio'],evento:['evento.evento_id','evento.caso_id']},pk:{caso:'caso.caso_id',evento:'evento.evento_id'},fkChoice:'evento.caso_id',fk:'evento.caso_id->caso.caso_id',cardinality:'1:N'},
  norm:{caso:['caso.caso_id','caso.barrio'],evento:['evento.evento_id','evento.caso_id'],agente:['agente.agente_id']},
  ddl:"CREATE TABLE caso(caso_id INTEGER PRIMARY KEY); -- DDL LEGADO",
  ddlChecks:{dup_case:true,dup_event:false,orphan:true,null_tipo:false,neg:true,null_minutes:true,zero_valid:true},
  domainMigration:"INSERT INTO estado_catalogo(estado) VALUES ('Escalado_legado')",
  domainMigrationResult:{beforeFails:true,afterPass:true,pass:true},
  mutation:{no_case_pk:{probe:"INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(7,'2026-09-01','Ruido','Alta','Abierto','Suba')",correct:'reject',mutant:'accept',pass:true}},
  mutationProbe:"INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(77,'2026-09-01','Ruido','Alta','Abierto','Suba')",
  queries:{
    q1:"SELECT barrio, COUNT(*) AS casos_alta FROM casos_src WHERE prioridad='Alta' GROUP BY barrio",
    q2:"SELECT 'BORRADOR_Q2_NO_BORRAR' AS marca",
    q3:"SELECT 'BORRADOR_Q3_NO_BORRAR' AS marca",
    q4:"SELECT 'BORRADOR_Q4_NO_BORRAR' AS marca",
    q5:"SELECT 'BORRADOR_Q5_NO_BORRAR' AS marca"
  },
  queryChecks:{
    q1:{pass:4,total:4,details:[{name:'base',ok:true}]},
    q2:{pass:1,total:4,details:[{name:'base',ok:false,reason:'legado'}]}
  },
  hints:{q1:3,q2:2,q3:1},
  doc:{embed:['snapshot_estado'],refid:['ciudadano_ref'],outside:['perfil_ciudadano'],storeCase:'document',storeLedger:'relational',partitionKey:'/caso_id'},
  dw:{grain:['grain:evento'],measure:['measure:minutos'],dimension:['dimension:fecha','dimension:barrio']},
  pipe:{oltp:['operacional'],olap:['fact_evento'],eventLatency:'streaming',dimLatency:'batch',transformMode:'elt'},
  bq:{partition:['fecha_evento'],cluster:['barrio','tipo']},
  nested:{root:['caso_id'],array:['e.tipo'],executed:true,execError:''},
  format:{landing:['JSON'],analytics:['Parquet']},
  unnestQuery:"SELECT c.caso_id, ev.tipo FROM \x60proyecto.dataset.casos_nested\x60 c CROSS JOIN UNNEST(c.evidencias) ev -- LEGADO",
  diag:{sql:"SELECT caso_id, COUNT(*) AS filas FROM casos_dirty GROUP BY caso_id HAVING COUNT(*) > 1",fact:'confirmed',hyp:'hypothesis'},
  boss:{strategy:'two_facts',grain:['linea_pedido'],measure:['cantidad'],partition:['fecha_pedido'],cluster:['categoria'],unnestQuery:"SELECT p.pedido_id, i.categoria FROM pedidos p CROSS JOIN UNNEST(p.items) i -- LEGADO",azure:{object_files:'blob_adls',operational_document:'cosmos',lakehouse_analytics:'fabric_databricks',bi_consumption:'power_bi'}},
  attempts:[{attempt:1,score:71,at:'2026-09-18T20:00:00.000Z'}]
};
const legacyRaw=JSON.stringify(legacy);

function critical(s){
  return {
    version:s.version,mode:s.mode,checked:s.checked,checkedScore:s.checkedScore,
    queryAttempts:s.queryAttempts,ddlRuns:s.ddlRuns,mutationRuns:s.mutationRuns,timing:s.timing,
    model:s.model,norm:s.norm,ddl:s.ddl,ddlChecks:s.ddlChecks,
    domainMigration:s.domainMigration,domainMigrationResult:s.domainMigrationResult,
    mutation:s.mutation,mutationProbe:s.mutationProbe,queries:s.queries,queryChecks:s.queryChecks,
    doc:s.doc,dw:s.dw,pipe:s.pipe,bq:s.bq,nested:s.nested,format:s.format,
    unnestQuery:s.unnestQuery,diag:s.diag,boss:s.boss,attempts:s.attempts
  };
}

async function boot(mode,raw){
  const runtime=mode==='practica'?practiceJs:evalJs;
  const runtimeName=mode==='practica'?'s15-autograder-v7-practice.js':'s15-autograder-v7.js';
  const dom=new JSDOM(html,{url:'https://example.test/evaluador-s15-v7.html?modo='+mode,runScripts:'outside-only',pretendToBeVisual:true});
  const {window}=dom,document=window.document;
  Object.defineProperty(document,'readyState',{configurable:true,get:()=> 'complete'});
  Object.defineProperty(document,'currentScript',{configurable:true,get:()=>({src:'https://example.test/assets/learning/'+runtimeName})});
  Object.defineProperty(window,'innerWidth',{value:390,configurable:true});
  window.initSqlJs=async()=>SQL;
  window.confirm=()=>true;
  window.alert=()=>{};
  window.URL.createObjectURL=()=> 'blob:s15-persistence-test';
  window.URL.revokeObjectURL=()=>{};
  window.HTMLAnchorElement.prototype.click=function(){};
  window.IntersectionObserver=class{constructor(cb){this.cb=cb}observe(){}disconnect(){}};
  window.S15NestedDuckDB={ready:Promise.resolve(true),validate:async()=>({ok:true,fields:['caso_id','tipo'],rows:[[1001,'foto']]})};
  window.fetch=async input=>{
    const url=String(input),name=url.split('/').pop().split('?')[0],p=path.join(dataDir,name);
    if(!fs.existsSync(p))return{ok:false,status:404,text:async()=>'',json:async()=>({})};
    const body=fs.readFileSync(p,'utf8');
    return{ok:true,status:200,text:async()=>body,json:async()=>JSON.parse(body)};
  };
  window.localStorage.setItem(STORE,raw);
  window.eval(runtime);
  await waitFor(()=>document.querySelector('#engineStatus')?.textContent.startsWith('Listo:'),'inicio '+mode);
  return{dom,window,document,raw:window.localStorage.getItem(STORE)};
}

// 1) Abrir práctica con un estado v7 anterior no debe migrarlo, resetearlo ni sobrescribirlo.
const p1=await boot('practica',legacyRaw);
assert.equal(p1.raw,legacyRaw,'Abrir práctica no debe reescribir el localStorage existente');
assert.match(p1.document.querySelector('#modePill').textContent,/Práctica guiada/);
assert.equal(p1.document.querySelector('#q2').value,legacy.queries.q2);
assert.equal(p1.document.querySelector('#ddl').value,legacy.ddl);
assert.equal(p1.document.querySelector('#domainMigration').readOnly,true); assert.match(p1.document.querySelector('#domainMigration').value,/Escalado/);
assert.equal(p1.document.querySelector('#mutationProbe').value,legacy.mutationProbe);
assert.equal(p1.document.querySelector('[data-solution="q1"]').disabled,false,'3 pistas previas deben desbloquear solución inmediatamente');
assert.equal(p1.document.querySelector('[data-solution="q2"]').disabled,true,'2 pistas previas no deben desbloquear solución');
assert.ok(p1.document.querySelector('[data-study-guide="s2"]'),'Práctica debe incluir ayuda guiada por estación');

// Abrir solución ejecuta referencia sin tocar la respuesta ni el score/attempts históricos.
const beforeSolution=JSON.parse(p1.window.localStorage.getItem(STORE));
const scoreBefore=p1.document.querySelector('#score-sql').textContent;
click(p1.window,p1.document.querySelector('[data-solution="q1"]'));
await waitFor(()=>p1.document.querySelector('#solution-status-q1')?.textContent.includes('4/4 escenarios de la solución'),'solución q1');
const afterSolution=JSON.parse(p1.window.localStorage.getItem(STORE));
assert.deepEqual(critical(afterSolution),critical(beforeSolution),'Ver solución no puede modificar trabajo/calificación histórica');
assert.equal(p1.document.querySelector('#q1').value,legacy.queries.q1);
assert.equal(p1.document.querySelector('#score-sql').textContent,scoreBefore);

// q2 ya tenía 2 pistas: solo requiere la tercera; no se reinicia el contador.
click(p1.window,p1.document.querySelector('[data-hint="q2"]'));
await sleep(330);
assert.equal(JSON.parse(p1.window.localStorage.getItem(STORE)).hints.q2,3);
assert.equal(p1.document.querySelector('[data-solution="q2"]').disabled,false);

// La ayuda no-SQL usa estado nuevo aditivo, sin borrar campos viejos.
const s2hint=p1.document.querySelector('[data-study-hint="s2"]');
click(p1.window,s2hint);click(p1.window,s2hint);click(p1.window,s2hint);
assert.equal(p1.document.querySelector('[data-study-solution="s2"]').disabled,false);
await sleep(330);
const afterPracticeRaw=p1.window.localStorage.getItem(STORE);
const afterPractice=JSON.parse(afterPracticeRaw);
assert.equal(afterPractice.domainMigration,legacy.domainMigration,'El INSERT preparado no debe sobrescribir el texto histórico');
assert.equal(afterPractice.mutationProbe,legacy.mutationProbe,'La prueba preparada no debe borrar el probe histórico');
assert.deepEqual(critical(afterPractice),critical({...legacy,hints:{...legacy.hints,q2:3}}));
assert.equal(afterPractice.hints.q1,3);
assert.equal(afterPractice.hints.q2,3);
assert.equal(afterPractice.studyHints.s2,3);
assert.ok(afterPractice.solutionView,'Los campos nuevos son aditivos');
p1.dom.window.close();

// 2) Abrir evaluación sobre el MISMO estado no muestra soluciones y no rebaja 3 pistas a 2 en storage.
const e1=await boot('evaluacion',afterPracticeRaw);
assert.equal(e1.raw,afterPracticeRaw,'Abrir evaluación tampoco debe reescribir el estado');
assert.match(e1.document.querySelector('#modePill').textContent,/Evaluación/);
assert.equal(e1.document.querySelectorAll('[data-solution]').length,0,'Evaluación no debe renderizar soluciones');
assert.equal(e1.document.querySelectorAll('[data-study-guide]').length,0,'Evaluación no debe renderizar guía resuelta');
assert.equal(e1.document.querySelector('#q2').value,legacy.queries.q2);
assert.equal(e1.document.querySelector('[data-hint="q1"]').textContent,'2/2 pistas vistas');
assert.equal(e1.document.querySelector('[data-hint="q2"]').textContent,'2/2 pistas vistas');
assert.equal(JSON.parse(e1.window.localStorage.getItem(STORE)).hints.q1,3,'Evaluación no debe truncar state.hints existente');
assert.equal(JSON.parse(e1.window.localStorage.getItem(STORE)).hints.q2,3);

// Guardar desde evaluación debe conservar también los campos nuevos de práctica y todos los antiguos.
click(e1.window,e1.document.querySelector('#saveDraft'));
const afterEvalSave=e1.window.localStorage.getItem(STORE);
const evalSaved=JSON.parse(afterEvalSave);
assert.deepEqual(critical(evalSaved),critical(afterPractice));
assert.deepEqual(evalSaved.studyHints,afterPractice.studyHints);
assert.deepEqual(evalSaved.solutionView,afterPractice.solutionView);
assert.deepEqual(evalSaved.solutionOpen,afterPractice.solutionOpen);
e1.dom.window.close();

// 3) Volver a práctica restaura intactos datos históricos y desbloqueos ya usados.
const p2=await boot('practica',afterEvalSave);
assert.equal(p2.document.querySelector('#q2').value,legacy.queries.q2);
assert.equal(p2.document.querySelector('#domainMigration').readOnly,true); assert.match(p2.document.querySelector('#domainMigration').value,/Escalado/);
assert.equal(p2.document.querySelector('#mutationProbe').value,legacy.mutationProbe);
assert.equal(p2.document.querySelector('[data-solution="q1"]').disabled,false);
assert.equal(p2.document.querySelector('[data-solution="q2"]').disabled,false);
assert.equal(p2.document.querySelector('[data-study-solution="s2"]').disabled,false);
const finalState=JSON.parse(p2.window.localStorage.getItem(STORE));
assert.deepEqual(critical(finalState),critical(afterPractice));
assert.equal(finalState.hints.q1,3);
assert.equal(finalState.hints.q2,3);
assert.equal(finalState.studyHints.s2,3);
p2.dom.window.close();

// 4) Las ayudas de la práctica original son demostrativas: 5 SQL pasan 4/4 sin alterar score/checks/intentos.
{
  const s=structuredClone(legacy);
  s.hints={q1:3,q2:3,q3:3,q4:3,q5:3};
  const {dom,window,document}=await boot('practica',JSON.stringify(s));
  const before=JSON.parse(window.localStorage.getItem(STORE));
  const scoreBefore=document.querySelector('#score-sql').textContent;
  for(const id of ['q1','q2','q3','q4','q5']){
    assert.equal(document.querySelector('[data-solution="'+id+'"]').disabled,false,id+' debe reconocer 3 pistas previas');
    click(window,document.querySelector('[data-sql-view="'+id+'|solution"]'));
    await waitFor(()=>document.querySelector('#solution-status-'+id)?.textContent.includes('4/4 escenarios de la solución'),'referencia '+id);
    assert.ok(document.querySelector('#solution-result-'+id+' table'),'La solución '+id+' debe mostrar resultado ejecutado');
  }
  const after=JSON.parse(window.localStorage.getItem(STORE));
  assert.deepEqual(after.queries,before.queries);
  assert.deepEqual(after.queryChecks,before.queryChecks,'La referencia no puede registrar checks como si fueran del estudiante');
  assert.deepEqual(after.queryAttempts,before.queryAttempts,'La referencia no consume intentos');
  assert.deepEqual(after.checked,before.checked);
  assert.deepEqual(after.checkedScore,before.checkedScore);
  assert.equal(document.querySelector('#score-sql').textContent,scoreBefore);
  dom.window.close();
}

// 5) Todas las estaciones no-SQL de práctica exigen 3 pistas y sus soluciones tampoco cambian el dominio.
{
  const s=structuredClone(legacy);
  s.hints={q1:0,q2:0,q3:0,q4:0,q5:0};
  const {dom,window,document}=await boot('practica',JSON.stringify(s));
  const before=JSON.parse(window.localStorage.getItem(STORE));
  const domainBefore=critical(before);
  for(const id of ['s0','s2','s3','s4','s5','s6','s7','boss']){
    const hb=document.querySelector('[data-study-hint="'+id+'"]');
    const sb=document.querySelector('[data-study-solution="'+id+'"]');
    assert.ok(hb&&sb,id+' debe tener guía');
    assert.equal(sb.disabled,true);
    click(window,hb);assert.equal(sb.disabled,true,id+' no abre con 1 pista');
    click(window,hb);assert.equal(sb.disabled,true,id+' no abre con 2 pistas');
    click(window,hb);assert.equal(sb.disabled,false,id+' abre tras 3 pistas');
    click(window,sb);
    assert.equal(document.querySelector('#study-solution-'+id).hidden,false,id+' debe mostrar solución en la misma estación');
    click(window,document.querySelector('[data-study-view="'+id+'|explanation"]'));
    assert.equal(document.querySelector('#study-explanation-'+id).hidden,false,id+' debe mostrar explicación separada');
    click(window,document.querySelector('[data-study-view="'+id+'|attempt"]'));
  }
  await sleep(330);
  const after=JSON.parse(window.localStorage.getItem(STORE));
  assert.deepEqual(critical(after),domainBefore,'Las guías no-SQL solo pueden añadir studyHints/solutionView');
  for(const id of ['s0','s2','s3','s4','s5','s6','s7','boss'])assert.equal(after.studyHints[id],3);
  dom.window.close();
}

console.log('OK · S15 persistencia: práctica → evaluación → práctica conserva datos; pistas y soluciones no alteran nota ni respuestas');
