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
REV_HTML=(ROOT/"revision/evaluador-s15-v7.html").read_text(encoding="utf-8")
REV_JS=(ROOT/"revision/assets/learning/s15-autograder-v7.js").read_text(encoding="utf-8")
PRACTICE_JS=(ROOT/"assets/learning/s15-autograder-v7-practice.js").read_text(encoding="utf-8")
REV_PRACTICE_JS=(ROOT/"revision/assets/learning/s15-autograder-v7-practice.js").read_text(encoding="utf-8")
SOL_JS=(ROOT/"assets/learning/s15-autograder-v7-solution.js").read_text(encoding="utf-8")
EDGE_FN=(ROOT/"supabase/functions/learning-autograde-s15-v7/index.ts").read_text(encoding="utf-8")

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
    assert "checkedScore:{}" in JS and "k==='ddl'?ddlScore():state.checkedScore[k]" in JS
    assert "exact(p,['fecha_evento'])" in JS and "c.length===2&&!c.includes('caso_id')" in JS

    # 2-4. Banco ER: toque/drag válidos, FK explícita y homónimos sin identidad oculta evaluable.
    assert 'data-drop="model:caso"' in HTML and 'data-drop="model:evento"' in HTML
    assert 'id="pkCaseSelect"' in HTML and 'id="pkEventSelect"' in HTML
    assert 'id="fkSelect"' in HTML and 'value="evento.caso_id"' in HTML and 'id="cardinalitySelect"' in HTML
    assert "caso_id · CASO" in JS and "caso_id · EVENTO" in JS and "estado · CASO" in JS and "estado · EVENTO" in JS
    assert "Las dos fichas homónimas son intercambiables" in HTML
    assert "const normColumn=id=>String(id||'').split('.').pop()" in JS
    assert "agente_id · FK → AGENTE" in JS and "agente_id · PK" in JS
    assert "caso_id · FK → CASO" in JS and "caso_id · PK" in JS
    assert "state.norm.caso.map(normColumn)" in JS and "state.norm.evento.map(normColumn)" in JS and "state.norm.agente.map(normColumn)" in JS
    assert 'cols=(x:any)=>arr(x).map(v=>String(v).split(".").pop())' in EDGE_FN

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
      # Construye la verdad esperada desde los datos, sin publicar SQL solución.
      alta={}
      for r in casos:
        if r["prioridad"]=="Alta": alta[r["barrio"]]=alta.get(r["barrio"],0)+1
      expected_q1=sorted((k,v) for k,v in alta.items())
      latest={}
      for e in eventos:
        k=e["caso_id"]
        if k not in latest or e["fecha_evento"]>latest[k]["fecha_evento"]: latest[k]=e
      expected_q2=sorted((int(r["caso_id"]),r["estado"],latest.get(r["caso_id"],{}).get("estado")) for r in casos)
      closed={k for k,e in latest.items() if e["estado"]=="Cerrado"}
      sums={}
      for e in eventos:
        if e["caso_id"] in closed:sums[e["caso_id"]]=sums.get(e["caso_id"],0)+int(e["minutos_desde_anterior"])
      expected_q3=sorted((int(k),v) for k,v in sums.items())
      expected_q4=[(len(casos),len(eventos),sum(r["prioridad"]=="Alta" for r in casos))]
      mins={r["caso_id"]:0 for r in casos}
      for e in eventos:mins[e["caso_id"]]=mins.get(e["caso_id"],0)+int(e["minutos_desde_anterior"])
      by={}
      for r in casos:by.setdefault(r["tipo"],[]).append(mins[r["caso_id"]])
      expected_q5=sorted((k,len(v),round(sum(v)/len(v),1)) for k,v in by.items())
      expected={"q1":expected_q1,"q2":expected_q2,"q3":expected_q3,"q4":expected_q4,"q5":expected_q5}
      for key,sql in starters.items():
        got=sorted(con.execute(sql).fetchall())
        assert got!=expected[key],f"{key} starter no debe pasar con datos base"
      # Tres errores conceptuales típicos también deben fallar.
      bad_q2_id="""WITH u AS (SELECT caso_id,MAX(evento_id) AS id FROM eventos_src GROUP BY caso_id)
      SELECT c.caso_id,c.estado,e.estado FROM casos_src c LEFT JOIN u ON u.caso_id=c.caso_id LEFT JOIN eventos_src e ON e.evento_id=u.id"""
      bad_q3_any="SELECT caso_id,SUM(minutos_desde_anterior) FROM eventos_src WHERE caso_id IN (SELECT caso_id FROM eventos_src WHERE estado='Cerrado') GROUP BY caso_id"
      bad_q2_snapshot="SELECT caso_id,estado,estado FROM casos_src"
      assert sorted(con.execute(bad_q2_id).fetchall())!=expected_q2
      assert sorted(con.execute(bad_q3_any).fetchall())!=expected_q3
      assert sorted(con.execute(bad_q2_snapshot).fetchall())!=expected_q2
      # Contraejemplos específicos de reapertura, id tardío y snapshot desactualizado.
      ev1006=[r for r in eventos if r["caso_id"]=="1006"]
      assert max(ev1006,key=lambda r:r["evento_id"])["evento_id"] != max(ev1006,key=lambda r:r["fecha_evento"])["evento_id"]
      ev1016=sorted([r for r in eventos if r["caso_id"]=="1016"],key=lambda x:x["fecha_evento"])
      assert any(r["estado"]=="Cerrado" for r in ev1016) and ev1016[-1]["estado"]!="Cerrado"
      c1010=next(r for r in casos if r["caso_id"]=="1010")
      e1010=sorted([r for r in eventos if r["caso_id"]=="1010"],key=lambda x:x["fecha_evento"])[-1]
      assert c1010["estado"]!=e1010["estado"]
    finally:con.close()

    # 6-8. DDL: starter sin solución, error visible y contrato tolera columnas extra.
    starter=JS[JS.index("function ddlStarter()"):JS.index("function runDdl(")]
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
    assert "s15-nested-duckdb-v1.mjs" in JS and 'id="runNested"' in HTML
    assert "engine.validate(state.unnestQuery)" in JS

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
    assert all(x in HTML for x in ('id="fkSelect"','id="domainMigration"','id="runDomainMigration"','id="docPartitionKey"','id="eventLatency"','id="runNested"'))
    assert "const MAX={sql:15,model:12,ddl:10,doc:10,dw:13,bq:10,nested:10}" in JS
    assert sum([15,12,10,10,13,10,10])==80

def test_methodology_and_security_regressions():
    # Dos modos, límites de intentos y Boss variable; ninguna respuesta abierta entra en la nota.
    assert "MAX_CHECKS=3" in JS and "MAX_SQL_ATTEMPTS=3" in JS
    assert "runMutationProbe" in JS and 'id="mutationProbe"' in HTML and 'id="runMutation"' in HTML
    assert "stationSeconds()" in JS and "IntersectionObserver" in JS
    assert 'class="reason"' not in HTML and 'id="why-' not in HTML
    assert "reasoningComplete" not in JS and "state.reasoning" not in JS
    assert "action:'init'" in JS and "workload" in HTML.lower()
    # La clave fija del Boss ya no puede estar en el contrato/plan públicos.
    forbidden=("línea de pedido como grano","fecha de pedido como partición","categoría/cliente como patrón de clustering")
    assert not any(x in CRIT.lower() for x in forbidden)
    assert "s15-workbench-v7" in PLAN
    assert "variante oculta determinística" in CRIT
    assert "Declara las PK con los selectores explícitos" in JS
    # Diagnóstico, SQL/NoSQL, Cosmos, batch/streaming.
    assert all(x in HTML for x in ('id="s0"','id="docStoreCase"','id="docStoreLedger"','id="docPartitionKey"','id="eventLatency"','id="dimLatency"'))
    # Simulador distingue estimación previa y procesamiento posterior.
    assert 'id="bqPreBytes"' in HTML and 'id="bqPostBytes"' in HTML
    assert "if(state.bq.cluster.length&&filters.has(state.bq.cluster[0]))" in JS
    # DDL: el estudiante solo edita el DDL; Mutation/Escalado son demos preparadas y no regalan puntaje.
    assert 'id="mutationProbe" class="code smallcode" readonly' in HTML
    assert 'id="domainMigration" class="code smallcode" readonly' in HTML
    assert "esta demostración no suma puntaje" in HTML
    assert "const MUTANT_PROBES=" in JS and "const DOMAIN_MIGRATION_SQL=" in JS
    assert "function runMutationProbe()" in JS and "const probe=MUTANT_PROBES[selectedMutant]||''" in JS
    assert "function runDomainMigration()" in JS and "const sql=DOMAIN_MIGRATION_SQL" in JS
    assert "state.mutationProbe=probe" not in JS
    assert "state.domainMigration=$('#domainMigration')" not in JS
    assert "if(state.ddlChecks.dup_case)s+=1.5" in JS
    assert "if(state.ddlChecks.neg&&state.ddlChecks.zero_valid)s+=3" in JS
    assert "mut*2/3" not in JS and "mut*2/3" not in SOL_JS and "mut*2/3" not in EDGE_FN
    assert "if(checks.d1)s+=1.5" in EDGE_FN and "if(checks.d5&&checks.d7_zero_valid)s+=3" in EDGE_FN
    assert "function initStationTiming()" in JS and "station_seconds:stationSeconds()" in JS
    # Runtime/performance: SQL.js is loaded explicitly, DuckDB is lazy and guest mode works without auth.
    assert 'assets/vendor/sqljs/sql-wasm.js?v=s15v7-fast1' in HTML
    assert 'type="module" src="assets/learning/s15-nested-duckdb-v1.mjs' not in HTML
    assert "async function ensureSqlJs()" in JS and "async function ensureNestedEngine()" in JS
    assert "$('.mission').forEach" in JS
    assert "Modo invitado activo" in JS and "Guardar evidencia local" in JS
    assert "if(MODE==='practica')live=currentScores()" in JS
    assert "function captureTextarea(el)" in JS

def test_routes_and_pwa():
    assert "evaluador-s15-v7.html" in (ROOT/"evaluador-s15.html").read_text(encoding="utf-8")
    assert "sesion-15-desafio-final-v7.html" in (ROOT/"Presentaciones/M6/sesion-15-desafio-final.html").read_text(encoding="utf-8")
    sw=(ROOT/"service-worker.js").read_text(encoding="utf-8")
    for x in ("evaluador-s15-v7.html","s15-autograder-v7.js","s15-autograder-v7-practice.js","s15-nested-duckdb-v1.mjs","s15-workbench-v7.css","casos_dirty.csv","eventos_dirty.csv"):assert x in sw


def test_cohort_persistence_contract():
    # Clave y versión históricas: cualquier cambio aquí dejaría huérfano el avance local existente.
    historical="const VERSION='s15-workbench-v7',STORE='andesdb.s15.workbench.v7'"
    assert historical in JS
    assert historical in PRACTICE_JS
    assert "SOURCE_STORE='andesdb.s15.workbench.v7'" in SOL_JS
    assert "localStorage.clear(" not in JS and "localStorage.clear(" not in PRACTICE_JS
    assert JS.count("localStorage.removeItem(STORE)") == 1       # solo Reiniciar explícito
    assert PRACTICE_JS.count("localStorage.removeItem(STORE)") == 1
    assert "sessionStorage.setItem(STORE" not in PRACTICE_JS
    assert "sessionStorage.getItem(STORE" not in PRACTICE_JS
    assert "localStorage.removeItem(SOURCE_STORE)" not in SOL_JS
    assert "localStorage.setItem(SOURCE_STORE" not in SOL_JS

    # Evaluación queda sin respuestas embebidas; la práctica usa un runtime separado.
    assert "SQL_SOLUTIONS" not in JS and "STATION_GUIDES" not in JS
    assert "SQL_SOLUTIONS" in PRACTICE_JS and "STATION_GUIDES" in PRACTICE_JS
    assert "s15-autograder-v7-practice.js?v=s15v7-transfer1" in HTML
    assert "s15-autograder-v7.js?v=s15v7-transfer1" in HTML
    assert "new URLSearchParams(location.search).get('modo')==='practica'" in HTML

    # La estructura v7 histórica se conserva; los nuevos campos de guía son solo aditivos.
    initial=JS[JS.index("const initial=()=>"):JS.index("let state=initial()")]
    practice_initial=PRACTICE_JS[PRACTICE_JS.index("const initial=()=>"):PRACTICE_JS.index("let state=initial()")]
    legacy_tokens=("checked:{}","checkedScore:{}","queryAttempts:{}","ddlRuns:0","mutationRuns:{}",
                  "timing:{}","model:{","norm:{","ddl:''","ddlChecks:{}","domainMigration:''",
                  "domainMigrationResult:{}","mutation:{}","mutationProbe:''","queryChecks:{}",
                  "hints:{}","doc:{","dw:{","pipe:{","bq:{","nested:{","format:{",
                  "unnestQuery:","diag:{","boss:{","attempts:[]")
    for token in legacy_tokens:
        assert token in initial, token
        assert token in practice_initial, token
    for token in ("solutionOpen:{}","solutionView:{}","studyHints:{}"):
        assert token in practice_initial, token

    # Las preguntas e IDs existentes no cambian.
    for qid in ("q1","q2","q3","q4","q5"):
        assert f"{qid}:" in JS and f"{qid}:" in PRACTICE_JS
        assert f'id="{qid}"' not in HTML
    assert "q6:" not in JS and "q6:" not in PRACTICE_JS
    for cid in ("ddl","domainMigration","mutationProbe","unnestQuery","bossUnnest","diagSql",
                "pkCaseSelect","pkEventSelect","fkSelect","cardinalitySelect","docStoreCase",
                "docStoreLedger","docPartitionKey","eventLatency","dimLatency","transformMode",
                "bossStrategy","az-object","az-document","az-lakehouse","az-bi"):
        assert f'id="{cid}"' in HTML, cid

    # Pistas ya usadas siguen en state.hints: evaluación muestra máximo 2 sin truncar el dato;
    # práctica reconoce 3/3 y habilita solución/explicación sin tocar respuestas ni puntajes.
    assert "function sqlHintLimit(){return MODE==='evaluacion'?2:3}" in JS
    assert "state.hints[id]" in JS and 'id="hints-' in JS
    assert "Pista 3/3 · Orden para resolver" in JS
    assert "state.hints[id]" in PRACTICE_JS
    assert 'data-solution="' in PRACTICE_JS
    assert "function runReferenceQ" in PRACTICE_JS
    assert "no modifica tu intento ni tu puntuación" in PRACTICE_JS
    assert "renderStudyGuides()" in PRACTICE_JS
    assert "function prepareSolvedDdl(){}" in PRACTICE_JS  # no sobrescribir DDL/migración/probe existentes
    assert "state.domainMigration=$('#domainMigration')" not in JS and "state.domainMigration=$('#domainMigration')" not in PRACTICE_JS
    assert "state.mutationProbe=probe" not in JS and "state.mutationProbe=probe" not in PRACTICE_JS
    assert "domain_migration:DOMAIN_MIGRATION_SQL" in JS and "domain_migration:DOMAIN_MIGRATION_SQL" in PRACTICE_JS

    # Restore de práctica lee el STORE histórico y solo mezcla campos faltantes.
    restore=PRACTICE_JS[PRACTICE_JS.index("function restore()"):PRACTICE_JS.index("function parseCSV")]
    assert "localStorage.getItem(STORE)" in restore
    assert "localStorage.removeItem(STORE)" not in restore
    assert "queries:{...d.queries" in restore and "hints:{...d.hints" in restore
    assert "solutionOpen:{...d.solutionOpen" in restore
    assert "studyHints:{...d.studyHints" in restore

    # El evaluador raíz y revision quedan alineados, incluida la nueva práctica.
    assert REV_HTML == HTML
    assert REV_JS == JS
    assert REV_PRACTICE_JS == PRACTICE_JS

    # Mejoras pedagógicas/formato ya desplegadas sin preguntas nuevas.
    for token in ("foto-1.jpg","Se verificó el lugar","E01","E02","Chapinero",
                  "Patrón de consultas","Antes de UNNEST","Después de UNNEST",
                  "P01","12.000","36.000"):
        assert token in HTML, token

    # Solo Q3 y Q5 se marcan como retos de transferencia: son los saltos conceptuales más fuertes.
    assert "const SQL_TRANSFER_CHALLENGES=" in JS
    transfer=JS[JS.index("const SQL_TRANSFER_CHALLENGES="):JS.index("const MODEL_FIELDS=")]
    assert "q3:" in transfer and "q5:" in transfer
    assert "q1:" not in transfer and "q2:" not in transfer and "q4:" not in transfer
    assert "Reto de transferencia" in JS and "Conexión adicional:" in JS
    assert "transfer-badge" in CSS and "transfer-note" in CSS

def main():
    test_acceptance_22();test_methodology_and_security_regressions();test_routes_and_pwa();test_cohort_persistence_contract()
    print("OK · S15 v7: 22/22 + metodología + rutas/PWA + contrato de cohorte/persistencia")

if __name__=="__main__":main()
