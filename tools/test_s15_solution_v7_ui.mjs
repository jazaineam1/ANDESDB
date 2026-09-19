import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import initSqlJs from 'sql.js';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const html=fs.readFileSync(path.join(ROOT,'solucionario-s15.html'),'utf8');
const js=fs.readFileSync(path.join(ROOT,'assets/learning/s15-autograder-v7-solution.js'),'utf8');
const dataDir=path.join(ROOT,'Plantillas/proyecto-final/Datos');
const SQL=await initSqlJs();

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(fn,label,timeout=5000){const t=Date.now();while(Date.now()-t<timeout){if(fn())return;await sleep(15)}throw new Error('Timeout: '+label)}
function click(window,el){assert.ok(el,'Elemento no encontrado');el.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}))}

async function boot({reset=false}={}){
  const dom=new JSDOM(html,{url:'https://example.test/solucionario-s15.html',runScripts:'outside-only',pretendToBeVisual:true});
  const {window}=dom,document=window.document;
  Object.defineProperty(window,'innerWidth',{value:390,configurable:true});
  window.initSqlJs=async()=>SQL;
  window.confirm=()=>true;
  window.alert=()=>{};
  window.URL.createObjectURL=()=> 'blob:s15-solution-test';
  window.URL.revokeObjectURL=()=>{};
  window.HTMLAnchorElement.prototype.click=function(){};
  window.IntersectionObserver=class{constructor(cb){this.cb=cb}observe(){}disconnect(){}};
  window.S15NestedDuckDB={ready:Promise.resolve(true),validate:async()=>({ok:true,fields:['caso_id','tipo'],rows:[[1001,'foto']]})};
  window.fetch=async input=>{
    const name=String(input).split('/').pop().split('?')[0],p=path.join(dataDir,name);
    if(!fs.existsSync(p))return{ok:false,status:404,text:async()=>'',json:async()=>({})};
    const body=fs.readFileSync(p,'utf8');
    return{ok:true,status:200,text:async()=>body,json:async()=>JSON.parse(body)};
  };
  Object.defineProperty(document,'currentScript',{configurable:true,get:()=>({src:'https://example.test/assets/learning/s15-autograder-v7-solution.js'})});
  Object.defineProperty(document,'readyState',{configurable:true,get:()=> 'complete'});

  const source={version:'s15-workbench-v7',hints:{q1:3},queries:{q2:"SELECT 'BORRADOR ORIGINAL' AS marca;"}};
  const sourceRaw=JSON.stringify(source);
  window.localStorage.setItem('andesdb.s15.workbench.v7',sourceRaw);
  if(reset)window.sessionStorage.setItem('andesdb.s15.solution.reset.v7','1');

  window.eval(js);
  await waitFor(()=>document.querySelector('#engineStatus')?.textContent.startsWith('Listo:'),'inicialización solucionario');
  return{dom,window,document,sourceRaw};
}

{
  const {window,document,sourceRaw}=await boot();
  assert.match(document.querySelector('#modePill').textContent,/Práctica guiada/);

  // Un estudiante que ya tenía 3 pistas en la práctica desbloquea Q1 inmediatamente.
  const q1sol=document.querySelector('[data-solution="q1"]');
  assert.equal(q1sol.disabled,false);

  // Q2 empieza bloqueada y solo se desbloquea después de tres pistas.
  const q2=document.querySelector('#q2');
  assert.equal(q2.value,"SELECT 'BORRADOR ORIGINAL' AS marca;");
  const q2sol=document.querySelector('[data-solution="q2"]');
  const q2hint=document.querySelector('[data-hint="q2"]');
  assert.equal(q2sol.disabled,true);
  click(window,q2hint);
  assert.equal(q2sol.disabled,true);
  assert.match(document.querySelector('#status-q2').textContent,/Pista 1\/3/);
  click(window,q2hint);
  assert.equal(q2sol.disabled,true);
  assert.match(document.querySelector('#status-q2').textContent,/Pista 2\/3/);
  click(window,q2hint);
  assert.equal(q2sol.disabled,false);
  assert.match(document.querySelector('#status-q2').textContent,/Pista 3\/3/);

  const queryBefore=q2.value;
  const scoreBefore=document.querySelector('#score-sql').textContent;
  await sleep(330);
  const sessionBefore=window.sessionStorage.getItem('andesdb.s15.solution.v7');
  click(window,q2sol);
  assert.equal(q2.value,queryBefore,'Ver solución no debe sobrescribir SQL');
  assert.equal(document.querySelector('#score-sql').textContent,scoreBefore,'Ver solución no debe alterar puntuación');
  assert.equal(document.querySelector('#solution-q2').classList.contains('hidden'),false);
  click(window,q2sol);
  assert.equal(document.querySelector('#solution-q2').classList.contains('hidden'),true);
  await sleep(330);
  assert.ok(window.sessionStorage.getItem('andesdb.s15.solution.v7'));
  assert.notEqual(window.sessionStorage.getItem('andesdb.s15.solution.v7'),sessionBefore);
  assert.equal(window.localStorage.getItem('andesdb.s15.solution.v7'),null);
  assert.equal(window.localStorage.getItem('andesdb.s15.workbench.v7'),sourceRaw,'La guía no debe tocar el borrador original');

  // El mismo patrón 3 pistas -> solución existe en las demás estaciones.
  const s2sol=document.querySelector('[data-study-solution="s2"]');
  const s2hint=document.querySelector('[data-study-hint="s2"]');
  assert.equal(s2sol.disabled,true);
  click(window,s2hint); click(window,s2hint);
  assert.equal(s2sol.disabled,true);
  click(window,s2hint);
  assert.equal(s2sol.disabled,false);
  const modelScoreBefore=document.querySelector('#score-model').textContent;
  click(window,s2sol);
  assert.equal(document.querySelector('#score-model').textContent,modelScoreBefore);

  // DDL: solo el DDL es editable; probes/migración vienen preparados.
  assert.equal(document.querySelector('#ddl').readOnly,false);
  assert.equal(document.querySelector('#domainMigration').readOnly,true);
  assert.equal(document.querySelector('#mutationProbe').readOnly,true);
  assert.match(document.querySelector('#domainMigration').value,/Escalado/);
  click(window,document.querySelector('.tile[data-kind="mutant"][data-id="weak_minutes"]'));
  assert.equal(document.querySelector('#mutationProbe').readOnly,true);
  assert.match(document.querySelector('#mutationProbe').value,/VALUES\(9102,9001/);

  // Navegación móvil abre y cierra sin cambiar de página.
  const nav=document.querySelector('#nav');
  click(window,document.querySelector('#toggleNav'));
  assert.equal(nav.classList.contains('open'),true);
  click(window,nav.querySelector('a'));
  assert.equal(nav.classList.contains('open'),false);

  // Reiniciar no borra ni reescribe el progreso de la práctica original.
  click(window,document.querySelector('#resetDraft'));
  assert.equal(window.sessionStorage.getItem('andesdb.s15.solution.reset.v7'),'1');
  assert.equal(window.localStorage.getItem('andesdb.s15.workbench.v7'),sourceRaw);
  assert.equal(document.querySelector('[data-solution="q1"]').disabled,true);
  dom.window.close();
}

// Tras recargar en la misma pestaña con reset explícito, no se reimporta el source.
{
  const {dom,window,document,sourceRaw}=await boot({reset:true});
  assert.equal(document.querySelector('[data-solution="q1"]').disabled,true);
  assert.equal(window.localStorage.getItem('andesdb.s15.workbench.v7'),sourceRaw);
  assert.equal(window.localStorage.getItem('andesdb.s15.solution.v7'),null);
  dom.window.close();
}

console.log('OK · S15 solucionario UI: móvil, 3 pistas, desbloqueo, no-autorrelleno, no-score, DDL y aislamiento');
