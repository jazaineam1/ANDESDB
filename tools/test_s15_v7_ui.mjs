import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import initSqlJs from 'sql.js';

const ROOT=path.resolve(import.meta.dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'evaluador-s15-v7.html'),'utf8');
const js=fs.readFileSync(path.join(ROOT,'assets/learning/s15-autograder-v7.js'),'utf8');
const dataDir=path.join(ROOT,'Plantillas/proyecto-final/Datos');
const SQL=await initSqlJs();

const dom=new JSDOM(html,{url:'https://example.test/evaluador-s15-v7.html?modo=evaluacion',runScripts:'outside-only',pretendToBeVisual:true});
const window=dom.window,document=window.document;
window.initSqlJs=async()=>SQL;
window.confirm=()=>true;
window.alert=()=>{};
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

for(const id of ['sql','model','ddl','doc','dw','bq','nested'])assert.equal(document.querySelector('#score-'+id).textContent,'—');

await place('model','caso.caso_id','model:caso');
assert.match(document.querySelector('#entity-caso').textContent,/caso_id/);
assert.equal(document.querySelector('#score-model').textContent,'—');
for(const id of ['caso.fecha_creacion','caso.tipo','caso.prioridad','caso.estado','caso.barrio'])await place('model',id,'model:caso');
for(const id of ['evento.evento_id','evento.caso_id','evento.fecha_evento','evento.estado','evento.minutos_desde_anterior'])await place('model',id,'model:evento');
click(document.querySelector('[data-model-field="caso.caso_id"]'));
click(document.querySelector('[data-model-field="evento.evento_id"]'));
change('#fkSelect','evento.caso_id');change('#cardinalitySelect','1:N');
for(const pair of [
 ['caso.caso_id','caso'],['caso.barrio','caso'],
 ['evento.evento_id','evento'],['evento.caso_id','evento'],['evento.fecha_evento','evento'],['evento.agente_id','evento'],
 ['agente.agente_id','agente'],['agente.agente_nombre','agente']
])await place('norm',pair[0],'norm:'+pair[1]);
click(document.querySelector('[data-check="model"]'));
const modelScore=document.querySelector('#score-model').textContent;
if(modelScore!=='12')console.log('MODEL_DEBUG',JSON.stringify({score:modelScore,feedback:document.querySelector('#fb-model').textContent,fk:document.querySelector('#fkView').textContent,cardinality:document.querySelector('#cardinalitySelect').value,caso:document.querySelector('#entity-caso').textContent,evento:document.querySelector('#entity-evento').textContent,normCaso:document.querySelector('#norm-caso').textContent,normEvento:document.querySelector('#norm-evento').textContent,normAgente:document.querySelector('#norm-agente').textContent}));
assert.equal(modelScore,'12');

for(const id of ['q1','q2','q3','q4','q5']){
  click(document.querySelector('[data-run="'+id+'"]'));
  await waitFor(()=>/^0\/4 escenarios/.test(document.querySelector('#status-'+id).textContent),id+' starter 0/4');
}

click(document.querySelector('#runDdl'));
await waitFor(()=>document.querySelectorAll('#ddlTests .pill').length===7,'pruebas DDL starter');
assert.equal(document.querySelectorAll('#ddlTests .pill.ok').length,1);
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

console.log('OK · S15 v7 UI jsdom: tap ER, FK, score gating, starters 0/4, DDL extra, Document, sobreinclusión y UNNEST');
