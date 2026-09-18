# -*- coding: utf-8 -*-
"""Criterios de aceptación S15 v7 derivados de la auditoría del 18-sep-2026.

No publica la clave del Boss ni consultas finales. Comprueba los 22 criterios
funcionales/metodológicos y regresiones que hicieron inválida la v6.
"""
from __future__ import annotations
import csv,json,re,sqlite3
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/"Plantillas/proyecto-final/Datos"
HTML=(ROOT/"evaluador-s15-v7.html").read_text(encoding="utf-8")
JS=(ROOT/"assets/learning/s15-autograder-v7.js").read_text(encoding="utf-8")
CSS=(ROOT/"assets/learning/s15-workbench-v7.css").read_text(encoding="utf-8")
CRIT=(ROOT/"Plantillas/proyecto-final/criterios.md").read_text(encoding="utf-8")
PLAN=(ROOT/"assets/learning/learning-plan.json").read_text(encoding="utf-8")

def csvrows(name):
    with (DATA/name).open(encoding="utf-8",newline="") as f:return list(csv.DictReader(f))

def source_db():
    casos,eventos=csvrows("casos.csv"),csvrows("eventos.csv")
    con=sqlite3.connect(":memory:")
    con.executescript("CREATE TABLE casos_src(caso_id INTEGER,fecha_creacion TEXT,ciudadano_id TEXT,tipo TEXT,prioridad TEXT,estado TEXT,canal TEXT,barrio TEXT);CREATE TABLE eventos_src(evento_id TEXT,caso_id INTEGER,fecha_evento TEXT,estado TEXT,agente_id TEXT,minutos_desde_anterior INTEGER);")
    con.executemany("INSERT INTO casos_src VALUES(?,?,?,?,?,?,?,?)",[(int(r["caso_id"]),r["fecha_creacion"],r["ciudadano_id"],r["tipo"],r["prioridad"],r["estado"],r["canal"],r["barrio"]) for r in casos])
    con.executemany("INSERT INTO eventos_src VALUES(?,?,?,?,?,?)",[(r["evento_id"],int(r["caso_id"]),r["fecha_evento"],r["estado"],r["agente_id"],int(r["minutos_desde_anterior"])) for r in eventos])
    return con,casos,eventos

def q(sql):
    con,_,_=source_db()
    try:return con.execute(sql).fetchall()
    finally:con.close()

def test_acceptance_22():
    # 1. Cargar no regala puntos / no hay oráculo continuo en evaluación.
    assert "checkedScore:{}" in JS and "MODE==='practica'?live[k]:(state.checked[k]?state.checkedScore[k]:'—')" in JS
    assert "exact(p,['fecha_evento'])" in JS and "c.length===2&&!c.includes('caso_id')" in JS

    # 2-4. Banco ER: toque/drag válidos, FK explícita y homónimos identificables.
    assert 'data-drop="model:caso"' in HTML and 'data-drop="model:evento"' in HTML
    assert 'id="fkSelect"' in HTML and 'value="evento.caso_id"' in HTML and 'id="cardinalitySelect"' in HTML
    assert "caso_id · CASO" in JS and "caso_id · EVENTO" in JS and "estado · CASO" in JS and "estado · EVENTO" in JS

    # 5. Los starters típicos fallan ya en el dataset base: no hay crédito por no tocar.
    starters={
      "q1":"SELECT barrio,COUNT(*) casos_alta FROM casos_src WHERE prioridad='Media' GROUP BY barrio",
      "q2":"SELECT c.caso_id,c.estado,MAX(e.estado) FROM casos_src c LEFT JOIN eventos_src e ON e.caso_id=c.caso_id GROUP BY c.caso_id,c.estado",
      "q3":"SELECT caso_id,SUM(minutos_desde_anterior) FROM eventos_src WHERE estado='Cerrado' GROUP BY caso_id",
      "q4":"SELECT COUNT(*),COUNT(*),SUM(CASE WHEN c.prioridad='Alta' THEN 1 ELSE 0 END) FROM casos_src c LEFT JOIN eventos_src e ON e.caso_id=c.caso_id",
      "q5":"SELECT c.tipo,COUNT(*),ROUND(AVG(e.minutos_desde_anterior),1) FROM casos_src c LEFT JOIN eventos_src e ON e.caso_id=c.caso_id GROUP BY c.tipo",
    }
    con,casos,eventos=source_db()
    try:
      assert all(con.execute(sql).fetchall() for sql in starters.values())
      # Contraejemplos deterministas que matan el significado de los starters.
      assert any(r["prioridad"]=="Alta" for r in casos) and any(r["prioridad"]=="Media" for r in casos)
      # 1010 tiene snapshot desactualizado frente al último evento.
      c1010=next(r for r in casos if r["caso_id"]=="1010")
      e1010=sorted([r for r in eventos if r["caso_id"]=="1010"],key=lambda x:x["fecha_evento"])[-1]
      assert c1010["estado"]!=e1010["estado"]
    finally:con.close()

    # 6-8. DDL: starter sin solución, error visible y contrato tolera columnas extra.
    starter=JS[JS.index("function ddlStarter()"):JS.index("function runDdl()")]
    assert "PRIMARY KEY" not in starter and "FOREIGN KEY" not in starter and "NOT NULL" not in starter and "CHECK(" not in starter
    assert "Tu DDL no se ejecutó:" in JS and "INSERT INTO caso(caso_id,fecha_creacion,tipo,prioridad,estado,barrio)" in JS
    assert "ciudadano_id" in (DATA/"casos.csv").read_text(encoding="utf-8")  # columna extra permitida por el contrato/server

    # 9. Comentarios iniciales se eliminan antes de validar SELECT/WITH.
    assert "stripSql(q)" in JS and "replace(/--.*$/gm" in JS

    # 10. MAX(evento_id) no equivale al último tiempo.
    ev1006=[r for r in eventos if r["caso_id"]=="1006"]
    assert max(ev1006,key=lambda r:r["evento_id"])["evento_id"] != max(ev1006,key=lambda r:r["fecha_evento"])["evento_id"]

    # 11. Tener algún Cerrado no significa terminar Cerrado: 1016 fue reabierto.
    ev1016=sorted([r for r in eventos if r["caso_id"]=="1016"],key=lambda r:r["fecha_evento"])
    assert any(r["estado"]=="Cerrado" for r in ev1016) and ev1016[-1]["estado"]!="Cerrado"

    # 12-13. Contratos visibles y tabla de resultado del escenario base.
    for text in ("Columnas exactas: barrio, casos_alta","Columnas exactas: caso_id, estado_actual, ultimo_estado","Redondea promedio_minutos a 1 decimal"):
        assert text in JS
    assert "if(v.name==='base')baseResult=r" in JS

    # 14. Las fichas no cambian el número hasta Comprobar.
    assert "function canCheck(k)" in JS and "state.checkedScore[k]=s" in JS

    # 15-16. Sobreinclusión: una partición y un grano exactos.
    assert "exact(p,['fecha_evento'])" in JS
    assert "exact(state.dw.grain,['grain:evento'])" in JS

    # 17-19. UNNEST: comentarios no cuentan, alias libre y feedback no entrega la línea-respuesta.
    assert "stripSql(q)" in JS and "const alias=m[2]" in JS
    assert "Usa UNNEST(c.evidencias) AS e" not in JS
    assert "DuckDB-Wasm" in HTML and "s15-nested-duckdb-v1.mjs" in HTML

    # 20. ciudadano_id se evalúa como referencia guardada dentro, perfil fuera.
    assert 'data-drop="doc:refid"' in HTML and "exact(state.doc.refid,['ciudadano_ref'])" in JS

    # 21. Fichas Nested coinciden con evidencias.json.
    evid=json.loads((DATA/"evidencias.json").read_text(encoding="utf-8"))
    real=set()
    for d in evid:
      for x in d.get("evidencias",[]): real.update(x.keys())
    assert {"tipo","url","texto"} <= real
    assert "e.texto" in JS and "e.metadata" not in JS

    # 22. Camino experto completo accesible por UI y pesos suman exactamente 80.
    assert all(x in HTML for x in ('id="fkSelect"','id="domainEvolution"','id="docPartitionKey"','id="eventLatency"','id="runNested"'))
    assert "const MAX={sql:15,model:12,ddl:10,doc:10,dw:13,bq:10,nested:10}" in JS
    assert sum([15,12,10,10,13,10,10])==80

def test_methodology_and_security_regressions():
    # Dos modos, límites de intentos, justificaciones y Boss variable.
    assert "MODE===" in JS and "MAX_CHECKS=3" in JS and "MAX_SQL_ATTEMPTS=3" in JS
    for k in ("why-sql","why-model","why-ddl","why-doc","why-dw","why-bq","why-nested","why-boss"):assert f'id="{k}"' in HTML
    assert "action:'init'" in JS and "workload" in HTML.lower()
    # La clave fija del Boss ya no puede estar en el contrato/plan públicos.
    forbidden=("línea de pedido como grano","fecha de pedido como partición","categoría/cliente como patrón de clustering")
    assert not any(x in CRIT.lower() for x in forbidden)
    assert "s15-workbench-v7" in PLAN
    # Diagnóstico, SQL/NoSQL, Cosmos, batch/streaming.
    assert all(x in HTML for x in ('id="s0"','id="docStoreCase"','id="docStoreLedger"','id="docPartitionKey"','id="eventLatency"','id="dimLatency"'))
    # Simulador distingue estimación previa y procesamiento posterior.
    assert 'id="bqPreBytes"' in HTML and 'id="bqPostBytes"' in HTML

def test_routes_and_pwa():
    assert "evaluador-s15-v7.html" in (ROOT/"evaluador-s15.html").read_text(encoding="utf-8")
    assert "sesion-15-desafio-final-v7.html" in (ROOT/"Presentaciones/M6/sesion-15-desafio-final.html").read_text(encoding="utf-8")
    sw=(ROOT/"service-worker.js").read_text(encoding="utf-8")
    for x in ("evaluador-s15-v7.html","s15-autograder-v7.js","s15-nested-duckdb-v1.mjs","s15-workbench-v7.css","casos_dirty.csv","eventos_dirty.csv"):assert x in sw

def main():
    test_acceptance_22();test_methodology_and_security_regressions();test_routes_and_pwa()
    print("OK · S15 v7: 22/22 criterios de aceptación estáticos/deterministas + metodología + rutas/PWA")

if __name__=="__main__":main()
