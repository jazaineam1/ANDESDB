(()=>{'use strict';
const STORE='andesdb.s15.azure-transfer.v1';
const API_MARK='learning-autograde-s15';
const NEEDS=[
  ['object_files','Guardar JSON, CSV o Parquet como objetos'],
  ['operational_document','Documento operacional distribuido'],
  ['lakehouse_analytics','Lakehouse, ingeniería y analítica'],
  ['bi_consumption','Consumo visual y BI']
];
const SERVICES=[
  ['','Selecciona una familia Azure…'],
  ['blob_adls','Azure Blob Storage / ADLS Gen2'],
  ['cosmos','Azure Cosmos DB'],
  ['fabric_databricks','Microsoft Fabric / Azure Databricks'],
  ['power_bi','Power BI']
];
function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{return{}}}
let state=load();
function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function inject(){
  const boss=document.getElementById('boss');
  if(!boss||document.getElementById('bossAzureTransfer'))return;
  const card=document.createElement('div');
  card.id='bossAzureTransfer';
  card.className='card';
  card.style.margin='0 14px 14px';
  const options=SERVICES.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');
  card.innerHTML=`<h3>Transferencia Azure · necesidad → familia</h3>
    <p class="muted">No traduzcas productos uno a uno. Para cada necesidad del caso nuevo, elige primero la familia que reconocerías en Azure. Esta parte pertenece al Boss y se corrige únicamente en servidor.</p>
    <div class="azure-transfer-grid">${NEEDS.map(([k,l])=>`<label style="display:grid;gap:.35rem;margin:.75rem 0"><b>${esc(l)}</b><select data-azure-need="${esc(k)}" style="width:100%;padding:.72rem;border-radius:.6rem">${options}</select></label>`).join('')}</div>
    <p class="muted">Pista de criterio, no de respuesta: decide por almacenamiento, patrón de acceso y consumo; que un dato llegue como JSON no determina por sí solo el servicio.</p>`;
  boss.appendChild(card);
  for(const sel of card.querySelectorAll('[data-azure-need]')){
    sel.value=state[sel.dataset.azureNeed]||'';
    sel.addEventListener('change',()=>{state[sel.dataset.azureNeed]=sel.value;save()});
  }
}
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  let next=init;
  try{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(url.includes(API_MARK)&&init?.method?.toUpperCase()==='POST'&&typeof init.body==='string'){
      const body=JSON.parse(init.body);
      body.azure_transfer={...state};
      next={...init,body:JSON.stringify(body)};
    }
  }catch{}
  return nativeFetch(input,next);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();