import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const html=fs.readFileSync(path.join(ROOT,'Presentaciones/M6/sesion-16-cierre-dp900.html'),'utf8');
const dom=new JSDOM(html,{url:'https://example.test/Presentaciones/M6/sesion-16-cierre-dp900.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,1);
w.scrollTo=()=>{};
w.eval(scripts[0]);

const slides=[...d.querySelectorAll('.slide')];
assert.equal(slides.length,20);
assert.equal(d.querySelectorAll('.slide.active').length,1);
assert.equal(d.querySelector('.slide.active').dataset.title,'Portada');
assert.equal(d.querySelector('#count').textContent,'1 / 20');

// No formularios ni segundo examen.
assert.equal(d.querySelectorAll('textarea,input,select,.qcard,[data-post],[data-portfolio]').length,0);
assert.equal(d.querySelector('#send-report'),null);

// Navegación.
d.querySelector('#next').click();
assert.equal(d.querySelector('.slide.active').dataset.title,'Recorrido');
assert.equal(d.querySelector('#count').textContent,'2 / 20');
d.querySelector('#prev').click();
assert.equal(d.querySelector('.slide.active').dataset.title,'Portada');

for(let i=1;i<20;i++)d.querySelector('#next').click();
assert.equal(d.querySelector('.slide.active').dataset.title,'Cierre');
assert.equal(d.querySelector('#count').textContent,'20 / 20');
d.querySelector('#next').click();
assert.equal(d.querySelector('#count').textContent,'20 / 20');

// Recursos y elementos centrales.
assert.ok(d.querySelector('a[href="glosario-cierre-s16.html"]'));
assert.ok(d.querySelector('a[href*="practice-assessments-for-microsoft-certifications"]'));
assert.ok([...d.querySelectorAll('.slide')].some(s=>s.dataset.title==='Pensamiento SQL'));
assert.ok([...d.querySelectorAll('.slide')].some(s=>s.dataset.title==='Tres casos'));
assert.ok([...d.querySelectorAll('.slide')].some(s=>s.dataset.title==='Curso a DP900'));

dom.window.close();
console.log('OK · S16 UI: 20 slides, navegación estable y cero formularios/examen custom');
