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

const dom=new JSDOM(html,{url:'https://example.test/Presentaciones/M6/sesion-16-cierre-dp900.html',runScripts:'outside-only',pretendToBeVisual:true});
const {window}=dom,{document}=window;
const calls=[];
window.fetch=async (url,opts={})=>{calls.push({url:String(url),opts});return{ok:true,status:200,json:async()=>({ok:true})}};
window.localStorage.setItem('andesdb.lms.auth.v1',JSON.stringify({token:'token-prueba',user:{username:'estudiante'}}));
window.eval(scripts[0]);

const api=window.S16DP900;
assert.ok(api);
assert.equal(api.questions.length,24);
assert.deepEqual(Object.fromEntries(['core','rel','nonrel','ana'].map(d=>[d,api.questions.filter(q=>q.d===d).length])),{core:7,rel:6,nonrel:4,ana:7});
assert.equal(document.querySelectorAll('.qcard').length,24);

function click(el){assert.ok(el);el.click()}
function change(el){el.dispatchEvent(new el.ownerDocument.defaultView.Event('change',{bubbles:true}))}

// Responder correctamente todos los formatos.
for(const q of api.questions){
  const card=document.querySelector('.qcard[data-qid="'+q.id+'"]');
  assert.ok(card,'falta q'+q.id);
  if(q.k==='single'){
    click(card.querySelector('.qopts button[data-choice="'+q.a+'"]'));
  }else if(q.k==='yn'){
    [...card.querySelectorAll('.ynrow')].forEach((row,i)=>click(row.querySelector('button[data-yn="'+q.s[i][1]+'"]')));
  }else if(q.k==='match'){
    [...card.querySelectorAll('.matchrow select')].forEach((sel,i)=>{sel.value=q.m[i][1];change(sel)});
  }
  click(card.querySelector('[data-conf="2"]'));
  assert.equal(api.state.confidence[q.id],2);
  click(card.querySelector('.qcheck'));
  assert.equal(api.state.answers[q.id].good,true,'q'+q.id+' debe quedar correcta');
}
let s=api.summary();
assert.equal(s.total,24);
assert.equal(s.answered,24);
assert.equal(document.querySelector('#score-core').textContent,'7 / 7');
assert.equal(document.querySelector('#score-rel').textContent,'6 / 6');
assert.equal(document.querySelector('#score-nonrel').textContent,'4 / 4');
assert.equal(document.querySelector('#score-ana').textContent,'7 / 7');
assert.equal(document.querySelector('#overall-score').textContent,'24 / 24');

// Exploración oficial y plan persistente.
for(const key of ['guide','practice','sandbox','schedule']){
  const cb=document.querySelector('[data-official="'+key+'"]');cb.checked=true;change(cb);assert.equal(api.state.official[key],true);
}
const voucher=document.querySelector('#voucher-expiry'),target=document.querySelector('#exam-target');
voucher.value='2026-11-30';change(voucher);
target.value='2026-12-05';change(target);
assert.match(document.querySelector('#plan-output').textContent,/Ajusta la fecha/);
target.value='2026-11-20';change(target);
assert.doesNotMatch(document.querySelector('#plan-output').textContent,/Ajusta la fecha/);
assert.match(document.querySelector('#plan-output').textContent,/2026-11-20/);

// Enviar resultado al docente.
click(document.querySelector('#send-report'));
await new Promise(r=>setTimeout(r,0));
assert.equal(calls.length,1);
assert.match(calls[0].url,/learning-track$/);
const body=JSON.parse(calls[0].opts.body);
assert.equal(body.event_type,'challenge_completed');
assert.equal(body.session_number,16);
assert.equal(body.activity_code,'s16-dp900');
assert.equal(body.metadata.overall.correct,24);
assert.equal(body.metadata.overall.total,24);
assert.deepEqual(body.metadata.scores.core,{correct:7,total:7});
assert.deepEqual(body.metadata.scores.rel,{correct:6,total:6});
assert.deepEqual(body.metadata.scores.nonrel,{correct:4,total:4});
assert.deepEqual(body.metadata.scores.ana,{correct:7,total:7});
assert.equal(body.metadata.exam_target,'2026-11-20');
assert.equal(body.metadata.voucher_expiry,'2026-11-30');
assert.equal(body.metadata.confidence.average,2);
assert.equal(body.metadata.confidence.high_confidence_errors,0);
assert.match(document.querySelector('#report-status').textContent,/enviado al docente/i);

// Persistencia local.
const saved=JSON.parse(window.localStorage.getItem('andesdb.s16.dp900.v2'));
assert.equal(Object.keys(saved.answers).length,24);
assert.equal(saved.exam_target,'2026-11-20');
assert.equal(saved.official.sandbox,true);

// Un error requiere clasificación C/T/L y entra al resumen.
dom.window.close();

const dom2=new JSDOM(html,{url:'https://example.test/Presentaciones/M6/sesion-16-cierre-dp900.html',runScripts:'outside-only',pretendToBeVisual:true});
const w2=dom2.window,d2=w2.document;
w2.fetch=async()=>({ok:true,status:200,json:async()=>({})});
w2.eval(scripts[0]);
const q1=w2.S16DP900.questions[0],card=d2.querySelector('.qcard[data-qid="1"]');
const wrong=q1.a===0?1:0;
click(card.querySelector('.qopts button[data-choice="'+wrong+'"]'));
click(card.querySelector('.qcheck'));
assert.equal(w2.S16DP900.state.answers[1],undefined,'Sin confianza no debe revelar ni guardar respuesta');
assert.match(card.querySelector('.qfeedback').textContent,/confianza/i);
click(card.querySelector('[data-conf="3"]'));
click(card.querySelector('.qcheck'));
assert.equal(w2.S16DP900.state.answers[1].good,false);
assert.equal(card.querySelector('.errclass').classList.contains('show'),true);
click(card.querySelector('[data-error="T"]'));
assert.equal(w2.S16DP900.state.errors[1],'T');
assert.equal(w2.S16DP900.summary().errors.T,1);

console.log('OK · S16 UI: 24 preguntas, formatos mixtos, plan voucher y reporte docente');
