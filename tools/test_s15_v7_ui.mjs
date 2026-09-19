import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import initSqlJs from 'sql.js';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const html=fs.readFileSync(path.join(ROOT,'evaluador-s15-v7.html'),'utf8');
const js=fs.readFileSync(path.join(ROOT,'assets/learning/s15-autograder-v7.js'),'utf8');
const dataDir=path.join(ROOT,'Plantillas/proyecto-final/Datos');
const SQL=await initSqlJs();

const dom=new JSDOM(html,{url:'https://example.test/evaluador-s15-v7.html?modo=evaluacion',runScripts:'outside-only',pretendToBeVisual:true});
const window=dom.window,document=window.document;
window.initSqlJs=async()=>SQL;
window.confirm=()=>true;
window.alert=()=>{};
window.URL.createObjectURL=()=> 'blob:s15-test';
window.URL.revokeObjectURL=()=>{};
window.HTMLAnchorElement.prototype.click=function(){};
window.IntersectionObserver=class{
  constructor(cb){this.cb=cb;this.items=[]}
  observe(el){this.items.push(el)}
  disconnect(){}
};
window.S15NestedDuckDB={ready:Promise.resolve(true),validate:async()=>({ok:true,fields:['caso_id','tipo'],rows:[[1001,'foto']]})};
window.fetch=async input=>{
  const url=String(input),name=url.split('/').pop().split('?')[0],p=path.join(dataDir,name);
  if(!fs.existsSync(p))return{ok:false,status:404,text:async()=>'',json:async()=>({})};
  const body=fs.readFileSync(p,'utf8');
  return{ok:true,status:200,text:async()=>body,json:async()=>JSON.parse(body)};
};
Object.defineProperty(document,'currentScript',{configurable:true,get:()=>({src:'https://example.test/assets/learning/s15-autograder-v7.js'})});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(fn,label,timeout=5000){const t=Date.now();while(Date.now()-t<timeout){if(fn())return;await sleep(15)}throw new Error('Timeout: '+label)}
function click(el){assert.ok(el,'Elemento no encontrado');el.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}))}
function change(sel,value){const el=document.querySelector(sel);assert.ok(el,sel);el.value=value;el.dispatchEvent(new window.Event('change',{bubbles:true}))}
function setText(sel,value){const el=document.querySelector(sel);assert.ok(el,sel);el.value=value;el.dispatchEvent(new window.Event('input',{bubbles:true}))}
function tile(kind,id){return document.querySelector('.tile[data-kind="'+kind+'"][data-id="'+id+'"]')}
async function place(kind,id,drop){click(tile(kind,id));click(document.querySelector('[data-drop="'+drop+'"]'));await sleep(0)}

window.eval(js);
if(document.readyState==='loading')document.dispatchEvent(new window.Event('DOMContentLoaded',{bubbles:true}));
await waitFor(()=>document.querySelector('#engineStatus')?.textContent.startsWith('Listo:'),'inicialización');
assert.match(document.querySelector('#modePill').textContent,/Invitado.*Evaluación/);
assert.match(document.querySelector('#authStatus').textContent,/evaluación local determinística/i);
assert.equal(document.querySelector('#serverScoreLabel').textContent,'/100 no se registra');

for(const id of ['sql','model','ddl','doc','dw','bq','nested'])assert.equal(document.querySelector('#score-'+id).textContent,'—');

await place('model','caso.caso_id','model:caso');
assert.match(document.querySelector('#entity-caso').textContent,/caso_id/);
assert.equal(document.querySelector('#score-model').textContent,'—');
for(const id of ['caso.fecha_creacion','caso.tipo','caso.prioridad','caso.estado','caso.barrio'])await place('model',id,'model:caso');
for(const id of ['evento.evento_id','evento.caso_id','evento.fecha_evento','evento.estado','evento.minutos_desde_anterior'])await place('model',id,'model:evento');
change('#pkCaseSelect','caso.caso_id');change('#pkEventSelect','evento.evento_id');
click(document.querySelector('[data-model-field="caso.caso_id"]'));
assert.equal(document.querySelector('#pkCaseSelect').value,'caso.caso_id');
change('#fkSelect','evento.caso_id');change('#cardinalitySelect','1:N');
for(const pair of [
 ['caso.caso_id','caso'],['caso.barrio','caso'],
 ['evento.evento_id','evento'],['evento.caso_id','evento'],['evento.fecha_evento','evento'],['evento.agente_id','evento'],
 ['agente.agente_id','agente'],['agente.agente_nombre','agente']
])await place('norm',pair[0],'norm:'+pair[1]);
click(document.querySelector('[data-check="model"]'));
assert.equal(document.querySelector('#score-model').textContent,'12');

for(const id of ['q1','q2','q3','q4','q5']){
  click(document.querySelector('[data-run="'+id+'"]'));
  await waitFor(()=>/^0\/4 escenarios/.test(document.querySelector('#status-'+id).textContent),id+' starter 0/4');
}

click(document.querySelector('#runDdl'));
await waitFor(()=>document.querySelectorAll('#ddlTests .pill').length===7,'pruebas DDL starter');
assert.equal(document.querySelectorAll('#ddlTests .pill.ok').length,1);

// Regresión de la captura: las demos preparadas pueden ser válidas, pero con el DDL roto no regalan 0.7 puntos.
assert.equal(document.querySelector('#mutationProbe').readOnly,true);
assert.equal(document.querySelector('#domainMigration').readOnly,true);
for(const id of ['no_case_pk','wrong_fk','weak_minutes']){
  click(tile('mutant',id));
  assert.notEqual(document.querySelector('#mutationProbe').value.trim(),'');
  click(document.querySelector('#runMutation'));
  await waitFor(()=>document.querySelector('#mutationState').textContent.includes('Esquema correcto'),id+' mutation outcome');
  assert.match(document.querySelector('#mutationState').textContent,/no suma puntaje/i);
}
click(document.querySelector('#runDomainMigration'));
await waitFor(()=>document.querySelector('#domainMigrationFeedback').classList.contains('ok'),'migración preparada');
assert.match(document.querySelector('#domainMigrationFeedback').textContent,/no suma puntaje/i);
click(document.querySelector('[data-check="ddl"]'));
assert.equal(document.querySelector('#score-ddl').textContent,'0','Mutation/Escalado no pueden sumar con las restricciones DDL rotas');

const ddlExtra=[
 'CREATE TABLE caso(',
 ' caso_id INTEGER PRIMARY KEY,',
 ' fecha_creacion TEXT NOT NULL,',
 ' ciudadano_id TEXT,',
 ' tipo TEXT NOT NULL,',
 ' prioridad TEXT NOT NULL,',
 ' estado TEXT NOT NULL,',
 ' barrio TEXT NOT NULL,',
 ' canal TEXT',
 ');',
 'CREATE TABLE evento(',
 ' evento_id INTEGER PRIMARY KEY,',
 ' caso_id INTEGER NOT NULL,',
 ' fecha_evento TEXT NOT NULL,',
 ' estado TEXT NOT NULL,',
 ' agente_id TEXT,',
 ' minutos_desde_anterior INTEGER NOT NULL CHECK(minutos_desde_anterior>=0),',
 ' FOREIGN KEY(caso_id) REFERENCES caso(caso_id)',
 ');'
].join('\n');
setText('#ddl',ddlExtra);click(document.querySelector('#runDdl'));
await waitFor(()=>document.querySelectorAll('#ddlTests .pill.ok').length===7,'DDL extra 7/7');
click(document.querySelector('[data-check="ddl"]'));
assert.equal(document.querySelector('#score-ddl').textContent,'10','Los 10 puntos provienen solo del comportamiento del DDL');

for(const id of ['snapshot_estado','evidencias'])await place('doc',id,'doc:embed');
await place('doc','ciudadano_ref','doc:refid');
for(const id of ['historial_eventos','perfil_ciudadano'])await place('doc',id,'doc:outside');
change('#docStoreCase','document');change('#docStoreLedger','relational');change('#docPartitionKey','/caso_id');
assert.equal(document.querySelector('#score-doc').textContent,'—');
click(document.querySelector('[data-check="doc"]'));
assert.equal(document.querySelector('#score-doc').textContent,'10');

await place('bq','fecha_evento','bq:partition');
await place('bq','barrio','bq:cluster');await place('bq','tipo','bq:cluster');
click(document.querySelector('[data-check="bq"]'));assert.equal(document.querySelector('#score-bq').textContent,'10');
await place('bq','estado','bq:partition');
click(document.querySelector('[data-check="bq"]'));assert.notEqual(document.querySelector('#score-bq').textContent,'10');

await place('dw','grain:evento','dw:grain');await place('dw','grain:caso','dw:grain');
for(const id of ['measure:conteo_evento','measure:minutos'])await place('dw',id,'dw:measure');
for(const id of ['dimension:fecha','dimension:barrio','dimension:tipo','dimension:prioridad','dimension:estado'])await place('dw',id,'dw:dimension');
await place('pipe','operacional','pipe:oltp');await place('pipe','fact_evento','pipe:olap');
change('#eventLatency','streaming');change('#dimLatency','batch');change('#transformMode','elt');
click(document.querySelector('[data-check="dw"]'));assert.notEqual(document.querySelector('#score-dw').textContent,'13');

for(const id of ['caso_id','estado'])await place('nested',id,'nested:root');
for(const id of ['e.tipo','e.url','e.texto'])await place('nested',id,'nested:array');
await place('format','JSON','format:landing');await place('format','Parquet','format:analytics');
setText('#unnestQuery',"SELECT c.caso_id, ev.tipo\nFROM \x60proyecto.dataset.casos_nested\x60 AS c\nCROSS JOIN UNNEST(c.evidencias) AS ev");
click(document.querySelector('#runNested'));
await waitFor(()=>document.querySelector('#unnestFeedback').classList.contains('ok'),'UNNEST alias ev');
click(document.querySelector('[data-check="nested"]'));assert.equal(document.querySelector('#score-nested').textContent,'10');
setText('#unnestQuery',"SELECT c.caso_id\nFROM \x60proyecto.dataset.casos_nested\x60 AS c\n-- CROSS JOIN UNNEST(c.evidencias) AS ev");
click(document.querySelector('#runNested'));
await waitFor(()=>document.querySelector('#unnestFeedback').classList.contains('warn'),'UNNEST comentario rechazado');
click(document.querySelector('[data-check="nested"]'));assert.notEqual(document.querySelector('#score-nested').textContent,'10');

// Boss invitado: 20/20 con criterios cerrados y sin texto libre.
change('#bossStrategy','two_facts');
await place('bossdw','linea_pedido','boss:grain');
await place('bossdw','cantidad','boss:measure');await place('bossdw','importe','boss:measure');
await place('bossbq','fecha_pedido','boss:partition');
await place('bossbq','categoria','boss:cluster');await place('bossbq','canal','boss:cluster');
setText('#bossUnnest',"SELECT p.pedido_id, i.categoria, i.cantidad\nFROM pedidos AS p\nCROSS JOIN UNNEST(p.items) AS i");
change('#az-object','blob_adls');change('#az-document','cosmos');change('#az-lakehouse','fabric_databricks');change('#az-bi','power_bi');
click(document.querySelector('#checkBoss'));
assert.equal(document.querySelector('#score-boss').textContent,'20');
assert.match(document.querySelector('#fb-boss').textContent,/20\/20/);

// El envío invitado calcula un resultado local y no llama al grader.
click(document.querySelector('#submitFinal'));
assert.notEqual(document.querySelector('#finalTotal').textContent,'—');
assert.match(document.querySelector('#engineStatus').textContent,/Modo invitado: resultado local/);

console.log('OK · S15 v7 UI jsdom: invitado, arranque, ER/FK, score gating, SQL, DDL, Mutation, Document, BigQuery, UNNEST y Boss local 20/20');
