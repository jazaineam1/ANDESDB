import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import initSqlJs from 'sql.js';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const evalHtml=fs.readFileSync(path.join(ROOT,'evaluador-s15-v7.html'),'utf8');
const evalJs=fs.readFileSync(path.join(ROOT,'assets/learning/s15-autograder-v7.js'),'utf8');
const practiceJs=fs.readFileSync(path.join(ROOT,'assets/learning/s15-autograder-v7-practice.js'),'utf8');
const solHtml=fs.readFileSync(path.join(ROOT,'solucionario-s15.html'),'utf8');
const solJs=fs.readFileSync(path.join(ROOT,'assets/learning/s15-autograder-v7-solution.js'),'utf8');
const dataDir=path.join(ROOT,'Plantillas/proyecto-final/Datos');
const SQL=await initSqlJs();
const STORE='andesdb.s15.workbench.v7';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(fn,label,timeout=5000){const t=Date.now();while(Date.now()-t<timeout){if(fn())return;await sleep(15)}throw new Error('Timeout: '+label)}
function click(window,el){assert.ok(el,'Elemento no encontrado');el.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}))}

function legacyState(){
  return {
    version:'s15-workbench-v7',mode:'practica',
    checked:{model:1,doc:1},checkedScore:{model:7,doc:6},
    queryAttempts:{q1:2,q2:1},ddlRuns:2,mutationRuns:{no_case_pk:1},
    timing:{s1:121,s4:88},
    model:{entities:{caso:['caso.caso_id','caso.barrio'],evento:['evento.evento_id','evento.caso_id']},pk:{caso:'caso.caso_id',evento:'evento.evento_id'},fkChoice:'evento.caso_id',fk:'evento.caso_id->caso.caso_id',cardinality:'1:N'},
    norm:{caso:['caso.caso_id','caso.barrio'],evento:['evento.evento_id','evento.caso_id'],agente:['agente.agente_id']},
    ddl:"-- COHORT_DDL\nCREATE TABLE caso(caso_id INTEGER);",
    ddlChecks:{dup_case:true,zero_valid:true},
    domainMigration:"INSERT INTO estado_catalogo(estado) VALUES('Escalado');",
    domainMigrationResult:{beforeFails:true,afterPass:true,pass:true},
    mutation:{no_case_pk:{probe:"INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9001,'2026-09-01','Ruido','Alta','Abierto','Prueba')",correct:'reject',mutant:'accept',pass:true}},
    mutationProbe:"INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9001,'2026-09-01','Ruido','Alta','Abierto','Prueba')",
    queries:{
      q1:"-- COHORT_Q1\nSELECT barrio, COUNT(*) AS casos_alta FROM casos_src WHERE prioridad='Alta' GROUP BY barrio;",
      q2:"-- COHORT_Q2\nSELECT caso_id FROM casos_src;",
      q3:"-- COHORT_Q3\nSELECT caso_id FROM eventos_src;",
      q4:"-- COHORT_Q4\nSELECT COUNT(*) AS total_casos FROM casos_src;",
      q5:"-- COHORT_Q5\nSELECT tipo FROM casos_src;"
    },
    queryChecks:{q1:{pass:2,total:4,details:[{name:'base',ok:true}]}},
    hints:{q1:3,q2:1,q3:2,q4:0,q5:1},
    doc:{embed:['snapshot_estado','evidencias'],refid:['ciudadano_ref'],outside:['historial_eventos'],storeCase:'document',storeLedger:'relational',partitionKey:'/caso_id'},
    dw:{grain:['grain:evento'],measure:['measure:minutos'],dimension:['dimension:fecha','dimension:barrio']},
    pipe:{oltp:['operacional'],olap:['fact_evento'],eventLatency:'streaming',dimLatency:'batch',transformMode:'elt'},
    bq:{partition:['fecha_evento'],cluster:['barrio','tipo']},
    nested:{root:['caso_id','estado'],array:['e.tipo'],executed:true,execError:''},
    format:{landing:['JSON'],analytics:['Parquet']},
    unnestQuery:"-- COHORT_UNNEST\nSELECT c.caso_id, ev.tipo FROM \x60proyecto.dataset.casos_nested\x60 c CROSS JOIN UNNEST(c.evidencias) ev",
    diag:{sql:"-- COHORT_DIAG\nSELECT caso_id FROM casos_dirty",fact:'confirmed',hyp:'hypothesis'},
    boss:{strategy:'two_facts',grain:['linea_pedido'],measure:['cantidad'],partition:['fecha_pedido'],cluster:['categoria'],unnestQuery:"-- COHORT_BOSS\nSELECT p.pedido_id, i.categoria, i.cantidad FROM pedidos p CROSS JOIN UNNEST(p.items) i",azure:{object_files:'blob_adls',operational_document:'cosmos',lakehouse_analytics:'fabric_databricks',bi_consumption:'power_bi'}},
    attempts:[{attempt:1,score:73,at:'2026-09-18T20:00:00Z'}]
  };
}

function critical(x){
  return {
    version:x.version,queries:x.queries,ddl:x.ddl,domainMigration:x.domainMigration,
    mutationProbe:x.mutationProbe,hints:x.hints,doc:x.doc,dw:x.dw,pipe:x.pipe,bq:x.bq,
    nested:x.nested,format:x.format,unnestQuery:x.unnestQuery,diag:x.diag,boss:x.boss,
    model:x.model,norm:x.norm,attempts:x.attempts,timing:x.timing
  };
}

async function boot({kind='eval',mode='practica',sourceState,solutionSession=null}){
  const isSolution=kind==='solution',isPractice=!isSolution&&mode==='practica',html=isSolution?solHtml:evalHtml,js=isSolution?solJs:(isPractice?practiceJs:evalJs);
  const url=isSolution?'https://example.test/solucionario-s15.html':'https://example.test/evaluador-s15-v7.html?modo='+mode;
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});
  const {window}=dom,document=window.document;
  Object.defineProperty(window,'innerWidth',{value:390,configurable:true});
  window.initSqlJs=async()=>SQL;
  window.confirm=()=>true;window.alert=()=>{};
  window.URL.createObjectURL=()=> 'blob:s15-cohort';window.URL.revokeObjectURL=()=>{};
  window.HTMLAnchorElement.prototype.click=function(){};
  window.IntersectionObserver=class{constructor(cb){this.cb=cb}observe(){}disconnect(){}};
  window.S15NestedDuckDB={ready:Promise.resolve(true),validate:async()=>({ok:true,fields:['caso_id','tipo'],rows:[[1001,'foto']]})};
  window.fetch=async input=>{
    const name=String(input).split('/').pop().split('?')[0],p=path.join(dataDir,name);
    if(!fs.existsSync(p))return{ok:false,status:404,text:async()=>'',json:async()=>({})};
    const body=fs.readFileSync(p,'utf8');
    return{ok:true,status:200,text:async()=>body,json:async()=>JSON.parse(body)};
  };
  Object.defineProperty(document,'currentScript',{configurable:true,get:()=>({src:'https://example.test/assets/learning/'+(isSolution?'s15-autograder-v7-solution.js':(isPractice?'s15-autograder-v7-practice.js':'s15-autograder-v7.js'))})});
  Object.defineProperty(document,'readyState',{configurable:true,get:()=> 'complete'});
  const raw=JSON.stringify(sourceState);
  window.localStorage.setItem(STORE,raw);
  if(solutionSession)window.sessionStorage.setItem('andesdb.s15.solution.v7',JSON.stringify(solutionSession));
  window.eval(js);
  await waitFor(()=>document.querySelector('#engineStatus')?.textContent.startsWith('Listo:'),'inicio '+kind+' '+mode);
  return{dom,window,document,sourceRaw:raw};
}

function assertCommonData(document,expected,{guided=false}={}){
  assert.equal(document.querySelector('#q1').value,expected.queries.q1);
  assert.equal(document.querySelector('#q2').value,expected.queries.q2);
  assert.equal(document.querySelector('#ddl').value,expected.ddl);
  assert.equal(document.querySelector('#domainMigration').readOnly,true);
  assert.match(document.querySelector('#domainMigration').value,/Escalado/);
  assert.equal(document.querySelector('#mutationProbe').readOnly,true);
  assert.equal(document.querySelector('#unnestQuery').value,expected.unnestQuery);
  assert.equal(document.querySelector('#bossUnnest').value,expected.boss.unnestQuery);
  assert.equal(document.querySelector('#docStoreCase').value,expected.doc.storeCase);
  assert.equal(document.querySelector('#docStoreLedger').value,expected.doc.storeLedger);
  assert.equal(document.querySelector('#docPartitionKey').value,expected.doc.partitionKey);
  assert.equal(document.querySelector('#eventLatency').value,expected.pipe.eventLatency);
  assert.equal(document.querySelector('#dimLatency').value,expected.pipe.dimLatency);
  assert.equal(document.querySelector('#transformMode').value,expected.pipe.transformMode);
  assert.equal(document.querySelector('#bossStrategy').value,expected.boss.strategy);
  assert.match(document.querySelector('#entity-caso').textContent,/caso_id/);
  assert.match(document.querySelector('#norm-caso').textContent,/caso_id/);
}

// 1) Práctica original: estado previo completo, 3 pistas y recarga sin perder respuestas.
const legacy=legacyState();
{
  const {dom,window,document}=await boot({kind:'eval',mode:'practica',sourceState:legacy});
  assert.match(document.querySelector('#modePill').textContent,/Práctica/);
  assertCommonData(document,legacy);
  assert.equal(document.querySelector('[data-hint="q1"]').disabled,true);
  assert.match(document.querySelector('[data-hint="q1"]').textContent,/3\/3 pistas vistas/);
  assert.equal(document.querySelector('#hints-q1').hidden,false);
  assert.match(document.querySelector('#hints-q1').textContent,/Pista 3\/3/);
  assert.match(document.querySelector('[data-hint="q2"]').textContent,/Pista 2\/3/);
  assert.match(document.querySelector('#hints-q2').textContent,/Pista 1\/3/);
  click(window,document.querySelector('[data-hint="q3"]'));
  await sleep(330);
  const saved=JSON.parse(window.localStorage.getItem(STORE));
  assert.equal(saved.hints.q3,3);
  assert.equal(saved.hints.q1,3);
  assert.equal(saved.queries.q1,legacy.queries.q1);
  assert.equal(saved.ddl,legacy.ddl);
  assert.equal(saved.unnestQuery,legacy.unnestQuery);
  assert.deepEqual(critical({...saved,hints:{...saved.hints,q3:2}}),critical(legacy),'Solo q3.hints puede cambiar en esta interacción');
  click(window,document.querySelector('#saveDraft'));
  await sleep(20);
  assert.equal(JSON.parse(window.localStorage.getItem(STORE)).version,'s15-workbench-v7');
  dom.window.close();
}

// 2) Recarga real de práctica con ese mismo progreso: los datos siguen visibles.
{
  const reloaded=legacyState();reloaded.hints.q3=3;
  const {dom,document}=await boot({kind:'eval',mode:'practica',sourceState:reloaded});
  assertCommonData(document,reloaded);
  assert.equal(document.querySelector('[data-hint="q3"]').disabled,true);
  assert.match(document.querySelector('#hints-q3').textContent,/Pista 3\/3/);
  dom.window.close();
}

// 3) Evaluación original: respeta límite 2 sin reducir ni borrar hints ya guardadas.
{
  const evalState=legacyState();
  const {dom,window,document}=await boot({kind:'eval',mode:'evaluacion',sourceState:evalState});
  assert.match(document.querySelector('#modePill').textContent,/Evaluación/);
  assertCommonData(document,evalState);
  assert.equal(document.querySelector('[data-hint="q1"]').disabled,true);
  assert.match(document.querySelector('[data-hint="q1"]').textContent,/2\/2 pistas vistas/);
  assert.match(document.querySelector('#hints-q1').textContent,/Pista 2\/2/);
  assert.match(document.querySelector('[data-hint="q2"]').textContent,/Pista 2\/2/);
  click(window,document.querySelector('[data-hint="q2"]'));
  await sleep(330);
  const saved=JSON.parse(window.localStorage.getItem(STORE));
  assert.equal(saved.hints.q1,3,'Una pista 3/3 previa no se reduce al abrir evaluación');
  assert.equal(saved.hints.q2,2);
  assert.equal(saved.queries.q1,evalState.queries.q1);
  assert.equal(saved.boss.unnestQuery,evalState.boss.unnestQuery);
  assert.equal(saved.attempts[0].score,73);
  dom.window.close();
}

// 4) Solucionario: importa el mismo progreso pero nunca escribe ni borra el STORE original.
{
  const source=legacyState(),sourceRaw=JSON.stringify(source);
  const {dom,window,document}=await boot({kind:'solution',sourceState:source});
  assertCommonData(document,source,{guided:true});
  assert.equal(document.querySelector('[data-solution="q1"]').disabled,false,'q1 con 3 pistas previas debe desbloquearse');
  assert.equal(document.querySelector('[data-solution="q2"]').disabled,true,'q2 con 1 pista sigue bloqueada');
  click(window,document.querySelector('[data-hint="q2"]'));
  click(window,document.querySelector('[data-hint="q2"]'));
  await sleep(330);
  assert.equal(document.querySelector('[data-solution="q2"]').disabled,false);
  assert.equal(window.localStorage.getItem(STORE),sourceRaw,'La guía no puede tocar el avance de la práctica original');
  assert.ok(window.sessionStorage.getItem('andesdb.s15.solution.v7'),'La guía usa su estado de sesión separado');
  dom.window.close();
}

console.log('OK · S15 cohorte: práctica + evaluación + solucionario preservan progreso, respuestas, pistas e IDs v7');
