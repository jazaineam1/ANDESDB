# -*- coding: utf-8 -*-
"""Pruebas deterministas del evaluador automático de la Sesión 15."""
from __future__ import annotations

import csv
import json
import re
import sqlite3
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "Plantillas" / "proyecto-final" / "Datos"


def read_csv(name: str) -> list[dict[str, str]]:
    with (DATA / name).open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def load_data() -> dict:
    return {
        "casos": read_csv("casos.csv"),
        "eventos": read_csv("eventos.csv"),
        "evidencias": json.loads((DATA / "evidencias.json").read_text(encoding="utf-8")),
    }


def variants(base: dict) -> list[dict]:
    v0 = deepcopy(base)
    v1 = deepcopy(base)
    v1["casos"].append({
        "caso_id": "1013", "fecha_creacion": "2026-08-11", "ciudadano_id": "C013",
        "tipo": "Alumbrado", "prioridad": "Alta", "estado": "Abierto", "canal": "Web", "barrio": "Bosa",
    })
    v1["eventos"].extend([
        {"evento_id": "E025", "caso_id": "1013", "fecha_evento": "2026-08-11 08:00", "estado": "Abierto", "agente_id": "A06", "minutos_desde_anterior": "0"},
        {"evento_id": "E026", "caso_id": "1002", "fecha_evento": "2026-08-02 12:00", "estado": "Abierto", "agente_id": "A02", "minutos_desde_anterior": "60"},
    ])
    v2 = deepcopy(base)
    next(c for c in v2["casos"] if c["caso_id"] == "1010")["estado"] = "Cerrado"
    v2["eventos"].append({"evento_id": "E027", "caso_id": "1010", "fecha_evento": "2026-08-09 12:30", "estado": "Cerrado", "agente_id": "A03", "minutos_desde_anterior": "300"})
    next(c for c in v2["casos"] if c["caso_id"] == "1003")["estado"] = "Escalado"
    v2["eventos"].append({"evento_id": "E028", "caso_id": "1003", "fecha_evento": "2026-08-03 12:00", "estado": "Escalado", "agente_id": "A04", "minutos_desde_anterior": "230"})
    return [v0, v1, v2]


def source_db(data: dict) -> sqlite3.Connection:
    con = sqlite3.connect(":memory:")
    con.executescript("""
    CREATE TABLE casos_src(caso_id INTEGER,fecha_creacion TEXT,ciudadano_id TEXT,tipo TEXT,prioridad TEXT,estado TEXT,canal TEXT,barrio TEXT);
    CREATE TABLE eventos_src(evento_id TEXT,caso_id INTEGER,fecha_evento TEXT,estado TEXT,agente_id TEXT,minutos_desde_anterior INTEGER);
    """)
    con.executemany("INSERT INTO casos_src VALUES(?,?,?,?,?,?,?,?)", [
        (int(r["caso_id"]), r["fecha_creacion"], r.get("ciudadano_id"), r["tipo"], r["prioridad"], r["estado"], r.get("canal"), r["barrio"])
        for r in data["casos"]
    ])
    con.executemany("INSERT INTO eventos_src VALUES(?,?,?,?,?,?)", [
        (r["evento_id"], int(r["caso_id"]), r["fecha_evento"], r["estado"], r.get("agente_id"), int(r["minutos_desde_anterior"]))
        for r in data["eventos"]
    ])
    return con


REFERENCE_DDL = """
CREATE TABLE caso(
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
  minutos_desde_anterior INTEGER NOT NULL CHECK(minutos_desde_anterior >= 0),
  FOREIGN KEY(caso_id) REFERENCES caso(caso_id)
);
"""

REFERENCE_QUERIES = {
    "q1": """
        SELECT barrio, COUNT(*) AS casos_alta
        FROM casos_src
        WHERE prioridad = 'Alta'
        GROUP BY barrio
    """,
    "q2": """
        WITH ult AS (
          SELECT caso_id, estado,
                 ROW_NUMBER() OVER(PARTITION BY caso_id ORDER BY fecha_evento DESC, evento_id DESC) AS rn
          FROM eventos_src
        )
        SELECT c.caso_id, c.estado AS estado_actual, u.estado AS ultimo_estado
        FROM casos_src c
        JOIN ult u ON u.caso_id = c.caso_id AND u.rn = 1
    """,
    "q3": """
        WITH ult AS (
          SELECT caso_id, estado,
                 ROW_NUMBER() OVER(PARTITION BY caso_id ORDER BY fecha_evento DESC, evento_id DESC) AS rn
          FROM eventos_src
        ), cerrados AS (
          SELECT caso_id FROM ult WHERE rn = 1 AND estado = 'Cerrado'
        )
        SELECT e.caso_id, SUM(e.minutos_desde_anterior) AS minutos_hasta_cierre
        FROM eventos_src e
        JOIN cerrados c ON c.caso_id = e.caso_id
        GROUP BY e.caso_id
    """,
    "q4": """
        SELECT COUNT(DISTINCT c.caso_id) AS total_casos,
               COUNT(e.evento_id) AS total_eventos,
               COUNT(DISTINCT CASE WHEN c.prioridad = 'Alta' THEN c.caso_id END) AS casos_alta
        FROM casos_src c
        LEFT JOIN eventos_src e ON e.caso_id = c.caso_id
    """,
}


def expected(data: dict, task: str):
    if task == "q1":
        counts: dict[str, int] = {}
        for c in data["casos"]:
            if c["prioridad"] == "Alta":
                counts[c["barrio"]] = counts.get(c["barrio"], 0) + 1
        return sorted(counts.items())
    if task == "q2":
        out = []
        for c in data["casos"]:
            ev = sorted((e for e in data["eventos"] if e["caso_id"] == c["caso_id"]), key=lambda e: (e["fecha_evento"], e["evento_id"]))
            out.append((int(c["caso_id"]), c["estado"], ev[-1]["estado"] if ev else None))
        return sorted(out)
    if task == "q3":
        out = []
        for c in data["casos"]:
            ev = sorted((e for e in data["eventos"] if e["caso_id"] == c["caso_id"]), key=lambda e: (e["fecha_evento"], e["evento_id"]))
            if ev and ev[-1]["estado"] == "Cerrado":
                out.append((int(c["caso_id"]), sum(int(e["minutos_desde_anterior"]) for e in ev)))
        return sorted(out)
    if task == "q4":
        return [(len(data["casos"]), len(data["eventos"]), sum(c["prioridad"] == "Alta" for c in data["casos"]))]
    raise AssertionError(task)


def test_reference_ddl() -> None:
    con = sqlite3.connect(":memory:")
    con.execute("PRAGMA foreign_keys=ON")
    con.executescript(REFERENCE_DDL)
    valid_case = (9001, "2026-09-01", "Alumbrado", "Alta", "Abierto", "Prueba")
    con.execute("INSERT INTO caso VALUES(?,?,?,?,?,?)", valid_case)
    con.execute("INSERT INTO evento VALUES(?,?,?,?,?)", ("T001", 9001, "2026-09-01 10:00", "Abierto", 0))
    checks = [
        ("INSERT INTO caso VALUES(9001,'2026-09-01','Alumbrado','Alta','Abierto','Prueba')", True),
        ("INSERT INTO evento VALUES('ORPH',999999,'2026-09-01 11:00','Abierto',0)", True),
        ("INSERT INTO caso VALUES(9002,'2026-09-01',NULL,'Media','Abierto','Prueba')", True),
        ("INSERT INTO evento VALUES('NEG1',9001,'2026-09-01 12:00','Abierto',-1)", True),
    ]
    for sql, should_fail in checks:
        try:
            con.execute(sql)
            failed = False
        except sqlite3.IntegrityError:
            failed = True
        assert failed == should_fail, sql
    con.execute("INSERT INTO caso VALUES(9003,'2026-09-01','Semaforo','Alta','Escalado','Prueba')")
    con.execute("INSERT INTO evento VALUES('EVOL1',9003,'2026-09-01 13:00','Escalado',10)")
    con.close()


def test_reference_queries() -> None:
    base = load_data()
    assert (len(base["casos"]), len(base["eventos"]), len(base["evidencias"])) == (12, 24, 4)
    for data in variants(base):
        con = source_db(data)
        for task, sql in REFERENCE_QUERIES.items():
            cur = con.execute(sql)
            got = sorted(cur.fetchall()) if task != "q4" else cur.fetchall()
            assert got == expected(data, task), f"{task}: {got} != {expected(data, task)}"
        con.close()


def test_presentation_contract() -> None:
    public = (ROOT / "Presentaciones/M6/sesion-15-desafio-final.html").read_text(encoding="utf-8")
    review = (ROOT / "revision/Presentaciones/M6/sesion-15-desafio-final.html").read_text(encoding="utf-8")
    assert public == review, "S15 pública y revision deben ser idénticas"
    assert "/ANDESDB/evaluador-s15.html" in public
    visible_times = re.findall(r"\b\d+\s*(?:minutos|min)\b", re.sub(r"<script[\s\S]*?</script>", "", public, flags=re.I))
    assert visible_times == ["15 minutos"], f"Minutaje visible inesperado: {visible_times}"


def main() -> int:
    test_reference_ddl()
    test_reference_queries()
    test_presentation_contract()
    print("S15 autograder: referencia, variantes y contrato visual OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
