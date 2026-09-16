# -*- coding: utf-8 -*-
"""Contratos y mutation tests de S15 Workbench v5."""
from __future__ import annotations
import csv, json, re, sqlite3
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "Plantillas" / "proyecto-final" / "Datos"


def read_csv(name: str):
    with (DATA / name).open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def load_data():
    return {"casos": read_csv("casos.csv"), "eventos": read_csv("eventos.csv")}


def variants(base):
    a = deepcopy(base)
    b = deepcopy(base)
    b["casos"].append({"caso_id":"1013","fecha_creacion":"2026-08-11","ciudadano_id":"C013","tipo":"Alumbrado","prioridad":"Alta","estado":"Abierto","canal":"Web","barrio":"Bosa"})
    b["eventos"].append({"evento_id":"E025","caso_id":"1013","fecha_evento":"2026-08-11 08:00","estado":"Abierto","agente_id":"A06","minutos_desde_anterior":"0"})
    c = deepcopy(base)
    c["casos"].append({"caso_id":"1014","fecha_creacion":"2026-08-12","ciudadano_id":"C014","tipo":"Basuras","prioridad":"Media","estado":"Abierto","canal":"App","barrio":"Fontibon"})
    next(x for x in c["casos"] if x["caso_id"]=="1003")["estado"]="Escalado"
    c["eventos"].append({"evento_id":"E028","caso_id":"1003","fecha_evento":"2026-08-03 12:00","estado":"Escalado","agente_id":"A04","minutos_desde_anterior":"230"})
    return [a,b,c]


def db(data):
    con=sqlite3.connect(":memory:")
    con.executescript("""
    CREATE TABLE casos_src(caso_id INTEGER,fecha_creacion TEXT,ciudadano_id TEXT,tipo TEXT,prioridad TEXT,estado TEXT,canal TEXT,barrio TEXT);
    CREATE TABLE eventos_src(evento_id TEXT,caso_id INTEGER,fecha_evento TEXT,estado TEXT,agente_id TEXT,minutos_desde_anterior INTEGER);
    """)
    con.executemany("INSERT INTO casos_src VALUES(?,?,?,?,?,?,?,?)",[(int(r["caso_id"]),r["fecha_creacion"],r.get("ciudadano_id"),r["tipo"],r["prioridad"],r["estado"],r.get("canal"),r["barrio"]) for r in data["casos"]])
    con.executemany("INSERT INTO eventos_src VALUES(?,?,?,?,?,?)",[(r["evento_id"],int(r["caso_id"]),r["fecha_evento"],r["estado"],r.get("agente_id"),int(r["minutos_desde_anterior"])) for r in data["eventos"]])
    return con

REFERENCE={
"q1":"SELECT barrio,COUNT(*) casos_alta FROM casos_src WHERE prioridad='Alta' GROUP BY barrio",
"q2":"""WITH ult AS (SELECT caso_id,estado,ROW_NUMBER() OVER(PARTITION BY caso_id ORDER BY fecha_evento DESC,evento_id DESC) rn FROM eventos_src) SELECT c.caso_id,c.estado estado_actual,u.estado ultimo_estado FROM casos_src c LEFT JOIN ult u ON u.caso_id=c.caso_id AND u.rn=1""",
"q3":"""WITH ult AS (SELECT caso_id,estado,ROW_NUMBER() OVER(PARTITION BY caso_id ORDER BY fecha_evento DESC,evento_id DESC) rn FROM eventos_src),cerrados AS (SELECT caso_id FROM ult WHERE rn=1 AND estado='Cerrado') SELECT e.caso_id,SUM(e.minutos_desde_anterior) minutos_hasta_cierre FROM eventos_src e JOIN cerrados c ON c.caso_id=e.caso_id GROUP BY e.caso_id""",
"q4":"""SELECT COUNT(DISTINCT c.caso_id) total_casos,COUNT(e.evento_id) total_eventos,COUNT(DISTINCT CASE WHEN c.prioridad='Alta' THEN c.caso_id END) casos_alta FROM casos_src c LEFT JOIN eventos_src e ON e.caso_id=c.caso_id""",
"q5":"""WITH por_caso AS (SELECT c.caso_id,c.tipo,COALESCE(SUM(e.minutos_desde_anterior),0) total_minutos FROM casos_src c LEFT JOIN eventos_src e ON e.caso_id=c.caso_id GROUP BY c.caso_id,c.tipo) SELECT tipo,COUNT(*) casos,ROUND(AVG(total_minutos),1) promedio_minutos FROM por_caso GROUP BY tipo""",
}
MUTANTS={
"q1":"SELECT barrio,COUNT(*) casos_alta FROM casos_src WHERE prioridad='Media' GROUP BY barrio",
"q2":"SELECT c.caso_id,c.estado estado_actual,MAX(e.estado) ultimo_estado FROM casos_src c LEFT JOIN eventos_src e ON e.caso_id=c.caso_id GROUP BY c.caso_id,c.estado",
"q3":"SELECT caso_id,SUM(minutos_desde_anterior) minutos_hasta_cierre FROM eventos_src WHERE estado='Cerrado' GROUP BY caso_id",
"q4":"SELECT COUNT(*) total_casos,COUNT(*) total_eventos,SUM(CASE WHEN c.prioridad='Alta' THEN 1 ELSE 0 END) casos_alta FROM casos_src c LEFT JOIN eventos_src e ON e.caso_id=c.caso_id",
"q5":"SELECT c.tipo,COUNT(*) casos,ROUND(AVG(e.minutos_desde_anterior),1) promedio_minutos FROM casos_src c LEFT JOIN eventos_src e ON e.caso_id=c.caso_id GROUP BY c.tipo",
}


def norm(rows):
    return sorted(tuple(round(v,6) if isinstance(v,float) else v for v in r) for r in rows)


def test_query_mutants_are_killed():
    scenarios=variants(load_data())
    for qid,mut in MUTANTS.items():
        killed=False
        for data in scenarios:
            con=db(data)
            try:
                good=norm(con.execute(REFERENCE[qid]).fetchall())
                try: bad=norm(con.execute(mut).fetchall())
                except sqlite3.Error: bad=[("ERROR",)]
                if bad!=good: killed=True
            finally: con.close()
        assert killed, f"El mutante {qid} sobrevivió a todos los escenarios"


def ddl_checks(ddl: str):
    con=sqlite3.connect(":memory:");con.execute("PRAGMA foreign_keys=ON")
    out={k:False for k in ("d1","d2","d3","d4","d5","d6")}
    try:
        con.executescript(ddl)
        con.execute("INSERT INTO caso VALUES(9001,'2026-09-01','Alumbrado','Alta','Abierto','Prueba')")
        con.execute("INSERT INTO evento VALUES('T001',9001,'2026-09-01 10:00','Abierto',0)")
        tests={
          "d1":"INSERT INTO caso VALUES(9001,'2026-09-01','Alumbrado','Alta','Abierto','Prueba')",
          "d2":"INSERT INTO evento VALUES('T001',9001,'2026-09-01 10:05','Abierto',5)",
          "d3":"INSERT INTO evento VALUES('ORPH',999999,'2026-09-01 11:00','Abierto',0)",
          "d4":"INSERT INTO caso VALUES(9002,'2026-09-01',NULL,'Media','Abierto','Prueba')",
          "d5":"INSERT INTO evento VALUES('NEG',9001,'2026-09-01 12:00','Abierto',-1)",
        }
        for k,sql in tests.items():
            try: con.execute(sql); con.rollback()
            except sqlite3.IntegrityError: out[k]=True
        try:
            con.execute("INSERT INTO caso VALUES(9003,'2026-09-01','Semaforo','Alta','Escalado','Prueba')")
            con.execute("INSERT INTO evento VALUES('EVOL',9003,'2026-09-01 13:00','Escalado',10)")
            out["d6"]=True
        except sqlite3.Error: pass
    except sqlite3.Error: pass
    finally: con.close()
    return out

GOOD_DDL="""CREATE TABLE caso(caso_id INTEGER PRIMARY KEY,fecha_creacion TEXT NOT NULL,tipo TEXT NOT NULL,prioridad TEXT NOT NULL,estado TEXT NOT NULL,barrio TEXT NOT NULL);CREATE TABLE evento(evento_id TEXT PRIMARY KEY,caso_id INTEGER NOT NULL,fecha_evento TEXT NOT NULL,estado TEXT NOT NULL,minutos_desde_anterior INTEGER NOT NULL CHECK(minutos_desde_anterior>=0),FOREIGN KEY(caso_id) REFERENCES caso(caso_id));"""


def test_ddl_reference_and_mutants():
    assert all(ddl_checks(GOOD_DDL).values())
    no_pk=GOOD_DDL.replace("caso_id INTEGER PRIMARY KEY","caso_id INTEGER",1)
    no_fk=GOOD_DDL.replace(",FOREIGN KEY(caso_id) REFERENCES caso(caso_id)","")
    no_nn=GOOD_DDL.replace("tipo TEXT NOT NULL","tipo TEXT",1)
    no_check=GOOD_DDL.replace(" CHECK(minutos_desde_anterior>=0)","")
    rigid=GOOD_DDL.replace("estado TEXT NOT NULL,barrio", "estado TEXT NOT NULL CHECK(estado IN ('Abierto','En_proceso','Cerrado')),barrio",1)
    assert ddl_checks(no_pk)["d1"] is False
    assert ddl_checks(no_fk)["d3"] is False
    assert ddl_checks(no_nn)["d4"] is False
    assert ddl_checks(no_check)["d5"] is False
    assert ddl_checks(rigid)["d6"] is False


def test_v5_interface_contract():
    html=(ROOT/"evaluador-s15-v5.html").read_text(encoding="utf-8")
    js=(ROOT/"assets/learning/s15-autograder-v5.js").read_text(encoding="utf-8")
    css=(ROOT/"assets/learning/s15-workbench-v5.css").read_text(encoding="utf-8")
    assert "s15-workbench-v5" in js
    assert "Dominio 80" in html and "Transferencia 20" in html
    assert "Mutation Hunter" in html and "SQL Debug Arena" in html and "Boss Transfer" in html
    assert "Ayuda progresiva" in js and "parsons" in js.lower()
    assert "reference:`" not in js and "ROW_NUMBER() OVER(\n" not in js, "No publiques las soluciones SQL de referencia"
    assert "type=\"radio\"" not in html.lower()
    assert "data-kind" in js and "data-role" in html and "data-star" in html
    assert "min-height:44px" in css and "font-size:16px" in css
    assert "sensor_events.json" in html and "estado final" in html
    assert "server-side" in html.lower()


def test_presentation_v5_contract():
    p=ROOT/"Presentaciones/M6/sesion-15-desafio-final-v5.html"
    r=ROOT/"revision/Presentaciones/M6/sesion-15-desafio-final-v5.html"
    text=p.read_text(encoding="utf-8")
    if r.exists(): assert text==r.read_text(encoding="utf-8")
    assert "80" in text and "20" in text and "Mutation Hunter" in text and "Boss Transfer" in text
    no_scripts=re.sub(r"<script[\s\S]*?</script>","",text,flags=re.I)
    visible=re.findall(r"\b\d+\s*(?:minutos|min)\b",no_scripts,flags=re.I)
    assert visible==["15 minutos","15 minutos"], visible
    assert "/ANDESDB/evaluador-s15-v5.html" in text


def test_legacy_redirects():
    ev=(ROOT/"evaluador-s15.html").read_text(encoding="utf-8")
    pr=(ROOT/"Presentaciones/M6/sesion-15-desafio-final.html").read_text(encoding="utf-8")
    assert "evaluador-s15-v5.html" in ev
    assert "sesion-15-desafio-final-v5.html" in pr


if __name__=="__main__":
    test_query_mutants_are_killed();test_ddl_reference_and_mutants();test_v5_interface_contract();test_presentation_v5_contract();test_legacy_redirects();print("S15 v5: contratos y mutation tests OK")
