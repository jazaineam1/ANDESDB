import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
globalThis.window=globalThis;

for(const rel of [
  'assets/learning/lab-content-v4.js',
  'assets/learning/lab-content-v4-patch.js',
  'assets/learning/lab-content-s13-s16-alignment-v1.js',
  'assets/learning/lab-curriculum-v1.js'
]){
  const file=path.join(ROOT,rel);
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}

const sessions=globalThis.ANDES_LAB_CONTENT?.sessions;
if(!sessions)throw new Error('No se pudo construir ANDES_LAB_CONTENT');
const fail=[];
const text=n=>JSON.stringify(n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const raw=n=>JSON.stringify(n);
const need=(n,rx,label)=>{if(!rx.test(raw(sessions[n])))fail.push(`S${n}: falta cobertura de ${label}`)};
const forbid=(n,rx,label)=>{if(rx.test(raw(sessions[n])))fail.push(`S${n}: aparece antes de ser enseñado: ${label}`)};

for(let n=1;n<=16;n++){
  if(!sessions[n]){fail.push(`Falta S${n}`);continue}
  if(!Array.isArray(sessions[n].tasks)||sessions[n].tasks.length!==10)fail.push(`S${n}: debe tener exactamente 10 prácticas y tiene ${sessions[n].tasks?.length??0}`);
}

/* Contrato de secuencia derivado de las presentaciones vigentes.
   La mención “próxima sesión” NO habilita una práctica en la sesión actual. */
forbid(1,/\bOLTP\b|\bOLAP\b|\bgrano\b|\bSELECT\b|\bWHERE\b|\bGROUP BY\b/i,'contenido de S2/S5/S6');
forbid(2,/\bBETWEEN\b|\bLIKE\b|\bIN\s*\(/i,'BETWEEN / IN / LIKE (se enseñan en S3)');
forbid(3,/COUNT\s*\(\s*DISTINCT/i,'COUNT(DISTINCT ...) (se trabaja en S5)');
forbid(5,/FROM\s*\(\s*SELECT/i,'subconsulta derivada no enseñada en la presentación S5');
forbid(11,/\bSnapshot\b/i,'término Snapshot no usado en la presentación S11');
forbid(12,/surrogate|sustitut|\bSCD\b/i,'surrogate key / SCD no enseñado en S12');

/* Cobertura mínima: el laboratorio no solo evita adelantos; también practica el núcleo enseñado. */
need(1,/Estructurado/i,'formas del dato');
need(1,/Data engineer/i,'roles');
need(1,/Ciclo de vida/i,'ciclo de vida');
need(2,/SELECT/i,'SELECT');
need(2,/WHERE/i,'WHERE');
need(2,/DISTINCT/i,'DISTINCT');
need(2,/COUNT/i,'COUNT');
need(2,/ORDER BY/i,'ORDER BY');
need(2,/LIMIT/i,'LIMIT');
need(2,/\bOR\b/i,'OR');
need(3,/BETWEEN/i,'BETWEEN');
need(3,/\bIN\s*\(/i,'IN');
need(3,/LIKE/i,'LIKE');
need(3,/IS NULL/i,'NULL / IS NULL');
need(3,/GROUP BY/i,'GROUP BY');
need(3,/HAVING/i,'HAVING');
need(4,/UNION ALL/i,'UNION ALL');
need(4,/\bUNION\b/i,'UNION');
need(4,/INNER JOIN/i,'INNER JOIN');
need(4,/LEFT JOIN/i,'LEFT JOIN');
need(4,/RIGHT JOIN/i,'RIGHT JOIN');
need(4,/FULL OUTER JOIN/i,'FULL OUTER JOIN');
need(5,/\bWITH\b/i,'WITH / CTE');
need(5,/COALESCE/i,'COALESCE');
need(5,/COUNT\s*\(\s*DISTINCT/i,'COUNT(DISTINCT)');
need(5,/\bCASE\b/i,'CASE');
need(6,/Hip[oó]tesis/i,'hipótesis frente a regla/evidencia');
need(6,/CHECK/i,'restricciones del esquema');
need(7,/N:M/i,'cardinalidad N:M');
need(7,/Entidad asociativa/i,'entidad asociativa');
need(8,/1FN/i,'1FN');
need(8,/2FN/i,'2FN');
need(8,/3FN/i,'3FN');
need(9,/CREATE TABLE/i,'CREATE TABLE');
need(9,/SERIAL|IDENTITY/i,'autogeneración PostgreSQL');
need(9,/FOREIGN KEY|REFERENCES/i,'FK');
need(9,/CHECK/i,'CHECK');
need(10,/CAP/i,'CAP');
need(10,/Grafo/i,'modelo de grafos');
need(10,/Series de tiempo/i,'series de tiempo');
need(11,/JSON/i,'JSON');
need(11,/Embeber/i,'embeber');
need(11,/Referenciar/i,'referenciar');
need(11,/Copia hist[oó]rica/i,'precio congelado / copia histórica');
need(12,/Hecho/i,'hechos');
need(12,/Dimensi[oó]n/i,'dimensiones');
need(12,/Batch/i,'batch');
need(12,/Streaming/i,'streaming');
need(12,/ETL/i,'ETL/ELT');
need(13,/partition_by_day/i,'partición del laboratorio BigQuery real');
need(13,/cluster/i,'clustering');
need(14,/ARRAY/i,'ARRAY');
need(14,/STRUCT/i,'STRUCT');
need(14,/UNNEST/i,'UNNEST');
need(15,/casos\.csv/i,'casos.csv');
need(15,/eventos\.csv/i,'eventos.csv');
need(15,/evidencias\.json/i,'evidencias.json');
need(16,/Azure SQL/i,'Azure SQL');
need(16,/Cosmos DB/i,'Cosmos DB');
need(16,/Fabric|Synapse/i,'Fabric/Synapse');

/* Sanidad adicional: ninguna práctica debe quedar sin enunciado/título/tipo. */
for(let n=1;n<=16;n++) for(const [i,t] of (sessions[n]?.tasks||[]).entries()){
  if(!t?.type||!t?.title||!t?.prompt)fail.push(`S${n} P${i+1}: práctica incompleta`);
  if(t.type==='sql'&&!t.reference)fail.push(`S${n} P${i+1}: SQL sin consulta de referencia`);
  if(t.type==='classify'&&(!Array.isArray(t.items)||t.items.length!==t.answers?.length))fail.push(`S${n} P${i+1}: clasificación sin correspondencia 1:1`);
}

if(fail.length){
  console.error('AUDITORÍA LAB ↔ PRESENTACIÓN: FALLÓ');
  for(const x of fail)console.error(' - '+x);
  process.exit(1);
}
console.log('AUDITORÍA LAB ↔ PRESENTACIÓN: OK · 16 sesiones · 160 prácticas · sin adelantos curriculares conocidos');
