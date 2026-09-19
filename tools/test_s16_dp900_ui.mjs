import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const html=fs.readFileSync(path.join(ROOT,'Presentaciones/M6/sesion-16-cierre-dp900.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.ok(scripts.length>=1,'S16 debe tener script inline');

function click(el){assert.ok(el);el.click()}
function change(el){el.dispatchEvent(new el.ownerDocument.defaultView.Event('change',{bubbles:true}))}
function input(el){el.dispatchEvent(new el.ownerDocument.defaultView.Event('input',{bubbles:true}))}
function correctResponse(q,card){
  if(q.k==='single') click(card.querySelector('.qopts button[data-choice="'+q.a+'"]'));
  else if(q.k==='yn') [...card.querySelectorAll('.ynrow')].forEach((row,i)=>click(row.querySelector('button[data-yn="'+q.s[i][1]+'"]')));
  else if(q.k==='match') [...card.querySelectorAll('.matchrow select')].forEach((sel,i)=>{sel.value=q.m[i][1];change(sel)});
}
function wrongSingle(q,card){
  const wrong=q.a===0?1:0;
  click(card.querySelector('.qopts button[data-choice="'+wrong+'"]'));
}
function boot(){
  const dom=new JSDOM(html,{url:'https://example.test/Presentaciones/M6/sesion-16-cierre-dp900.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,d=w.document,calls=[];
  w.fetch=async (url,opts={})=>{calls.push({url:String(url),opts});return{ok:true,status:200,json:async()=>({ok:true})}};
  w.localStorage.setItem('andesdb.lms.auth.v1',JSON.stringify({token:'token-prueba',user:{username:'estudiante'}}));
  w.eval(scripts[0]);
  return{dom,w,d,calls,api:w.S16DP900};
}

// Flujo perfecto: 24 escenarios = 48 componentes.
const {dom,w:window,d:document,calls,api}=boot();
assert.ok(api);
assert.equal(api.questions.length,24);
assert.deepEqual(Object.fromEntries(['core','rel','nonrel','ana'].map(x=>[x,api.questions.filter(q=>q.d===x).length])),{core:7,rel:6,nonrel:4,ana:7});
assert.equal(document.querySelectorAll('.qcard').length,24);
assert.equal(document.querySelectorAll('.slide').length,30);
assert.equal(document.querySelectorAll('[data-post]').length,5);
assert.equal(document.querySelectorAll('[data-portfolio]').length,8);
assert.equal(document.querySelectorAll('[data-survey]').length,4);
assert.ok(document.querySelector('#portfolio-url'));
assert.ok([...document.querySelectorAll('.slide')].some(s=>s.dataset.title==='Reflexión S1'));
assert.ok([...document.querySelectorAll('.slide')].some(s=>s.dataset.title==='Todo el SQL'));
assert.ok([...document.querySelectorAll('.slide')].some(s=>s.dataset.title==='Cápsula Azure'));
assert.ok(document.querySelector('a[href="glosario-cierre-s16.html"][download]'));

for(const q of api.questions){
  const card=document.querySelector('.qcard[data-qid="'+q.id+'"]');
  correctResponse(q,card);
  click(card.querySelector('[data-conf="2"]'));
  click(card.querySelector('.qcheck'));
  assert.equal(api.state.answers[q.id].good,true,'q'+q.id+' debe quedar correcta');
}
let s=api.summary();
assert.equal(s.answered,24);
assert.equal(s.scenarioCorrect,24);
assert.equal(s.componentCorrect,48);
assert.equal(s.componentTotal,48);
assert.equal(Array.from(s.weakDomains).length,0);
assert.equal(document.querySelector('#score-core').textContent,'15 / 15 comp.');
assert.equal(document.querySelector('#score-rel').textContent,'12 / 12 comp.');
assert.equal(document.querySelector('#score-nonrel').textContent,'8 / 8 comp.');
assert.equal(document.querySelector('#score-ana').textContent,'13 / 13 comp.');
assert.equal(document.querySelector('#overall-score').textContent,'48 / 48 comp.');
assert.equal(document.querySelector('#weak-domain').textContent,'Sin brecha clara');
assert.match(document.querySelector('#error-summary').textContent,/0 sin clas/);

// Exploración oficial y plan.
for(const key of ['guide','practice','sandbox','schedule']){
  const cb=document.querySelector('[data-official="'+key+'"]');cb.checked=true;change(cb);
}
const voucher=document.querySelector('#voucher-expiry'),target=document.querySelector('#exam-target');
voucher.value='2026-11-30';change(voucher);
target.value='2026-12-05';change(target);
assert.match(document.querySelector('#plan-output').textContent,/Ajusta la fecha/);
target.value='2026-11-20';change(target);
assert.doesNotMatch(document.querySelector('#plan-output').textContent,/Ajusta la fecha/);
assert.match(document.querySelector('#plan-output').textContent,/sin brecha clara/i);

// Reflexión S1.
[...document.querySelectorAll('[data-post]')].forEach((el,i)=>{el.value='Respuesta de cierre '+(i+1);input(el)});
assert.equal(Object.keys(api.state.post_s1).length,5);
assert.match(document.querySelector('#post-count').textContent,/5 \/ 5/);

// Portafolio + enlace + autopercepción.
for(const cb of document.querySelectorAll('[data-portfolio]')){cb.checked=true;change(cb)}
const portfolioUrl=document.querySelector('#portfolio-url');
portfolioUrl.value='https://github.com/ejemplo/portafolio';input(portfolioUrl);
assert.equal(api.state.portfolio_url,'https://github.com/ejemplo/portafolio');
assert.equal(Object.values(api.state.portfolio).filter(Boolean).length,8);
for(const sel of document.querySelectorAll('[data-survey]')){sel.value='4';change(sel)}
const surveyComment=document.querySelector('#survey-comment');surveyComment.value='Mantendría los laboratorios y más tiempo de práctica.';input(surveyComment);

// Envío v3.
click(document.querySelector('#send-report'));
await new Promise(r=>setTimeout(r,0));
assert.equal(calls.length,1);
const body=JSON.parse(calls[0].opts.body);
assert.equal(body.event_type,'challenge_completed');
assert.equal(body.session_number,16);
assert.equal(body.activity_code,'s16-dp900');
assert.equal(body.metadata.diagnostic_version,'dp900-2026-07-v3');
assert.equal(body.metadata.score,1);
assert.deepEqual(body.metadata.overall,{correct:48,total:48,scenario_correct:24,scenario_total:24});
assert.deepEqual(body.metadata.scores.core,{correct:15,total:15,scenario_correct:7,scenario_total:7});
assert.deepEqual(body.metadata.scores.rel,{correct:12,total:12,scenario_correct:6,scenario_total:6});
assert.deepEqual(body.metadata.scores.nonrel,{correct:8,total:8,scenario_correct:4,scenario_total:4});
assert.deepEqual(body.metadata.scores.ana,{correct:13,total:13,scenario_correct:7,scenario_total:7});
assert.deepEqual(body.metadata.weakest_domains,[]);
assert.equal(body.metadata.weakest_domain,null);
assert.equal(Object.keys(body.metadata.items).length,24);
assert.equal(body.metadata.items['2'].total,3);
assert.equal('response' in body.metadata.items['2'],false,'telemetría por ítem no debe incluir respuesta elegida');
assert.equal(body.metadata.portfolio_url,'https://github.com/ejemplo/portafolio');
assert.equal(body.metadata.confidence.average,2);
assert.equal(body.metadata.confidence.high_confidence_errors,0);
assert.equal(body.metadata.post_s1_completed,5);
assert.equal(Object.values(body.metadata.portfolio).filter(Boolean).length,8);
assert.equal(Object.keys(body.metadata.survey).length,4);
assert.equal(body.slide_number,30);
assert.match(document.querySelector('#report-status').textContent,/enviado al docente/i);

const saved=JSON.parse(window.localStorage.getItem('andesdb.s16.dp900.v3'));
assert.equal(Object.keys(saved.answers).length,24);
assert.equal(saved.portfolio_url,'https://github.com/ejemplo/portafolio');
assert.equal(saved.official.sandbox,true);
dom.window.close();

// Un error sin C/T/L bloquea el envío; clasificarlo lo habilita.
const b2=boot(),w2=b2.w,d2=b2.d,api2=b2.api;
for(const q of api2.questions){
  const card=d2.querySelector('.qcard[data-qid="'+q.id+'"]');
  if(q.id===1) wrongSingle(q,card); else correctResponse(q,card);
  click(card.querySelector('[data-conf="2"]'));
  click(card.querySelector('.qcheck'));
}
assert.equal(api2.summary().answered,24);
assert.equal(api2.summary().errors.U,1);
click(d2.querySelector('#send-report'));
await new Promise(r=>setTimeout(r,0));
assert.equal(b2.calls.length,0,'no debe enviar con errores sin clasificar');
assert.match(d2.querySelector('#report-status').textContent,/Clasifica como C, T o L/i);
const c1=d2.querySelector('.qcard[data-qid="1"]');
click(c1.querySelector('[data-error="T"]'));
assert.equal(api2.summary().errors.U,0);
assert.equal(api2.summary().errors.T,1);
click(d2.querySelector('#send-report'));
await new Promise(r=>setTimeout(r,0));
assert.equal(b2.calls.length,1);
const body2=JSON.parse(b2.calls[0].opts.body);
assert.equal(body2.metadata.errors.T,1);
assert.equal(body2.metadata.errors.U,0);
assert.deepEqual(body2.metadata.weakest_domains,['core']);
b2.dom.window.close();

// Un multiparte 2/3 conserva crédito parcial y no cuenta como escenario perfecto.
const b3=boot(),d3=b3.d,api3=b3.api,q2=api3.questions.find(q=>q.id===2),card2=d3.querySelector('.qcard[data-qid="2"]');
const rows=[...card2.querySelectorAll('.ynrow')];
click(rows[0].querySelector('button[data-yn="'+q2.s[0][1]+'"]'));
click(rows[1].querySelector('button[data-yn="'+q2.s[1][1]+'"]'));
const wrong3=q2.s[2][1]==='yes'?'no':'yes';
click(rows[2].querySelector('button[data-yn="'+wrong3+'"]'));
click(card2.querySelector('[data-conf="3"]'));
click(card2.querySelector('.qcheck'));
assert.equal(api3.state.answers[2].componentCorrect,2);
assert.equal(api3.state.answers[2].componentTotal,3);
assert.equal(api3.state.answers[2].good,false);
assert.match(card2.querySelector('.qfeedback').textContent,/Parcial: 2\/3/);
assert.equal(api3.summary().componentCorrect,2);
assert.equal(api3.summary().scenarioCorrect,0);
b3.dom.window.close();

console.log('OK · S16 UI v3: 24 escenarios/48 componentes + C/T/L obligatorio + plan + portafolio + reporte');
