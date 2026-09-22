import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const html=fs.readFileSync(path.join(ROOT,'Presentaciones/M6/sesion-16-cierre-dp900.html'),'utf8');
const timerJs=fs.readFileSync(path.join(ROOT,'assets/learning/presentation-timer.js'),'utf8');
const dom=new JSDOM(html,{url:'https://example.test/Presentaciones/M6/sesion-16-cierre-dp900.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.scrollTo=()=>{};
w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});

const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(inline.length,1);
w.eval(inline[0]);
w.eval(timerJs);

const slides=[...d.querySelectorAll('.slide')];
assert.equal(slides.length,16);
assert.equal(d.querySelector('.slide.active').dataset.title,'Portada');
assert.equal(d.querySelector('#count').textContent,'1 / 16');
assert.ok(d.querySelector('.toolbar'));
assert.ok(d.querySelector('.progress #bar'));

// No formularios pedagógicos / diagnóstico custom.
assert.equal(d.querySelector('main').querySelectorAll('textarea,input,select,.qcard,[data-post],[data-portfolio]').length,0);
assert.equal(d.querySelector('#send-report'),null);

// Timer compartido exacto: presets, libre, personalizado, ajustes y acciones.
const timer=d.querySelector('#andes-presentation-timer');
assert.ok(timer);
assert.ok(timer.classList.contains('is-icon'));
for(const mins of ['5','10','15','20']) assert.ok(timer.querySelector('[data-min="'+mins+'"]'));
assert.ok(timer.querySelector('[data-free]'));
assert.equal(timer.querySelector('.apt-custom-input').getAttribute('placeholder'),'Personalizado · 7:30 o 25');
assert.equal(timer.querySelector('[data-adjust="-300"]').textContent,'−5 min');
assert.equal(timer.querySelector('[data-adjust="300"]').textContent,'+5 min');
assert.match(timer.querySelector('.apt-start').textContent,/Iniciar/);
assert.match(timer.querySelector('.apt-reset').textContent,/Reiniciar/);

// T de la toolbar abre el mismo widget, no otro timer.
d.querySelector('#timeBtn').click();
assert.equal(timer.classList.contains('is-icon'),false);

// Navegación.
d.querySelector('#next').click();
assert.equal(d.querySelector('.slide.active').dataset.title,'Recorrido');
d.querySelector('#prev').click();
assert.equal(d.querySelector('.slide.active').dataset.title,'Portada');

let guard=0;
while(d.querySelector('#count').textContent!=='16 / 16' && guard<100){d.querySelector('#next').click();guard++}
assert.ok(guard<100);
assert.equal(d.querySelector('.slide.active').dataset.title,'Cierre');

// La pausa activa la pantalla de 15 min del timer compartido.
let pauseIndex=slides.findIndex(s=>s.dataset.title==='Pausa');
for(let k=0;k<slides.length;k++) slides[k].classList.toggle('active',k===pauseIndex);
await new Promise(r=>setTimeout(r,0));
assert.ok(d.querySelector('.apt-pause-stage').classList.contains('is-visible'));
assert.equal(d.querySelector('.apt-pause-time').textContent,'15:00');
assert.match(d.querySelector('.apt-pause-start').textContent,/Iniciar los 15 minutos/);

// DP-900 visible y condensado.
for(const title of ['Blueprint DP900','Cómo es el examen','Preguntas y estrategia','Práctica y voucher']){
  assert.ok(slides.some(s=>s.dataset.title===title),title);
}
for(const title of ['Interfaz y estrategia','Practice Assessment','Registro y voucher','Cheat sheet']){
  assert.equal(slides.some(s=>s.dataset.title===title),false,title);
}
for(const title of ['DP900 dominio1 datos','Familia Azure SQL','Azure Storage','Cosmos DB','Databricks Fabric PowerBI','Casos analítica Azure']){
  assert.equal(slides.some(s=>s.dataset.title===title),false,title);
}
assert.match(d.querySelector('[data-title="Cómo es el examen"]').textContent,/45 min/);
assert.match(d.querySelector('[data-title="Cómo es el examen"]').textContent,/700\+/);
assert.match(d.querySelector('[data-title="Cómo es el examen"]').textContent,/NO puedes abrir Microsoft Learn/);
assert.match(d.querySelector('[data-title="Cómo es el examen"]').textContent,/40–60/);
assert.match(d.querySelector('[data-title="Preguntas y estrategia"]').textContent,/drag & drop/);
assert.match(d.querySelector('[data-title="Práctica y voucher"]').textContent,/8–10/);
assert.match(d.querySelector('[data-title="Práctica y voucher"]').textContent,/14 días/);

dom.window.close();
console.log('OK · S16 v6 UI: 16 slides + timer S15 v7 + examen DP-900 vigente + práctica/voucher');
