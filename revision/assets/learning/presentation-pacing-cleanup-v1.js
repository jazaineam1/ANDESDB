(()=>{
'use strict';
if(window.__ANDES_PRESENTATION_PACING_CLEANUP_V1__)return;
window.__ANDES_PRESENTATION_PACING_CLEANUP_V1__=true;

const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const match=(location.pathname+' '+document.title).match(/sesion[-_\s]*(1[3-6])/i)||document.title.match(/Sesión\s*(1[3-6])/i);
const session=match?Number(match[1]):0;
if(session<13||session>16)return;

/*
 * El ritmo pertenece a la guía docente, no a la pantalla del estudiante.
 * Estas etiquetas describen la función pedagógica de cada diapositiva sin
 * convertir el minutaje del profesor en una promesa/contador para el grupo.
 */
const LABELS={
  13:{
    'puente s12 → s13':'Recuperación',
    'ruta de acceso':'Acceso al entorno',
    'preflight':'Preparación del entorno',
    'partición':'Concepto',
    '9 vs 4':'Ejemplo visual',
    'sql particionado':'Ejemplo guiado',
    'laboratorio partición':'Laboratorio BigQuery',
    'pausa':'Pausa',
    'clusterización':'Concepto',
    'orden del clustering':'Razonamiento',
    'laboratorio clustering':'Laboratorio BigQuery',
    'se puede cambiar':'Precisión técnica',
    'bytes procesados':'Evidencia',
    'práctica adicional':'Extensión opcional',
    'checkpoint independiente':'Transferencia',
    'cierre':'Cierre'
  },
  14:{
    'puente':'Recuperación',
    'objetivos':'Meta de aprendizaje',
    'relacional vs anidado':'Concepto',
    'array y struct':'Estructura anidada',
    'unnest':'Cambio de grano',
    'reasoning check':'Razonamiento',
    'csv json parquet':'Formatos',
    'pausa':'Pausa',
    'lab oficial':'Laboratorio BigQuery',
    'workshop bigquery':'Práctica guiada',
    'proyecto integrador':'Diseño integrador',
    'azure por necesidad':'Transferencia DP-900',
    'caso azure':'Decisión',
    'salida':'Cierre'
  },
  15:{
    'puente':'Hilo del curso',
    'caso':'Caso nuevo',
    'archivos':'Datos del reto',
    'controles':'Validación',
    'entregables':'Evidencia final',
    'decisiones':'Decisiones',
    'arquitectura':'Arquitectura',
    'pausa':'Pausa',
    'trabajo autónomo':'Trabajo autónomo',
    'consultas mínimas':'Consultas',
    'pruebas negativas':'Validación',
    'salida analítica':'Transferencia analítica',
    'rúbrica':'Criterios de evaluación',
    'code ownership':'Defensa técnica',
    'defensa':'Defensa',
    'cierre':'Cierre'
  },
  16:{
    'puente s15':'Recuperación',
    'pre/post':'Comparación S1 ↔ S16',
    'blueprint':'Mapa DP-900',
    'mapa único':'Recuperación espaciada',
    'cómo responder':'Método',
    'escenarios 1–3':'Conceptos centrales',
    'escenarios 4–6':'Relacional',
    'pausa':'Pausa',
    'escenarios 7–8':'No relacional',
    'escenarios 9–11':'Analítica',
    'escenarios 12–13':'Analítica y visualización',
    'clasifica el error':'Diagnóstico',
    'plan individual':'Plan personal',
    'evidencia final':'Evidencia',
    'cierre':'Cierre'
  }
};

function titleOf(slide){return fold(slide?.dataset?.title||slide?.querySelector('h1,h2')?.textContent||'')}
function fallbackLabel(text){
  return String(text||'')
    .replace(/^\s*\d+\s*[–—-]\s*\d+\s*(?:min(?:utos?)?|seg(?:undos?)?|s)\s*(?:·\s*)?/i,'')
    .replace(/^\s*\d+\s*(?:min(?:utos?)?|seg(?:undos?)?|s)\s*(?:·\s*)?/i,'')
    .replace(/^\s*Dentro del trabajo autónomo\s*$/i,'Trabajo autónomo')
    .trim();
}
function cleanSlide(slide){
  if(!slide)return;
  const key=titleOf(slide);
  const ey=slide.querySelector(':scope > .ey,.ey');
  if(ey){
    const label=LABELS[session]?.[key];
    const cleaned=label||fallbackLabel(ey.textContent);
    if(cleaned)ey.textContent=cleaned;
  }
  if(key==='pausa'){
    const h=slide.querySelector('h1,h2');
    if(h)h.textContent='Pausa';
  }
  slide.querySelectorAll('.brand span').forEach(span=>{
    const t=(span.textContent||'').trim();
    if(/^\d+(?:\s*[–—-]\s*\d+)?\s*(?:min(?:utos?)?|seg(?:undos?)?|s)$/i.test(t))span.remove();
  });
}
function removeStudentPacingArtifacts(){
  /* Capa antigua de “actividad + producto”: útil como guía docente, no como slide. */
  document.querySelectorAll('.sc-activity,.sc-product').forEach(el=>el.remove());
  /* La guía docente se consulta fuera de la proyección; no exponemos el botón N. */
  document.querySelectorAll('#sc-note-open,#sc-note-overlay,.sc-note-overlay').forEach(el=>el.remove());
  document.querySelectorAll('.story-surprise').forEach(el=>{
    el.innerHTML=el.innerHTML
      .replace(/En\s+\d+\s*(?:min|minutos?)\s+responde:/gi,'Responde:')
      .replace(/en\s+\d+\s*(?:min|minutos?)\s+responde:/gi,'responde:');
  });
  document.querySelectorAll('.slide').forEach(cleanSlide);
}

function css(){
  if(document.getElementById('andes-pacing-cleanup-css'))return;
  const style=document.createElement('style');
  style.id='andes-pacing-cleanup-css';
  /* Evita flash si una versión antigua cacheada intenta inyectar esos bloques. */
  style.textContent='.sc-activity,.sc-product,#sc-note-open,#sc-note-overlay,.sc-note-overlay{display:none!important}';
  document.head.appendChild(style);
}
let timer=0;
function schedule(){clearTimeout(timer);timer=setTimeout(removeStudentPacingArtifacts,0)}
function boot(){
  css();
  removeStudentPacingArtifacts();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
