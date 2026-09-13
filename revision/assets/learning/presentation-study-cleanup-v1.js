(()=>{
'use strict';
if(window.__ANDES_PRESENTATION_STUDY_CLEANUP_V1__)return;
window.__ANDES_PRESENTATION_STUDY_CLEANUP_V1__=true;
const sessionNumber=()=>{const m=(location.pathname+' '+document.title).match(/sesion[-_\s]*(1[3-6])/i)||document.title.match(/Sesión\s*(1[3-6])/i);return m?Number(m[1]):0};
const title=slide=>slide?.dataset?.title||slide?.querySelector('h1,h2')?.textContent?.trim()||'';
const GUIDE={
  13:{
    'Partición':'Una partición sirve cuando la organización física y el filtro de la consulta permiten descartar segmentos completos. No memorices PARTITION BY aislado: identifica qué patrón de acceso repetido justifica esa decisión.',
    'SQL particionado':'Separa diseño físico de pregunta. PARTITION BY organiza la tabla; WHERE expresa qué datos necesita la consulta. La optimización aparece cuando ambos son compatibles y puedes verificarla con bytes procesados.',
    'Clusterización':'Clustering ordena bloques según columnas de acceso frecuente. El orden no es universal: depende de qué filtros aparecen juntos, con qué frecuencia y qué tan selectivos son.',
    'Bytes procesados':'Filas devueltas y bytes leídos no son lo mismo. Una consulta puede mostrar pocas filas y aun escanear mucho; por eso la evidencia debe incluir bytes y contexto de caché.'
  },
  14:{
    'Relacional vs anidado':'No estás reemplazando normalización por anidamiento. Una misma realidad puede tener una forma operacional y otra analítica porque cada carga necesita operaciones distintas.',
    'ARRAY y STRUCT':'STRUCT agrupa campos con nombre y tipo; ARRAY conserva varios elementos del mismo tipo lógico. BigQuery conoce esa estructura: no es simplemente texto JSON.',
    'UNNEST':'UNNEST cambia el grano. Antes puede haber una fila por pedido; después, una fila por elemento del arreglo. Antes de agregar, completa siempre la frase “una fila = …”.',
    'Reasoning Check':'Dos arreglos independientes pueden multiplicar combinaciones. Si uno tiene 2 elementos y otro 3, expandir ambos sin una relación adicional puede producir 6 filas. El problema es de grano, no de sintaxis.',
    'CSV JSON Parquet':'Elige formato por estructura y patrón de lectura: CSV es plano y simple, JSON expresa jerarquía y Parquet favorece analítica columnar y compresión.'
  }
};
function clean(){
  const n=sessionNumber();if(n<13||n>16)return;
  document.querySelectorAll('.slide').forEach(slide=>{
    const blocks=[...slide.querySelectorAll('.sc-study')];if(!blocks.length)return;
    const text=GUIDE[n]?.[title(slide)]||'';
    blocks.forEach((block,i)=>{
      if(!text||i>0){block.remove();return}
      const summary=block.querySelector('summary');const p=block.querySelector('p');
      if(summary)summary.textContent='📘 Qué debes entender';
      if(p)p.textContent=text;
    });
  });
}
let timer=null;
const schedule=()=>{clearTimeout(timer);timer=setTimeout(clean,10)};
function boot(){clean();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
