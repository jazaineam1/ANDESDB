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
  const {dom,window,document,sourceRaw}=await boot();
  assert.match(document.querySelector('#modePill').textContent,/Práctica guiada/);

  const transferTasks=[...document.querySelectorAll('#sqlTasks .sqltask')].filter(x=>x.querySelector('.transfer-badge'));
  assert.equal(transferTasks.length,2);
  assert.deepEqual(transferTasks.map(x=>x.querySelector('h3').textContent.slice(0,2)).sort(),['Q3','Q5']);
  for(const q of ['Q1','Q2','Q4']){
    const article=[...document.querySelectorAll('#sqlTasks .sqltask')].find(x=>x.querySelector('h3').textContent.startsWith(q));
    assert.equal(article.querySelector('.transfer-badge'),null);
  }

  // Formato: ejemplos legibles y ayuda compacta.
  const docExample=document.querySelector('#s4 .example-code');
  const nestedExample=document.querySelector('#s7 .example-code');
  assert.ok(docExample && nestedExample,'Document y Nested deben tener bloques de ejemplo');
  assert.equal(docExample.textContent.includes('\\n'),false,'El JSON documental no debe mostrar \\n literales');
  assert.equal(nestedExample.textContent.includes('\\n'),false,'El JSON anidado no debe mostrar \\n literales');
  assert.ok(docExample.textContent.includes('\n  "caso_id"'),'El JSON documental debe tener saltos reales');
  assert.ok(nestedExample.textContent.includes('\n  "evidencias"'),'El JSON anidado debe tener saltos reales');
  assert.ok(document.querySelector('#s2 .study-guide-bar'),'La ayuda de estación debe usar barra compacta');
  assert.equal(document.querySelector('#study-hints-s2').hidden,true,'Sin pedir pistas no debe ocupar espacio un feedback vacío');

  // Un estudiante que ya tenía 3 pistas en la práctica desbloquea Q1 inmediatamente.
  const q1sol=document.querySelector('[data-solution="q1"]');
  assert.equal(q1sol.disabled,false);

  // Q2: el intento puede fallar, pero la solución se ejecuta aparte y pasa 4/4.
  const q2=document.querySelector('#q2');
  assert.equal(q2.value,"SELECT 'BORRADOR ORIGINAL' AS marca;");
  const q2sol=document.querySelector('[data-solution="q2"]');
  const q2hint=document.querySelector('[data-hint="q2"]');
  assert.equal(q2sol.disabled,true);

  click(window,document.querySelector('[data-run="q2"]'));
  await waitFor(()=>document.querySelector('#status-q2')?.textContent.includes('0/4'),'resultado 0/4 del intento Q2');
  const attemptStatusBefore=document.querySelector('#status-q2').textContent;
  const attemptResultBefore=document.querySelector('#result-q2').textContent;
  assert.match(attemptStatusBefore,/0\/4 escenarios visibles/);

  click(window,q2hint);
  assert.equal(q2sol.disabled,true);
  assert.match(document.querySelector('#hints-q2').textContent,/Pista 1\/3/);
  click(window,q2hint);
  assert.equal(q2sol.disabled,true);
  assert.match(document.querySelector('#hints-q2').textContent,/Pista 2\/3/);
  click(window,q2hint);
  assert.equal(q2sol.disabled,false);
  assert.match(document.querySelector('#hints-q2').textContent,/Pista 3\/3/);

  const queryBefore=q2.value;
  const scoreBefore=document.querySelector('#score-sql').textContent;
  assert.equal(document.querySelector('[data-sql-tabs="q2"]').hidden,false,'Tras 3 pistas aparecen las pestañas dentro de la pregunta');
  await sleep(330);
  const sessionBefore=window.sessionStorage.getItem('andesdb.s15.solution.v7');

  click(window,q2sol);
  await waitFor(()=>document.querySelector('#solution-status-q2')?.textContent.includes('4/4 escenarios de la solución'),'solución Q2 ejecutada 4/4');
  assert.equal(q2.value,queryBefore,'Ver solución no debe sobrescribir SQL');
  assert.equal(document.querySelector('#score-sql').textContent,scoreBefore,'Ejecutar la solución no debe alterar puntuación');
  assert.equal(document.querySelector('#solution-q2').hidden,false);
  assert.equal(document.querySelector('[data-sql-pane="q2|attempt"]').hidden,true,'La solución ocupa el área del intento sin modificarlo');
  assert.equal(document.querySelector('#status-q2').hidden,true,'El 0/4 del intento no debe mezclarse con la solución');
  assert.equal(document.querySelector('#result-q2').hidden,true,'La tabla del intento no debe mezclarse con la solución');
  assert.match(document.querySelector('#solution-status-q2').textContent,/4\/4 escenarios de la solución/);
  assert.match(document.querySelector('#solution-status-q2').textContent,/no modifica tu intento ni tu puntuación/i);
  assert.ok(document.querySelector('#solution-result-q2 table'),'La solución debe mostrar su tabla ejecutada');
  assert.match(document.querySelector('#solution-result-q2').textContent,/caso_id/);
  assert.match(document.querySelector('#solution-result-q2').textContent,/ultimo_estado/);

  click(window,document.querySelector('[data-sql-view="q2|explanation"]'));
  assert.equal(document.querySelector('#solution-q2').hidden,true);
  assert.equal(document.querySelector('#explanation-q2').hidden,false);
  assert.match(document.querySelector('#explanation-q2').textContent,/MAX\(estado\).*fecha/i);
  assert.equal(q2.value,queryBefore,'Abrir explicación tampoco modifica el SQL');

  click(window,document.querySelector('[data-sql-view="q2|attempt"]'));
  assert.equal(document.querySelector('[data-sql-pane="q2|attempt"]').hidden,false);
  assert.equal(document.querySelector('#status-q2').hidden,false);
  assert.equal(document.querySelector('#result-q2').hidden,false);
  assert.equal(document.querySelector('#status-q2').textContent,attemptStatusBefore,'Al volver debe reaparecer el 0/4 del estudiante');
  assert.equal(document.querySelector('#result-q2').textContent,attemptResultBefore,'Al volver debe reaparecer su resultado original');
  assert.equal(document.querySelector('#explanation-q2').hidden,true);

  // Todas las soluciones SQL de referencia deben ejecutar y validar 4/4 sin sumar nota.
  const scoreBeforeReferences=document.querySelector('#score-sql').textContent;
  for(const id of ['q1','q3','q4','q5']){
    const hintBtn=document.querySelector('[data-hint="'+id+'"]');
    const solutionBtn=document.querySelector('[data-solution="'+id+'"]');
    while(solutionBtn.disabled) click(window,hintBtn);
    click(window,document.querySelector('[data-sql-view="'+id+'|solution"]'));
    await waitFor(()=>document.querySelector('#solution-status-'+id)?.textContent.includes('4/4 escenarios de la solución'),'solución '+id+' 4/4');
    assert.ok(document.querySelector('#solution-result-'+id+' table'),'La solución '+id+' debe mostrar resultado ejecutado');
    click(window,document.querySelector('[data-sql-view="'+id+'|attempt"]'));
  }
  assert.equal(document.querySelector('#score-sql').textContent,scoreBeforeReferences,'Las soluciones de referencia no dan crédito');

  await sleep(330);
  assert.ok(window.sessionStorage.getItem('andesdb.s15.solution.v7'));
  assert.notEqual(window.sessionStorage.getItem('andesdb.s15.solution.v7'),sessionBefore);
  assert.equal(window.localStorage.getItem('andesdb.s15.solution.v7'),null);
  assert.equal(window.localStorage.getItem('andesdb.s15.workbench.v7'),sourceRaw,'La guía no debe tocar el borrador original');

  // El mismo patrón 3 pistas -> solución existe en las demás estaciones.
  const s2sol=document.querySelector('[data-study-solution="s2"]');
  const s2hint=document.querySelector('[data-study-hint="s2"]');
  assert.equal(s2sol.disabled,true);
  click(window,s2hint);
  assert.equal(document.querySelector('#study-hints-s2').hidden,false);
  assert.match(document.querySelector('#study-hints-s2').textContent,/Pista 1\/3/);
  click(window,s2hint);
  assert.equal(s2sol.disabled,true);
  click(window,s2hint);
  assert.equal(s2sol.disabled,false);
  const modelScoreBefore=document.querySelector('#score-model').textContent;
  click(window,s2sol);
  assert.equal(document.querySelector('#score-model').textContent,modelScoreBefore);
  assert.equal(document.querySelector('#s2').classList.contains('study-answer-open'),true,'La respuesta sustituye el área de trabajo de la estación');
  assert.equal(document.querySelector('#study-solution-s2').hidden,false);
  click(window,document.querySelector('[data-study-view="s2|explanation"]'));
  assert.equal(document.querySelector('#study-solution-s2').hidden,true);
  assert.equal(document.querySelector('#study-explanation-s2').hidden,false);
  assert.match(document.querySelector('#study-explanation-s2').textContent,/1:N.*AGENTE/i);
  click(window,document.querySelector('[data-study-view="s2|attempt"]'));
  assert.equal(document.querySelector('#s2').classList.contains('study-answer-open'),false);
  assert.equal(document.querySelector('#study-explanation-s2').hidden,true);
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
