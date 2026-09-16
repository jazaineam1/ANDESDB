# -*- coding: utf-8 -*-
"""Sincroniza S15 v6: evaluación integral S2–S14 + Boss de transferencia."""
from __future__ import annotations
import json, shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent

def copy(rel:str)->None:
    src=ROOT/rel; dst=ROOT/'revision'/rel
    dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)

def find_session(course:dict,n:int):
    for mod in course.get('modulos',[]):
        for s in mod.get('sesiones',[]):
            if s.get('n')==n:return s
    return None

def update_course()->None:
    p=ROOT/'tools/curso.json'; data=json.loads(p.read_text(encoding='utf-8')); s=find_session(data,15)
    if not s: raise RuntimeError('No se encontró S15')
    s.update({
      'fecha':'2026-09-18','modo':'workbench_integral_v6','titulo':'Desafío final · Workbench integral',
      'desc':'Evaluación integradora de S2–S14: SQL, modelado y 3FN, DDL, documentos, Data Warehouse, BigQuery físico, ARRAY/STRUCT/UNNEST, formatos y transferencia Azure por necesidad. Dominio corregible 80 puntos + transferencia inédita 20 puntos; nota recalculada server-side.',
      'tags':['evaluación automática','SQL','normalización','DDL','NoSQL','Data Warehouse','BigQuery','partition','clustering','ARRAY','STRUCT','UNNEST','JSON','Parquet','Azure','Blob/ADLS','Cosmos DB','Fabric/Databricks','Power BI','transferencia','server-side grader'],
      'href':'Presentaciones/M6/sesion-15-desafio-final.html',
      'recursos':[
        {'txt':'🧪 S15 Workbench integral · 80 dominio + 20 transferencia','href':'evaluador-s15.html'},
        {'txt':'📊 Analítica docente del autograder','href':'s15-analytics.html'},
        {'txt':'✅ Contrato de evaluación integral','href':'Plantillas/proyecto-final/criterios.md'}
      ]
    })
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); copy('tools/curso.json')

def update_plan()->None:
    p=ROOT/'assets/learning/learning-plan.json'; data=json.loads(p.read_text(encoding='utf-8')); s=data.setdefault('sesiones',{}).setdefault('15',{})
    dp=s.get('dp900',[])
    s.update({
      'fecha':'2026-09-18','titulo':'Desafío final · Workbench integral','modo':'workbench_integral_v6',
      'objetivo':'Integrar S2–S14 en una solución ejecutable y transferir el razonamiento a un caso nuevo, incluida la elección de familia Azure a partir de la necesidad.',
      'nucleo':{'titulo':'Dominio corregible · 80 puntos','instrucciones':'Completa SQL Arena, Modelo+3FN, DDL Mutation, Document Lab, Warehouse Builder, BigQuery Physical y Nested BigQuery. Corrige con feedback progresivo.','criterios':['SQL sobre variaciones','modelo ER y 3FN','constraints y pruebas negativas','embeber/referenciar','hechos/dimensiones y OLTP/OLAP','partition/clustering/pruning','ARRAY/STRUCT/UNNEST y formatos JSON/Parquet']},
      'reto':{'titulo':'Boss Transfer · 20 puntos','instrucciones':'Resuelve pedidos omnicanal con un caso nuevo; el servidor ejecuta pruebas ocultas de DDL y SQL y verifica transferencia conceptual a Azure por necesidad.','criterios':['SQL oculto','DDL oculto','grano línea de pedido y medidas','partición por fecha y clustering por patrón de filtros','UNNEST de items sin perder pedido_id','objetos → Blob/ADLS','documento operacional → Cosmos DB','lakehouse/ingeniería → Fabric/Databricks','BI → Power BI']},
      'solucion':{'modo':'automatica_server_side','evaluador':'evaluador-s15.html','version':'s15-workbench-v6','puntaje_maximo':100,'mastery':80,'transferencia':20}
    })
    if dp:s['dp900']=dp
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); copy('assets/learning/learning-plan.json')

def sync()->None:
    for rel in (
      'evaluador-s15.html','evaluador-s15-v6.html',
      'assets/learning/s15-autograder-v6.js','assets/learning/s15-autograder-v6b.js','assets/learning/s15-azure-transfer-v1.js','assets/learning/s15-workbench-v6.css',
      'Presentaciones/M6/sesion-15-desafio-final.html','Presentaciones/M6/sesion-15-desafio-final-v6.html',
      's15-analytics.html','assets/learning/s15-teacher-link.js',
      'Plantillas/proyecto-final/README.md','Plantillas/proyecto-final/criterios.md'):
        if (ROOT/rel).exists(): copy(rel)

def main()->int:
    update_course(); update_plan(); sync(); print('S15 v6 sincronizada: S2–S14 + Boss con transferencia Azure, mastery 80 + transfer 20, grader server-side.'); return 0
if __name__=='__main__': raise SystemExit(main())
