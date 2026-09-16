(() => {
'use strict';

const VERSION='s15-workbench-v3';
const STORE='andesdb.s15.workbench.v3';
const AUTH_STORE='andesdb.lms.auth.v1';
const API='https://gnpouhsvsisqoxketlfr.supabase.co/functions/v1/learning-autograde-s15';
const script=document.currentScript;
const SQLJS_BASE=new URL('../vendor/sqljs/',script.src).href;
const DATA_BASE=new URL('../../Plantillas/proyecto-final/Datos/',script.src).href;

const MODEL_FIELDS=[
  ['caso.caso_id','caso_id'],['caso.fecha_creacion','fecha_creacion'],['caso.tipo','tipo'],
  ['caso.prioridad','prioridad'],['caso.estado','estado'],['caso.barrio','barrio'],
  ['evento.evento_id','evento_id'],['evento.caso_id','caso_id'],['evento.fecha_evento','fecha_evento'],
  ['evento.estado','estado'],['evento.minutos_desde_anterior','minutos_desde_anterior']
];
const FLOW_NODES=[
  ['casos','casos.csv','source'],['eventos','eventos.csv','source'],['evidencias','evidencias.json','source'],
  ['relational','BD relacional operacional','operational'],['document','Store documental / JSON','operational'],
  ['transform','Transformación / ELT','analytics'],['warehouse','Data warehouse','analytics'],['bi','BI / tablero','analytics']
];
const STAR_TOKENS=[
  ['grain:evento','evento = 1 fila del hecho'],['grain:caso','caso = 1 fila del hecho'],
  ['measure:conteo_evento','conteo de eventos'],['measure:minutos','minutos_desde_anterior'],
  ['dimension:fecha','fecha'],['dimension:barrio','barrio'],['dimension:tipo','tipo'],
  ['dimension:prioridad','prioridad'],['dimension:estado','estado'],
  ['decoy:comentario','texto_comentario'],['decoy:url','url_evidencia']
];

const QUERY_DEFS={
 q1:{
   title:'Q1 · Prioridad Alta por barrio',
   points:5,
   prompt:'Devuelve una fila por barrio con la cantidad de casos de prioridad Alta.',
   cols:['barrio','casos_alta'],
   starter:`SELECT barrio, COUNT(*) AS casos_alta
FROM casos_src
WHERE prioridad = 'Media'
GROUP BY barrio;`,
   reference:`SELECT barrio, COUNT(*) AS casos_alta
FROM casos_src
WHERE prioridad = 'Alta'
GROUP BY barrio;`,
   hint:'El error inicial está en el filtro. Después comprueba que agrupas al grano barrio.'
 },
 q2:{
   title:'Q2 · Estado actual vs último evento',
   points:5,
   prompt:'Para cada caso, compara el snapshot actual con el estado del último evento por fecha.',
   cols:['caso_id','estado_actual','ultimo_estado'],
   starter:`SELECT c.caso_id, c.estado AS estado_actual,
       MAX(e.estado) AS ultimo_estado
FROM casos_src c
LEFT JOIN eventos_src e ON e.caso_id = c.caso_id
GROUP BY c.caso_id, c.estado;`,
   reference:`WITH ult AS (
  SELECT caso_id, estado,
         ROW_NUMBER() OVER(
           PARTITION BY caso_id
           ORDER BY fecha_evento DESC, evento_id DESC
         ) AS rn
  FROM eventos_src
)
SELECT c.caso_id,
       c.estado AS estado_actual,
       u.estado AS ultimo_estado
FROM casos_src c
LEFT JOIN ult u
  ON u.caso_id = c.caso_id AND u.rn = 1;`,
   hint:'MAX(estado) compara texto; no sabe cuál fila ocurrió al final. Ordena eventos dentro de cada caso.'
 },
 q3:{
   title:'Q3 · Minutos hasta cierre',
   points:5,
   prompt:'Devuelve los minutos acumulados únicamente para los casos cuyo último evento es Cerrado.',
   cols:['caso_id','minutos_hasta_cierre'],
   starter:`SELECT caso_id,
       SUM(minutos_desde_anterior) AS minutos_hasta_cierre
FROM eventos_src
WHERE estado = 'Cerrado'
GROUP BY caso_id;`,
   reference:`WITH ult AS (
  SELECT caso_id, estado,
         ROW_NUMBER() OVER(
           PARTITION BY caso_id
           ORDER BY fecha_evento DESC, evento_id DESC
         ) AS rn
  FROM eventos_src
), cerrados AS (
  SELECT caso_id
  FROM ult
  WHERE rn = 1 AND estado = 'Cerrado'
)
SELECT e.caso_id,
       SUM(e.minutos_desde_anterior) AS minutos_hasta_cierre
FROM eventos_src e
JOIN cerrados c ON c.caso_id = e.caso_id
GROUP BY e.caso_id;`,
   hint:'No debes sumar solo la fila Cerrado. Primero identifica qué casos terminan Cerrados y luego suma toda su trayectoria.'
 },
 q4:{
   title:'Q4 · Control de grano después del JOIN',
   points:5,
   prompt:'Entrega total_casos, total_eventos y casos_alta sin inflar casos por tener varios eventos.',
   cols:['total_casos','total_eventos','casos_alta'],
   starter:`SELECT COUNT(*) AS total_casos,
       COUNT(*) AS total_eventos,
       SUM(CASE WHEN c.prioridad='Alta' THEN 1 ELSE 0 END) AS casos_alta
FROM casos_src c
LEFT JOIN eventos_src e ON e.caso_id=c.caso_id;`,
   reference:`SELECT COUNT(DISTINCT c.caso_id) AS total_casos,
       COUNT(e.evento_id) AS total_eventos,
       COUNT(DISTINCT CASE WHEN c.prioridad='Alta' THEN c.caso_id END) AS casos_alta
FROM casos_src c
LEFT JOIN eventos_src e ON e.caso_id=c.caso_id;`,
   hint:'Después de un 1:N, COUNT(*) cuenta filas del JOIN. Protege el grano de caso y el grano de evento por separado.'
 },
 q5:{
   title:'Q5 · Tiempo promedio por tipo sin sesgo de actividad',
   points:5,
   prompt:'Una fila por tipo: cantidad de casos y promedio de minutos acumulados por caso. Los casos sin eventos cuentan con 0 minutos.',
   cols:['tipo','casos','promedio_minutos'],
   starter:`SELECT c.tipo,
       COUNT(*) AS casos,
       ROUND(AVG(e.minutos_desde_anterior),1) AS promedio_minutos
FROM casos_src c
LEFT JOIN eventos_src e ON e.caso_id=c.caso_id
GROUP BY c.tipo;`,
   reference:`WITH por_caso AS (
  SELECT c.caso_id,
         c.tipo,
         COALESCE(SUM(e.minutos_desde_anterior),0) AS total_minutos
  FROM casos_src c
  LEFT JOIN eventos_src e ON e.caso_id=c.caso_id
  GROUP BY c.caso_id, c.tipo
)
SELECT tipo,
       COUNT(*) AS casos,
       ROUND(AVG(total_minutos),1) AS promedio_minutos
FROM por_caso
GROUP BY tipo;`,
   hint:'Promedia primero a grano caso. Si promedias filas de eventos, los casos con más eventos pesan más.'
 }
};

const CHECK_META={
 s1:['casos.csv clasificado como snapshot operacional',2],
 s2:['eventos.csv clasificado como historia de cambios',2],
 s3:['evidencias.json clasificado como evidencia flexible',2],
 s4:['caso_id identificado como clave de caso',2],
 s5:['evento_id identificado como clave de evento',2],
 m1:['campos obligatorios de CASO ubicados correctamente',3],
 m2:['campos obligatorios de EVENTO ubicados correctamente',3],
 m3:['caso.caso_id marcado como PK',2],
 m4:['evento.evento_id marcado como PK',2],
 m5:['evento.caso_id enlazado como FK hacia CASO',3],
 m6:['cardinalidad CASO 1:N EVENTO',2],
 f1:['fuentes ubicadas en la capa de fuentes',3],
 f2:['casos y eventos alimentan el store relacional',3],
 f3:['evidencias alimentan un store flexible/documental',3],
 f4:['persistencia relacional y documental llegan a transformación',3],
 f5:['transformación → warehouse → BI sin saltarse la capa analítica',3],
 d1:['PK de caso rechaza duplicados',2.5],
 d2:['PK de evento rechaza duplicados',2.5],
 d3:['FK rechaza evento huérfano',2.5],
 d4:['campos requeridos son NOT NULL',2.5],
 d5:['minutos negativos son rechazados',2.5],
 d6:['un estado nuevo legítimo puede entrar',2.5],
 q1:[QUERY_DEFS.q1.title,5],q2:[QUERY_DEFS.q2.title,5],q3:[QUERY_DEFS.q3.title,5],
 q4:[QUERY_DEFS.q4.title,5],q5:[QUERY_DEFS.q5.title,5],
 st1:['grano analítico = evento',2],
 st2:['medida conteo de eventos',2],
 st3:['medida de minutos',2],
 st4:['dimensiones fecha, barrio, tipo y prioridad',2],
 st5:['estado disponible como dimensión',2],
 x1:['duplicado operacional queda bloqueado',2],
 x2:['evento huérfano queda bloqueado',2],
 x3:['cambio de dominio Escalado es aceptado',2],
 x4:['evidencia nueva puede recorrer el flujo documental hasta analítica',2],
 x5:['las cinco consultas sobreviven a un escenario nuevo',2]
};

let SQL=null,baseData=null,dragPayload=null,selectedFlowNode=null;
let lastReport=null;
let state=freshState();

function freshState(){
  return {
    version:VERSION,
    source:{roles:{},keys:{}},
    model:{entities:{caso:[],evento:[]},pk:{caso:null,evento:null},fk:null,cardinality:null},
    flow:{placements:{},edges:[]},
    ddl:'',
    queries:Object.fromEntries(Object.entries(QUERY_DEFS).map(([k,v])=>[k,v.starter])),
    star:{grain:[],measure:[],dimension:[]},
    hints:{},
    tests:{},
    attempts:[]
  };
}
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function auth(){try{return JSON.parse(localStorage.getItem(AUTH_STORE)||'null')}catch{return null}}
function save(){state.ddl=$('#ddl')?.value??state.ddl;for(const q of Object.keys(QUERY_DEFS))state.queries[q]=$(`#${q}`)?.value??state.queries[q];try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
function restore(){
  try{
    const x=JSON.parse(localStorage.getItem(STORE)||'null');
    if(x?.version===VERSION) state={...freshState(),...x,source:{...freshState().source,...x.source},model:{...freshState().model,...x.model,entities:{...freshState().model.entities,...x.model?.entities},pk:{...freshState().model.pk,...x.model?.pk}},flow:{...freshState().flow,...x.flow},star:{...freshState().star,...x.star}};
  }catch{}
}
function setEngine(msg,kind=''){const el=$('#engineStatus');if(!el)return;el.textContent=msg;el.className=`status ${kind}`}

function parseCSV(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(ch==='"'){if(quoted&&next==='"'){cell+='"';i++}else quoted=!quoted}
    else if(ch===','&&!quoted){row.push(cell);cell=''}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);cell='';if(row.some(v=>v!==''))rows.push(row);row=[]}
    else cell+=ch;
  }
  if(cell||row.length){row.push(cell);if(row.some(v=>v!==''))rows.push(row)}
  const head=rows.shift()||[];
  return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??''])));
}
async function loadData(){
  const [c,e,j]=await Promise.all([
    fetch(`${DATA_BASE}casos.csv`,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('casos.csv');return r.text()}),
    fetch(`${DATA_BASE}eventos.csv`,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('eventos.csv');return r.text()}),
    fetch(`${DATA_BASE}evidencias.json`,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('evidencias.json');return r.json()})
  ]);
  return {casos:parseCSV(c),eventos:parseCSV(e),evidencias:j};
}
function deep(x){return JSON.parse(JSON.stringify(x))}
function variants(base){
  const v0=deep(base);
  const v1=deep(base);
  v1.casos.push({caso_id:'1013',fecha_creacion:'2026-08-11',ciudadano_id:'C013',tipo:'Alumbrado',prioridad:'Alta',estado:'Abierto',canal:'Web',barrio:'Bosa'});
  v1.eventos.push(
    {evento_id:'E025',caso_id:'1013',fecha_evento:'2026-08-11 08:00',estado:'Abierto',agente_id:'A06',minutos_desde_anterior:'0'},
    {evento_id:'E026',caso_id:'1002',fecha_evento:'2026-08-02 12:00',estado:'Abierto',agente_id:'A02',minutos_desde_anterior:'60'}
  );
  const v2=deep(base);
  const c1010=v2.casos.find(c=>c.caso_id==='1010');if(c1010)c1010.estado='Cerrado';
  v2.eventos.push({evento_id:'E027',caso_id:'1010',fecha_evento:'2026-08-09 12:30',estado:'Cerrado',agente_id:'A03',minutos_desde_anterior:'300'});
  const c1003=v2.casos.find(c=>c.caso_id==='1003');if(c1003)c1003.estado='Escalado';
  v2.eventos.push({evento_id:'E028',caso_id:'1003',fecha_evento:'2026-08-03 12:00',estado:'Escalado',agente_id:'A04',minutos_desde_anterior:'230'});
  v2.casos.push({caso_id:'1014',fecha_creacion:'2026-08-12',ciudadano_id:'C014',tipo:'Basuras',prioridad:'Media',estado:'Abierto',canal:'App',barrio:'Fontibon'});
  return [v0,v1,v2];
}
function chaosVariant(base){
  const v=deep(base);
  v.casos.push({caso_id:'1015',fecha_creacion:'2026-08-13',ciudadano_id:'C015',tipo:'Ruido',prioridad:'Alta',estado:'Cerrado',canal:'App',barrio:'Suba'});
  v.eventos.push(
    {evento_id:'E101',caso_id:'1015',fecha_evento:'2026-08-13 08:00',estado:'Abierto',agente_id:'A07',minutos_desde_anterior:'0'},
    {evento_id:'E102',caso_id:'1015',fecha_evento:'2026-08-13 09:00',estado:'En_proceso',agente_id:'A07',minutos_desde_anterior:'60'},
    {evento_id:'E103',caso_id:'1015',fecha_evento:'2026-08-13 12:30',estado:'Cerrado',agente_id:'A07',minutos_desde_anterior:'210'}
  );
  const c=v.casos.find(x=>x.caso_id==='1005');if(c)c.estado='Cerrado';
  v.eventos.push({evento_id:'E104',caso_id:'1005',fecha_evento:'2026-08-04 18:00',estado:'Cerrado',agente_id:'A01',minutos_desde_anterior:'465'});
  return v;
}
function makeSourceDB(data){
  const db=new SQL.Database();
  db.run(`CREATE TABLE casos_src(caso_id INTEGER,fecha_creacion TEXT,ciudadano_id TEXT,tipo TEXT,prioridad TEXT,estado TEXT,canal TEXT,barrio TEXT);
          CREATE TABLE eventos_src(evento_id TEXT,caso_id INTEGER,fecha_evento TEXT,estado TEXT,agente_id TEXT,minutos_desde_anterior INTEGER);`);
  const cs=db.prepare('INSERT INTO casos_src VALUES(?,?,?,?,?,?,?,?)');
  for(const r of data.casos)cs.run([+r.caso_id,r.fecha_creacion,r.ciudadano_id||null,r.tipo,r.prioridad,r.estado,r.canal||null,r.barrio]);cs.free();
  const es=db.prepare('INSERT INTO eventos_src VALUES(?,?,?,?,?,?)');
  for(const r of data.eventos)es.run([r.evento_id,+r.caso_id,r.fecha_evento,r.estado,r.agente_id||null,+r.minutos_desde_anterior]);es.free();
  return db;
}

function previewDataset(name){
  $$('#dataTabs button').forEach(b=>b.classList.toggle('active',b.dataset.dataset===name));
  const p=$('#profileStrip'),t=$('#dataPreview');if(!p||!t||!baseData)return;
  if(name==='evidencias'){
    const docs=baseData.evidencias,items=docs.flatMap(d=>d.evidencias||[]),types=[...new Set(items.map(x=>x.tipo))];
    p.innerHTML=metrics([['documentos',docs.length],['evidencias',items.length],['tipos',types.length],['máx./caso',Math.max(0,...docs.map(d=>(d.evidencias||[]).length))]]);
    t.innerHTML=`<table class="preview-table"><thead><tr><th>caso_id</th><th>evidencias</th><th>tipos</th></tr></thead><tbody>${docs.map(d=>`<tr><td>${esc(d.caso_id)}</td><td>${(d.evidencias||[]).length}</td><td>${esc((d.evidencias||[]).map(x=>x.tipo).join(', '))}</td></tr>`).join('')}</tbody></table>`;
    return;
  }
  const rows=baseData[name],cols=Object.keys(rows[0]||{}),id=name==='casos'?'caso_id':'evento_id',unique=new Set(rows.map(r=>r[id])).size;
  const nulls=rows.reduce((n,r)=>n+cols.filter(c=>r[c]===''||r[c]==null).length,0);
  p.innerHTML=metrics([['filas',rows.length],['columnas',cols.length],['IDs únicos',unique],['vacíos',nulls]]);
  t.innerHTML=tableHTML(cols,rows.slice(0,12).map(r=>cols.map(c=>r[c])));
}
function metrics(xs){return xs.map(([k,v])=>`<div class="metric"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('')}
function tableHTML(cols,rows){
  return `<table class="preview-table"><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v==null?'<i>NULL</i>':esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderSource(){
  const palette=$('#sourcePalette');if(!palette)return;
  const sourceEls={};
  ['casos','eventos','evidencias'].forEach(id=>{
    let el=document.querySelector(`.drag-card[data-kind="source"][data-id="${id}"]`);
    if(!el){el=document.createElement('div');el.className='drag-card';el.draggable=true;el.dataset.kind='source';el.dataset.id=id;el.textContent=id==='evidencias'?'evidencias.json':`${id}.csv`}
    sourceEls[id]=el;
  });
  Object.values(sourceEls).forEach(el=>palette.appendChild(el));
  $$('.role-zone').forEach(z=>{const keep=[...z.children].filter(x=>x.tagName==='B'||x.tagName==='SPAN');z.innerHTML='';keep.forEach(x=>z.appendChild(x))});
  for(const [role,id] of Object.entries(state.source.roles||{})){const z=document.querySelector(`.role-zone[data-role="${role}"]`);if(z&&sourceEls[id])z.appendChild(sourceEls[id])}
  const kp=document.querySelector('.key-palette');
  const keyIds=['caso_id','evento_id','barrio','estado'],keyEls={};
  keyIds.forEach(id=>{let el=document.querySelector(`.drag-card[data-kind="key"][data-id="${id}"]`);if(!el){el=document.createElement('button');el.className='chip drag-card'+(['barrio','estado'].includes(id)?' decoy':'');el.draggable=true;el.dataset.kind='key';el.dataset.id=id;el.textContent=id}keyEls[id]=el;kp?.appendChild(el)});
  $$('.key-zone').forEach(z=>{const label=z.dataset.keyslot==='casos'?['Clave de caso','identifica cada caso']:['Clave de evento','identifica cada evento'];z.innerHTML=`<b>${label[0]}</b><span>${label[1]}</span>`});
  for(const [slot,id] of Object.entries(state.source.keys||{})){const z=document.querySelector(`.key-zone[data-keyslot="${slot}"]`);if(z&&keyEls[id])z.appendChild(keyEls[id])}
}
function renderModel(){
  const palette=$('#modelPalette');if(!palette)return;palette.innerHTML='';
  const placed=new Set([...(state.model.entities.caso||[]),...(state.model.entities.evento||[])]);
  for(const [id,label] of MODEL_FIELDS){
    if(!placed.has(id)){const b=document.createElement('button');b.className='chip drag-card';b.draggable=true;b.dataset.kind='model';b.dataset.id=id;b.textContent=id.replace('.', ' · ');palette.appendChild(b)}
  }
  $$('.entity-fields').forEach(z=>{z.innerHTML='';const ent=z.dataset.entity;for(const id of state.model.entities[ent]||[]){const f=document.createElement('div');f.className='model-field drag-card'+(state.model.pk[ent]===id?' pk':'');f.draggable=true;f.dataset.kind='model';f.dataset.id=id;f.dataset.entity=ent;const label=MODEL_FIELDS.find(x=>x[0]===id)?.[1]||id;f.innerHTML=`<span>${esc(label)}</span>${state.model.pk[ent]===id?'<span class="badge pk">PK</span>':''}`;z.appendChild(f)}})
  const fkz=$('.fk-zone');if(fkz){fkz.innerHTML='<b>FK</b><span>arrastra aquí <code>evento.caso_id</code> desde EVENTO</span>';if(state.model.fk){const c=document.createElement('div');c.className='star-item';c.innerHTML='<span>evento.caso_id</span><span class="badge fk">FK → caso.caso_id</span>';fkz.appendChild(c)}}
  $('#cardinalityLabel').textContent=state.model.cardinality||'sin definir';
}
function renderFlow(){
  const palette=$('#flowPalette');if(!palette)return;palette.innerHTML='';
  $$('.flow-lane .lane-body').forEach(b=>b.innerHTML='');
  for(const [id,label] of FLOW_NODES){
    const el=document.createElement('button');el.className='flow-node'+(selectedFlowNode===id?' selected':'');el.draggable=true;el.dataset.kind='flow';el.dataset.id=id;el.textContent=label;
    const lane=state.flow.placements[id];const dest=lane?document.querySelector(`.flow-lane[data-lane="${lane}"] .lane-body`):palette;(dest||palette).appendChild(el);
  }
  const list=$('#edgeList');if(list)list.innerHTML=(state.flow.edges||[]).map((e,i)=>`<button class="edge-chip" data-edge="${i}">${esc(labelNode(e[0]))} → ${esc(labelNode(e[1]))} ×</button>`).join('')||'<span class="small">Aún no hay conexiones.</span>';
}
function labelNode(id){return FLOW_NODES.find(x=>x[0]===id)?.[1]||id}
function renderStar(){
  const palette=$('#starPalette');if(!palette)return;palette.innerHTML='';
  $$('.star-zone').forEach(z=>{const title=z.dataset.star==='grain'?['Grano del hecho','una ficha']:z.dataset.star==='measure'?['Medidas','arrastra medidas aditivas o contables']:['Dimensiones','atributos para cortar el análisis'];z.innerHTML=`<b>${title[0]}</b><span>${title[1]}</span>`});
  const used=new Set([...(state.star.grain||[]),...(state.star.measure||[]),...(state.star.dimension||[])]);
  for(const [id,label] of STAR_TOKENS){
    const el=document.createElement('button');el.className='chip drag-card';el.draggable=true;el.dataset.kind='star';el.dataset.id=id;el.textContent=label;
    if(used.has(id)){const bucket=Object.keys(state.star).find(k=>(state.star[k]||[]).includes(id));document.querySelector(`.star-zone[data-star="${bucket}"]`)?.appendChild(el)}else palette.appendChild(el)
  }
}
function renderSQLTasks(){
  const box=$('#sqlTasks');if(!box)return;box.innerHTML='';
  for(const [id,d] of Object.entries(QUERY_DEFS)){
    const sec=document.createElement('section');sec.className='sql-task';sec.innerHTML=`
      <header><div><h3>${esc(d.title)}</h3><p>${esc(d.prompt)} <b>Salida:</b> ${d.cols.map(esc).join(', ')}</p></div><span class="points">${d.points} pts</span></header>
      <div class="sql-task-body"><textarea class="code" id="${id}" spellcheck="false"></textarea><div class="query-result" id="result-${id}"><div class="empty">Ejecuta para ver el resultado base.</div></div></div>
      <div class="task-foot"><button class="primary" data-run-query="${id}" type="button">Probar</button><button class="secondary" data-reset-query="${id}" type="button">Restaurar bug</button><button class="secondary" data-hint="${id}" type="button">Pista</button><span class="task-status" id="status-${id}">sin ejecutar</span></div>`;
    box.appendChild(sec);$(`#${id}`).value=state.queries[id]??d.starter;
  }
}
function renderChaosCards(){
  const defs=[
    ['x1','Duplicado','Intenta repetir un caso ya existente.'],['x2','Huérfano','Lanza un evento para un caso inexistente.'],
    ['x3','Dominio cambia','Aparece el estado Escalado.'],['x4','Nueva evidencia','Llega evidencia tipo sensor con atributos nuevos.'],
    ['x5','Datos cambian','Todas tus consultas se repiten sobre un escenario nuevo.']
  ];
  $('#chaosGrid').innerHTML=defs.map(([id,t,p])=>`<article class="chaos-card" id="chaos-${id}"><h3>${esc(t)}</h3><p>${esc(p)}</p><div class="state">No ejecutado</div></article>`).join('');
}
function renderAll(){
  renderSource();renderModel();renderFlow();renderStar();renderSQLTasks();renderChaosCards();
  $('#ddl').value=state.ddl||'';
  updateScores(false);
  renderAttempts();
}
function updateAuth(){
  const a=auth(),el=$('#lmsStatus');if(!el)return;
  if(a?.token){el.className='lms mini ok';el.innerHTML='<b>LMS conectado.</b> El intento final se guardará automáticamente.'}
  else{el.className='lms mini warn';el.innerHTML='<b>Modo local.</b> Puedes completar todo; inicia sesión en <a href="/ANDESDB/revision/" style="color:inherit">ANDESDB</a> antes del envío si quieres registrar la nota.'}
}

function getCheck(id,pass,detail=''){const [label,points]=CHECK_META[id]||[id,0];return {id,label,points,pass:!!pass,detail}}
function evaluateSource(){
  const r=state.source.roles||{},k=state.source.keys||{};
  const checks=[
    getCheck('s1',r.snapshot==='casos'),getCheck('s2',r.history==='eventos'),getCheck('s3',r.document==='evidencias'),
    getCheck('s4',k.casos==='caso_id'),getCheck('s5',k.eventos==='evento_id')
  ];return summarize('source',checks,10);
}
function hasAll(arr,req){const s=new Set(arr||[]);return req.every(x=>s.has(x))}
function evaluateModel(){
  const c=['caso.caso_id','caso.fecha_creacion','caso.tipo','caso.prioridad','caso.estado','caso.barrio'];
  const e=['evento.evento_id','evento.caso_id','evento.fecha_evento','evento.estado','evento.minutos_desde_anterior'];
  const checks=[
    getCheck('m1',hasAll(state.model.entities.caso,c)),
    getCheck('m2',hasAll(state.model.entities.evento,e)),
    getCheck('m3',state.model.pk.caso==='caso.caso_id'),
    getCheck('m4',state.model.pk.evento==='evento.evento_id'),
    getCheck('m5',state.model.fk==='evento.caso_id->caso.caso_id'),
    getCheck('m6',state.model.cardinality==='1:N')
  ];return summarize('model',checks,15);
}
function edge(a,b){return (state.flow.edges||[]).some(e=>e[0]===a&&e[1]===b)}
function evaluateFlow(){
  const p=state.flow.placements||{};
  const checks=[
    getCheck('f1',['casos','eventos','evidencias'].every(n=>p[n]==='source')),
    getCheck('f2',p.relational==='operational'&&edge('casos','relational')&&edge('eventos','relational')),
    getCheck('f3',p.document==='operational'&&edge('evidencias','document')),
    getCheck('f4',p.transform==='analytics'&&edge('relational','transform')&&edge('document','transform')),
    getCheck('f5',p.warehouse==='analytics'&&p.bi==='analytics'&&edge('transform','warehouse')&&edge('warehouse','bi')&&!edge('casos','bi')&&!edge('eventos','bi')&&!edge('evidencias','bi'))
  ];return summarize('flow',checks,15);
}
function evaluateStar(){
  const g=state.star.grain||[],m=state.star.measure||[],d=state.star.dimension||[];
  const checks=[
    getCheck('st1',g.includes('grain:evento')&&!g.includes('grain:caso')),
    getCheck('st2',m.includes('measure:conteo_evento')),
    getCheck('st3',m.includes('measure:minutos')),
    getCheck('st4',['dimension:fecha','dimension:barrio','dimension:tipo','dimension:prioridad'].every(x=>d.includes(x))),
    getCheck('st5',d.includes('dimension:estado'))
  ];return summarize('star',checks,10);
}
function summarize(key,checks,max){return {key,checks,max,score:round(checks.reduce((n,c)=>n+(c.pass?c.points:0),0)),passed:checks.filter(c=>c.pass).length,total:checks.length}}
function round(n){return Math.round(n*100)/100}

async function runDDLTests(render=true){
  state.ddl=$('#ddl')?.value||state.ddl;save();
  const ids=['d1','d2','d3','d4','d5','d6'],out=Object.fromEntries(ids.map(id=>[id,false])),detail={};
  if(!SQL||!state.ddl.trim()){ids.forEach(id=>detail[id]='Falta un DDL ejecutable.');return finalizeDDL(out,detail,render)}
  let db;
  try{
    db=new SQL.Database();db.run('PRAGMA foreign_keys=ON;');db.run(state.ddl);
    const tables=db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('caso','evento')")[0]?.values.flat()||[];
    if(!tables.includes('caso')||!tables.includes('evento'))throw Error('Deben existir las tablas caso y evento.');
    const ci=pragmaRows(db,'PRAGMA table_info(caso)'),ei=pragmaRows(db,'PRAGMA table_info(evento)');
    out.d1=ci.some(r=>r.name==='caso_id'&&Number(r.pk)>0);
    out.d2=ei.some(r=>r.name==='evento_id'&&Number(r.pk)>0);
    const fk=pragmaRows(db,'PRAGMA foreign_key_list(evento)');
    out.d3=fk.some(r=>r.table==='caso'&&r.from==='caso_id'&&r.to==='caso_id');
    const reqC=['caso_id','fecha_creacion','tipo','prioridad','estado','barrio'],reqE=['evento_id','caso_id','fecha_evento','estado','minutos_desde_anterior'];
    out.d4=reqC.every(c=>{const r=ci.find(x=>x.name===c);return r&&(Number(r.notnull)===1||Number(r.pk)>0)})&&reqE.every(c=>{const r=ei.find(x=>x.name===c);return r&&(Number(r.notnull)===1||Number(r.pk)>0)});
    try{
      db.run("INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9001,'2026-09-01','Alumbrado','Alta','Abierto','Prueba')");
      db.run("INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('T001',9001,'2026-09-01 10:00','Abierto',0)");
    }catch(e){detail.setup=`El esquema no permite insertar el caso/evento mínimo válido: ${e.message||e}`}
    if(!detail.setup){
      out.d1=out.d1&&fails(()=>db.run("INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9001,'2026-09-01','Alumbrado','Alta','Abierto','Prueba')"));
      out.d2=out.d2&&fails(()=>db.run("INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('T001',9001,'2026-09-01 10:05','Abierto',5)"));
      out.d3=out.d3&&fails(()=>db.run("INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('ORPH',999999,'2026-09-01 11:00','Abierto',0)"));
      out.d5=fails(()=>db.run("INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('NEG1',9001,'2026-09-01 12:00','Abierto',-1)"));
      try{
        db.run("INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9003,'2026-09-01','Semaforo','Alta','Escalado','Prueba')");
        db.run("INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('EVOL1',9003,'2026-09-01 13:00','Escalado',10)");
        out.d6=true;
      }catch(e){detail.d6=`Tu esquema rechazó una evolución no prohibida por el contrato: ${e.message||e}`}
    }
  }catch(e){ids.forEach(id=>detail[id]=`DDL no ejecutable: ${e.message||e}`)}
  finally{try{db?.close()}catch{}}
  for(const id of ids)state.tests[id]=!!out[id];
  save();return finalizeDDL(out,detail,render);
}
function pragmaRows(db,sql){const r=db.exec(sql)[0];if(!r)return[];return r.values.map(v=>Object.fromEntries(r.columns.map((c,i)=>[c,v[i]])))}
function fails(fn){try{fn();return false}catch{return true}}
function finalizeDDL(out,detail,render){
  const checks=Object.keys(out).map(id=>getCheck(id,out[id],detail[id]||detail.setup||''));
  const res=summarize('ddl',checks,15);
  if(render){renderTestConsole(res);renderFeedback('ddl',res);updateScores()}
  return res;
}
function renderTestConsole(res){
  const box=$('#ddlTests');if(!box)return;
  box.innerHTML=res.checks.map(c=>`<div class="test-row ${c.pass?'ok':'fail'}"><i>${c.pass?'✓':'×'}</i><div><b>${esc(c.label)}</b><span>${c.detail?esc(c.detail):c.pass?'Prueba superada.':'Revisa la restricción.'}</span></div><strong>${c.points}</strong></div>`).join('');
}

function readonly(sql){
  const s=sql.replace(/--.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'').trim();
  return /^(SELECT|WITH)\b/i.test(s)&&!/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|VACUUM|PRAGMA|REINDEX)\b/i.test(s);
}
function normalizeResult(r){
  if(!r)return {cols:[],rows:[]};
  const cols=r.columns.map(c=>String(c).toLowerCase());
  const rows=r.values.map(row=>row.map(v=>typeof v==='number'?Math.round(v*1e6)/1e6:v));
  rows.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return {cols,rows};
}
function execOne(db,sql){
  const rs=db.exec(sql);if(!rs.length)return null;return rs[rs.length-1];
}
function compareResult(got,exp,cols){
  const g=normalizeResult(got),e=normalizeResult(exp);
  if(JSON.stringify(g.cols)!==JSON.stringify(cols.map(x=>x.toLowerCase())))return {ok:false,why:`Columnas esperadas: ${cols.join(', ')}.`};
  if(JSON.stringify(g.rows)!==JSON.stringify(e.rows))return {ok:false,why:'El resultado no coincide con la referencia para este escenario.'};
  return {ok:true};
}
async function runQuery(id,render=true,allVariants=true){
  state.queries[id]=$(`#${id}`)?.value||state.queries[id];save();
  const def=QUERY_DEFS[id],sql=state.queries[id];
  if(!readonly(sql)){state.tests[id]=false;const r={key:id,checks:[getCheck(id,false,'Solo se permite una consulta SELECT/WITH.')],max:5,score:0,passed:0,total:1};if(render)renderQueryStatus(id,r,'Solo SELECT/WITH.');return r}
  const scenarios=allVariants?variants(baseData):[baseData];
  let ok=true,why='',baseResult=null;
  for(let i=0;i<scenarios.length;i++){
    const db=makeSourceDB(scenarios[i]);
    try{
      const got=execOne(db,sql),exp=execOne(db,def.reference);
      if(i===0)baseResult=got;
      const cmp=compareResult(got,exp,def.cols);
      if(!cmp.ok){ok=false;why=i===0?cmp.why:`Pasa los datos base pero falla la variación ${i}: revisa grano, orden temporal o hardcoding.`;break}
    }catch(e){ok=false;why=String(e.message||e);break}
    finally{db.close()}
  }
  state.tests[id]=ok;save();
  const check=getCheck(id,ok,why),r=summarize(id,[check],5);
  if(render){renderQueryResult(id,baseResult);renderQueryStatus(id,r,why);updateScores()}
  return r;
}
async function runQueries(render=true){
  const checks=[];
  for(const id of Object.keys(QUERY_DEFS)){const r=await runQuery(id,render,false);
    const full=await runQuery(id,false,true);checks.push(full.checks[0]);if(render)renderQueryStatus(id,full,full.checks[0].detail)
  }
  const res=summarize('sql',checks,25);if(render){renderFeedback('sql',res);updateScores()}return res;
}
function renderQueryResult(id,r){
  const box=$(`#result-${id}`);if(!box)return;
  if(!r){box.innerHTML='<div class="empty">La consulta no devolvió un result set.</div>';return}
  box.innerHTML=tableHTML(r.columns,r.values.slice(0,80));
}
function renderQueryStatus(id,r,why=''){
  const el=$(`#status-${id}`);if(!el)return;const ok=r.score===5;el.className=`task-status ${ok?'ok':'bad'}`;el.textContent=ok?'✓ pasa datos base + variaciones':`× ${why||'revisa la consulta'}`;
}

async function runChaos(render=true){
  const out={x1:false,x2:false,x3:false,x4:false,x5:false},detail={};
  state.ddl=$('#ddl')?.value||state.ddl;for(const q of Object.keys(QUERY_DEFS))state.queries[q]=$(`#${q}`)?.value||state.queries[q];save();
  let db;
  try{
    db=new SQL.Database();db.run('PRAGMA foreign_keys=ON;');db.run(state.ddl);
    db.run("INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9901,'2026-09-15','Hueco','Alta','Abierto','Chaos')");
    db.run("INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('CX1',9901,'2026-09-15 08:00','Abierto',0)");
    out.x1=fails(()=>db.run("INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9901,'2026-09-15','Hueco','Alta','Abierto','Chaos')"));
    out.x2=fails(()=>db.run("INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('CX2',999999,'2026-09-15 08:10','Abierto',0)"));
    try{
      db.run("INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio) VALUES(9902,'2026-09-15','Ruido','Media','Escalado','Chaos')");
      db.run("INSERT INTO evento(evento_id,caso_id,fecha_evento,estado,minutos_desde_anterior) VALUES('CX3',9902,'2026-09-15 09:00','Escalado',15)");
      out.x3=true;
    }catch(e){detail.x3=String(e.message||e)}
  }catch(e){detail.x1=detail.x2=detail.x3=`DDL: ${e.message||e}`}
  finally{try{db?.close()}catch{}}
  out.x4=edge('evidencias','document')&&edge('document','transform')&&edge('transform','warehouse')&&state.flow.placements.document==='operational';
  if(!out.x4)detail.x4='La evidencia nueva no tiene un camino documental hasta la capa analítica.';
  out.x5=true;
  const cv=chaosVariant(baseData);
  for(const [id,def] of Object.entries(QUERY_DEFS)){
    const sql=state.queries[id]||'';
    if(!readonly(sql)){out.x5=false;detail.x5=`${id} no es una consulta de solo lectura.`;break}
    const sdb=makeSourceDB(cv);
    try{
      const cmp=compareResult(execOne(sdb,sql),execOne(sdb,def.reference),def.cols);
      if(!cmp.ok){out.x5=false;detail.x5=`${id} falla cuando cambia el escenario.`;break}
    }catch(e){out.x5=false;detail.x5=`${id}: ${e.message||e}`;break}
    finally{sdb.close()}
  }
  for(const id of Object.keys(out))state.tests[id]=out[id];save();
  const checks=Object.keys(out).map(id=>getCheck(id,out[id],detail[id]||'')),res=summarize('chaos',checks,10);
  if(render){for(const c of checks){const card=$(`#chaos-${c.id}`);if(card){card.className=`chaos-card ${c.pass?'ok':'fail'}`;card.querySelector('.state').textContent=c.pass?'✓ superado':`× ${c.detail||'no superado'}`}}renderFeedback('chaos',res);updateScores()}
  return res;
}

function renderFeedback(key,res){
  const el=$(`#fb-${key}`);if(!el)return;
  const failed=res.checks.filter(c=>!c.pass),passed=res.checks.length-failed.length;
  el.className=`feedback ${failed.length?'warn':'good'}`;
  el.innerHTML=`<b>${res.score}/${res.max} · ${passed}/${res.checks.length} checkpoints</b>${failed.length?`<ul>${failed.map(c=>`<li>${esc(c.label)}${c.detail?`: ${esc(c.detail)}`:''}</li>`).join('')}</ul>`:' · estación completa.'}`;
}
function evaluateStatic(render=true){
  const results=[evaluateSource(),evaluateModel(),evaluateFlow(),evaluateStar()];
  if(render)for(const r of results)renderFeedback(r.key,r);
  return results;
}
function storedDynamicResult(key,ids,max){
  const checks=ids.map(id=>getCheck(id,state.tests[id]===true));return summarize(key,checks,max);
}
function currentResults(){
  return [
    evaluateSource(),evaluateModel(),evaluateFlow(),
    storedDynamicResult('ddl',['d1','d2','d3','d4','d5','d6'],15),
    storedDynamicResult('sql',['q1','q2','q3','q4','q5'],25),
    evaluateStar(),
    storedDynamicResult('chaos',['x1','x2','x3','x4','x5'],10)
  ];
}
function updateScores(renderStatic=true){
  if(renderStatic)evaluateStatic(true);
  const results=currentResults(),total=round(results.reduce((n,r)=>n+r.score,0));
  for(const r of results){const el=$(`#score-${r.key}`);if(el)el.textContent=r.score}
  $('#livePoints').textContent=total;$('#finalScore').textContent=total;
  const checks=results.flatMap(r=>r.checks),passed=checks.filter(c=>c.pass).length;
  $('#checkpointCount').textContent=`${passed}/${checks.length} checkpoints`;
  for(const r of results){const a=document.querySelector(`.mission-nav a[data-mission="${r.key}"]`);if(a)a.classList.toggle('done',r.score===r.max),a.classList.toggle('partial',r.score>0&&r.score<r.max)}
  $('#scoreGrid').innerHTML=results.map(r=>`<article><b>${r.score}/${r.max}</b><span>${labelMission(r.key)}</span></article>`).join('');
  return {total,results,checks};
}
function labelMission(k){return ({source:'Inspector',model:'Modelo ER',flow:'Flujo',ddl:'DDL',sql:'SQL',star:'Estrella',chaos:'Chaos'})[k]||k}

function generateDDLFromModel(){
  const c=state.model.entities.caso||[],e=state.model.entities.evento||[];
  const typeOf=id=>{
    const name=id.split('.')[1];return ['caso_id','minutos_desde_anterior'].includes(name)?'INTEGER':'TEXT'
  };
  const linesC=c.map(id=>{const name=id.split('.')[1];const pk=state.model.pk.caso===id?' PRIMARY KEY':'';return `  ${name} ${typeOf(id)}${pk}`});
  const linesE=e.map(id=>{const name=id.split('.')[1];const pk=state.model.pk.evento===id?' PRIMARY KEY':'';return `  ${name} ${typeOf(id)}${pk}`});
  if(!linesC.length||!linesE.length){renderFeedback('model',{score:0,max:15,checks:[getCheck('m1',false,'Construye las dos entidades antes de generar.') ]});return}
  let ddl=`CREATE TABLE caso(\n${linesC.join(',\n')}\n);\n\nCREATE TABLE evento(\n${linesE.join(',\n')}`;
  if(state.model.fk==='evento.caso_id->caso.caso_id')ddl+=`,\n  FOREIGN KEY(caso_id) REFERENCES caso(caso_id)`;
  ddl+=`\n);`;
  state.ddl=ddl;$('#ddl').value=ddl;save();location.hash='m4';
}
function loadDDLStarter(){
  const ddl=`CREATE TABLE caso(
  caso_id INTEGER PRIMARY KEY,
  fecha_creacion TEXT NOT NULL,
  tipo TEXT NOT NULL,
  prioridad TEXT NOT NULL,
  estado TEXT NOT NULL,
  barrio TEXT NOT NULL
);

CREATE TABLE evento(
  evento_id TEXT PRIMARY KEY,
  caso_id INTEGER NOT NULL,
  fecha_evento TEXT NOT NULL,
  estado TEXT NOT NULL,
  minutos_desde_anterior INTEGER NOT NULL,
  FOREIGN KEY(caso_id) REFERENCES caso(caso_id)
);`;
  state.ddl=ddl;$('#ddl').value=ddl;save();
}

function renderAttempts(){
  const el=$('#attemptHistory');if(!el)return;const arr=state.attempts||[];
  if(!arr.length){el.textContent='No hay intentos registrados en este navegador.';return}
  el.innerHTML='<b>Historial local:</b> '+arr.slice(-5).reverse().map(a=>`#${esc(a.attempt||'local')} · ${esc(a.score)}/100 · ${new Date(a.at).toLocaleString('es-CO')}${a.saved?' · LMS':' · local'}`).join('  |  ');
}
function buildEvidence(summary){
  return {
    version:VERSION,
    source:state.source,
    model:state.model,
    flow:state.flow,
    star:state.star,
    tests:state.tests,
    code:{ddl:state.ddl,...state.queries},
    hints:state.hints,
    local_score:summary.total,
    client_at:new Date().toISOString()
  };
}
async function finalEvaluate(){
  setEngine('Ejecutando las siete estaciones y las mutaciones finales…','work');
  for(const q of Object.keys(QUERY_DEFS))state.queries[q]=$(`#${q}`)?.value||state.queries[q];
  state.ddl=$('#ddl')?.value||state.ddl;save();
  evaluateStatic(true);
  await runDDLTests(true);
  await runQueries(true);
  await runChaos(true);
  const summary=updateScores();
  const payload=buildEvidence(summary);
  lastReport={...payload,score:summary.total};
  let title='Resultado local',feedback=feedbackText(summary);
  const a=auth();
  if(a?.token){
    try{
      const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${a.token}`},body:JSON.stringify(payload)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw Error(data.error||`HTTP ${res.status}`);
      title=`Intento #${data.attempt} registrado`;
      feedback=data.feedback||feedback;
      state.attempts.push({attempt:data.attempt,score:data.score,saved:true,at:new Date().toISOString()});
      setEngine(`${title}: ${data.score}/100.`,'ok');
      if(Number(data.score)!==Number(summary.total))setEngine(`El servidor recalculó ${data.score}/100 (cliente ${summary.total}/100).`,'warn');
      $('#finalScore').textContent=data.score;
    }catch(e){
      state.attempts.push({attempt:'local',score:summary.total,saved:false,at:new Date().toISOString()});
      setEngine(`Evaluación local terminada, pero no se pudo registrar en LMS: ${e.message||e}`,'warn');
    }
  }else{
    state.attempts.push({attempt:'local',score:summary.total,saved:false,at:new Date().toISOString()});
    setEngine('Evaluación terminada localmente. Inicia sesión para registrar la nota.','warn');
  }
  save();renderAttempts();$('#finalFeedback').textContent=`${title}\n\n${feedback}`;$('#final').scrollIntoView({behavior:'smooth',block:'start'});
}
function feedbackText(summary){
  const failed=summary.checks.filter(c=>!c.pass);
  const lines=[`Resultado verificado localmente: ${summary.total}/100.`,`Checkpoints: ${summary.checks.filter(c=>c.pass).length}/${summary.checks.length}.`];
  if(failed.length){lines.push('Prioridades de corrección:');for(const c of failed.slice(0,12))lines.push(`- ${c.label}${c.detail?`: ${c.detail}`:''}`)}
  else lines.push('Todas las estaciones y el Chaos Lab pasaron.');
  lines.push('Puedes corregir cualquier estación y volver a ejecutar el intento final.');
  return lines.join('\n');
}
function downloadEvidence(){
  const summary=updateScores(false),obj=lastReport||{...buildEvidence(summary),score:summary.total};
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ANDESDB-S15-evidencia-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

function handleDrop(zone,payload){
  if(!payload)return;
  const {kind,id}=payload;
  if(zone.classList.contains('role-zone')&&kind==='source'){
    for(const [r,v] of Object.entries(state.source.roles))if(v===id)delete state.source.roles[r];
    state.source.roles[zone.dataset.role]=id;renderSource();
  }else if(zone.classList.contains('key-zone')&&kind==='key'){
    for(const [k,v] of Object.entries(state.source.keys))if(v===id)delete state.source.keys[k];
    state.source.keys[zone.dataset.keyslot]=id;renderSource();
  }else if(zone.classList.contains('entity-fields')&&kind==='model'){
    const ent=zone.dataset.entity;
    for(const e of ['caso','evento'])state.model.entities[e]=state.model.entities[e].filter(x=>x!==id);
    state.model.entities[ent].push(id);renderModel();
  }else if(zone.classList.contains('fk-zone')&&kind==='model'){
    if(id==='evento.caso_id'&&(state.model.entities.evento||[]).includes(id))state.model.fk='evento.caso_id->caso.caso_id';
    renderModel();
  }else if(zone.classList.contains('flow-lane')&&kind==='flow'){
    state.flow.placements[id]=zone.dataset.lane;renderFlow();
  }else if(zone.classList.contains('star-zone')&&kind==='star'){
    for(const k of ['grain','measure','dimension'])state.star[k]=state.star[k].filter(x=>x!==id);
    state.star[zone.dataset.star].push(id);renderStar();
  }
  save();updateScores();
}
function removeModelField(id){
  for(const ent of ['caso','evento']){if(state.model.pk[ent]===id)state.model.pk[ent]=null;state.model.entities[ent]=state.model.entities[ent].filter(x=>x!==id)}
  if(id==='evento.caso_id')state.model.fk=null;renderModel();save();updateScores();
}
function cycleCardinality(){const vals=[null,'1:N','1:1','N:M'];state.model.cardinality=vals[(vals.indexOf(state.model.cardinality)+1)%vals.length];renderModel();save();updateScores()}

function bindEvents(){
  document.addEventListener('dragstart',e=>{
    const el=e.target.closest('[draggable="true"][data-kind]');if(!el)return;
    dragPayload={kind:el.dataset.kind,id:el.dataset.id};el.classList.add('dragging');e.dataTransfer?.setData('text/plain',JSON.stringify(dragPayload));if(e.dataTransfer)e.dataTransfer.effectAllowed='move';
  });
  document.addEventListener('dragend',e=>{e.target.closest('[draggable="true"]')?.classList.remove('dragging');dragPayload=null;$$('.dropzone.over').forEach(z=>z.classList.remove('over'))});
  document.addEventListener('dragover',e=>{const z=e.target.closest('.dropzone');if(!z)return;e.preventDefault();z.classList.add('over')});
  document.addEventListener('dragleave',e=>{const z=e.target.closest('.dropzone');if(z&&!z.contains(e.relatedTarget))z.classList.remove('over')});
  document.addEventListener('drop',e=>{const z=e.target.closest('.dropzone');if(!z)return;e.preventDefault();z.classList.remove('over');let p=dragPayload;try{p=p||JSON.parse(e.dataTransfer.getData('text/plain'))}catch{}handleDrop(z,p)});
  document.addEventListener('click',async e=>{
    const tab=e.target.closest('[data-dataset]');if(tab&&tab.closest('#dataTabs')){previewDataset(tab.dataset.dataset);return}
    const mf=e.target.closest('.model-field');if(mf){const ent=mf.dataset.entity,id=mf.dataset.id;state.model.pk[ent]=state.model.pk[ent]===id?null:id;renderModel();save();updateScores();return}
    const fn=e.target.closest('.flow-node');if(fn){
      const id=fn.dataset.id;if(!selectedFlowNode){selectedFlowNode=id}else if(selectedFlowNode===id){selectedFlowNode=null}else{if(!edge(selectedFlowNode,id))state.flow.edges.push([selectedFlowNode,id]);selectedFlowNode=null}renderFlow();save();updateScores();return
    }
    const edgeBtn=e.target.closest('[data-edge]');if(edgeBtn){state.flow.edges.splice(+edgeBtn.dataset.edge,1);renderFlow();save();updateScores();return}
    const checker=e.target.closest('[data-check]');if(checker){const k=checker.dataset.check;const r=k==='source'?evaluateSource():k==='model'?evaluateModel():k==='flow'?evaluateFlow():evaluateStar();renderFeedback(k,r);updateScores();return}
    const run=e.target.closest('[data-run-query]');if(run){await runQuery(run.dataset.runQuery,true,true);renderFeedback('sql',storedDynamicResult('sql',['q1','q2','q3','q4','q5'],25));return}
    const reset=e.target.closest('[data-reset-query]');if(reset){const id=reset.dataset.resetQuery;state.queries[id]=QUERY_DEFS[id].starter;$(`#${id}`).value=state.queries[id];state.tests[id]=false;save();updateScores();return}
    const hint=e.target.closest('[data-hint]');if(hint){const id=hint.dataset.hint;state.hints[id]=(state.hints[id]||0)+1;save();const el=$(`#status-${id}`);el.className='task-status';el.textContent=`Pista: ${QUERY_DEFS[id].hint}`;return}
  });
  document.addEventListener('dblclick',e=>{const mf=e.target.closest('.model-field');if(mf){removeModelField(mf.dataset.id);return}});
  $$('textarea').forEach(t=>t.addEventListener('input',()=>{if(t.id==='ddl')state.ddl=t.value;else if(QUERY_DEFS[t.id])state.queries[t.id]=t.value;save()}));
  $('#toggleCardinality')?.addEventListener('click',cycleCardinality);
  $('#generateDDL')?.addEventListener('click',generateDDLFromModel);
  $('#loadDDLStarter')?.addEventListener('click',loadDDLStarter);
  $('#runDDL')?.addEventListener('click',()=>runDDLTests(true));
  $('#runAllQueries')?.addEventListener('click',()=>runQueries(true));
  $('#runChaos')?.addEventListener('click',()=>runChaos(true));
  $('#submitFinal')?.addEventListener('click',finalEvaluate);
  $('#downloadEvidence')?.addEventListener('click',downloadEvidence);
  $('#saveDraft')?.addEventListener('click',()=>{save();setEngine('Borrador guardado en este navegador.','ok')});
  $('#resetDraft')?.addEventListener('click',()=>{if(confirm('¿Reiniciar todo el workbench de S15 en este navegador?')){localStorage.removeItem(STORE);state=freshState();renderAll();setEngine('Workbench reiniciado.','work')}})
  $('#toggleNav')?.addEventListener('click',()=>$('#missionNav')?.classList.toggle('open'));
  $$('.mission-nav a').forEach(a=>a.addEventListener('click',()=>$('#missionNav')?.classList.remove('open')));
}
async function init(){
  restore();updateAuth();setEngine('Cargando SQL.js y datasets…','work');
  try{
    SQL=await window.initSqlJs({locateFile:f=>`${SQLJS_BASE}${f}`});
    baseData=await loadData();
    renderAll();previewDataset('casos');bindEvents();
    setEngine(`Workbench listo: ${baseData.casos.length} casos, ${baseData.eventos.length} eventos y ${baseData.evidencias.length} documentos de evidencias.`,'ok');
  }catch(e){setEngine(`No se pudo iniciar el workbench: ${e.message||e}`,'bad')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();