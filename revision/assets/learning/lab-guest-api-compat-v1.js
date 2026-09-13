(()=>{
'use strict';
const q=new URLSearchParams(location.search);
if(q.get('guest')!=='1'||!/\/lab\.html$/i.test(location.pathname))return;
const api=window.ANDES_LMS;
if(!api)return;
const script=document.currentScript||[...document.scripts].find(s=>/lab-guest-api-compat-v1\.js(?:\?|$)/.test(s.src));
const ROOT=script?new URL('../../',script.src):new URL('./',location.href);
const rows=[
[1,'Presentaciones/M1/sesion-1-diagnostico.html'],
[2,'Presentaciones/M2/sesion-2-bases-de-datos-y-primeras-consultas.html'],
[3,'Presentaciones/M2/sesion-3-filtros-y-agregaciones.html'],
[4,'Presentaciones/M2/sesion-4-uniones-de-tablas.html'],
[5,'Presentaciones/M2/sesion-5-algoritmica-de-tablas.html'],
[6,'Presentaciones/M3/sesion-6-reglas-de-negocio.html'],
[7,'Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html'],
[8,'Presentaciones/M3/sesion-8-modelado-y-normalizacion.html'],
[9,'Presentaciones/M3/sesion-9-ddl-supabase.html'],
[10,'Presentaciones/M4/sesion-10-sql-o-nosql.html'],
[11,'Presentaciones/M4/sesion-11-documentos-de-verdad.html'],
[12,'Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html'],
[13,'Presentaciones/M5/sesion-13-laboratorio-bigquery.html'],
[14,'Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html'],
[15,'Presentaciones/M6/sesion-15-desafio-final.html'],
[16,'Presentaciones/M6/sesion-16-cierre-dp900.html']
];
if(!api.ROOT)api.ROOT=ROOT;
if(!Array.isArray(api.ROUTE))api.ROUTE=rows.map(([n,path])=>({n,path:`${path}?guest=1`}));
if(typeof api.logout!=='function')api.logout=()=>Promise.resolve(true);
})();
