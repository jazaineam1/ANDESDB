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

const inlineScripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(inlineScripts.length,1);
w.eval(inlineScripts[0]);
w.eval(timerJs);
await new Promise(r=>setTimeout(r,0));

const slides=[...d.querySelectorAll('.slide')];
assert.equal(slides.length,29);
assert.equal(d.querySelectorAll('.slide.active').length,1);
assert.equal(d.querySelector('.slide.active').dataset.title,'Portada');
assert.equal(d.querySelector('#count').textContent,'1 / 29');

// No formularios académicos ni segundo examen custom.
assert.equal(d.querySelector('main').querySelectorAll('textarea,input,select,.qcard,[data-post],[data-portfolio]').length,0);
assert.equal(d.querySelector('#send-report'),null);

// Shell visual tradicional.
assert.ok(d.querySelector('.toolbar'));
assert.ok(d.querySelector('.progress #bar'));
assert.equal(d.querySelector('.ctlbar'),null);
assert.equal(d.querySelectorAll('pre.sqlviz').length,8);
assert.equal(d.querySelectorAll('.copybtn').length,8);
assert.ok(d.querySelector('#timeBtn'));
assert.ok(d.querySelector('#fullBtn'));
assert.ok(d.querySelector('#dlBtn'));

// SVG desktop + móvil.
assert.equal(d.querySelectorAll('svg.s16-flowviz').length,8);
assert.equal(d.querySelectorAll('svg.s16-desktop-flowviz').length,4);
assert.equal(d.querySelectorAll('svg.s16-mobile-flowviz').length,4);

// Timer exacto compartido de S15 v7.
const timer=d.querySelector('#andes-presentation-timer');
assert.ok(timer);
assert.equal(timer.querySelectorAll('[data-min]').length,4);
assert.equal(timer.querySelector('[data-min="5"]').textContent.trim(),'5 min');
assert.equal(timer.querySelector('[data-min="10"]').textContent.trim(),'10 min');
assert.equal(timer.querySelector('[data-min="15"]').textContent.trim(),'15 min');
assert.equal(timer.querySelector('[data-min="20"]').textContent.trim(),'20 min');
assert.ok(timer.querySelector('[data-free]'));
assert.equal(timer.querySelector('.apt-custom-input').getAttribute('placeholder'),'Personalizado · 7:30 o 25');
assert.equal(timer.querySelector('[data-adjust="-300"]').textContent.trim(),'−5 min');
assert.equal(timer.querySelector('[data-adjust="300"]').textContent.trim(),'+5 min');
assert.match(timer.querySelector('.apt-start').textContent,/Iniciar/);
assert.match(timer.querySelector('.apt-reset').textContent,/Reiniciar/);
assert.ok(timer.querySelector('.apt-sound'));
assert.ok(timer.querySelector('.apt-toggle'));

// Botón T abre el mismo timer compartido.
assert.ok(timer.classList.contains('is-icon'));
d.querySelector('#timeBtn').click();
assert.ok(!timer.classList.contains('is-icon'));
timer.querySelector('.apt-toggle').click();
assert.ok(timer.classList.contains('is-icon'));

// Navegar hasta la pausa; el shared timer debe crear la pantalla amarilla con 15 min.
let guard=0;
while(d.querySelector('.slide.active').dataset.title!=='Pausa' && guard<100){d.querySelector('#next').click();guard++}
assert.ok(guard<100);
await new Promise(r=>setTimeout(r,0));
assert.ok(d.body.classList.contains('apt-pause-active'));
const pauseStage=d.querySelector('.apt-pause-stage');
assert.ok(pauseStage.classList.contains('is-visible'));
assert.equal(pauseStage.querySelector('.apt-pause-time').textContent,'15:00');
assert.match(pauseStage.querySelector('.apt-pause-start').textContent,/Iniciar los 15 minutos/);

// Salir de pausa y entrar al bloque DP-900.
d.querySelector('#next').click();
await new Promise(r=>setTimeout(r,0));
assert.equal(d.querySelector('.slide.active').dataset.title,'DP900 blueprint');
assert.ok(!d.body.classList.contains('apt-pause-active'));
assert.equal(d.querySelector('#count').textContent,'14 / 29');

// Cobertura DP-900 visible.
for(const title of ['DP900 blueprint','Core datos','Core roles','Relacional Azure','Relacional escenarios','Storage Azure','Cosmos DB','Analytics Azure','Databricks Fabric','Tiempo real','Power BI','Razonar DP900','DP900 práctico','Plan voucher']){
  assert.ok(slides.some(s=>s.dataset.title===title),title);
}
assert.equal(d.querySelectorAll('.dp-weight').length,4);
assert.ok(html.includes('25–30%'));
assert.ok(html.includes('Azure SQL Managed Instance'));
assert.ok(html.includes('API for NoSQL'));
assert.ok(html.includes('Azure Databricks'));
assert.ok(html.includes('Microsoft Fabric'));
assert.ok(html.includes('Power BI'));

// Recursos oficiales.
assert.ok(d.querySelector('a[href*="study-guides/dp-900"]'));
assert.ok(d.querySelector('a[href*="practice-assessments-for-microsoft-certifications"]'));
assert.ok(d.querySelector('a[href*="prepare-exam"]'));
assert.ok(d.querySelector('a[href*="register-schedule-exam"]'));

// Última diapositiva.
guard=0;
while(d.querySelector('#count').textContent!=='29 / 29' && guard<120){d.querySelector('#next').click();guard++}
assert.ok(guard<120);
assert.equal(d.querySelector('.slide.active').dataset.title,'Cierre');
while(d.querySelector('.slide.active').querySelector('[data-r]:not(.shown)')) d.querySelector('#next').click();
d.querySelector('#next').click();
assert.equal(d.querySelector('#count').textContent,'29 / 29');

dom.window.close();
console.log('OK · S16 UI v2: 29 slides + timer exacto S15 v7 + 4 dominios DP-900 + SVG desktop/móvil');
