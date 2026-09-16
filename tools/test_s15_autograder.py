# -*- coding: utf-8 -*-
"""Pruebas deterministas del S15 Workbench.

No intenta simular el DOM completo. Protege el contrato pedagógico y técnico:
7 estaciones, 37 checkpoints, 100 puntos, seis pruebas DDL, cinco consultas que
sobreviven a variaciones y ausencia de selección múltiple en la interfaz.
"""
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
        "tipo": "Alumbrado", "prioridad": "Alta", "estado": "Abierto",
        "canal": "Web", "barrio": "Bosa",
    })
    v1["eventos"].extend([
        {"evento_id": "E025", "caso_id": "1013", "fecha_evento": "2026-08-11 08:00", "estado": "Abierto", "agente_id": "A06", "minutos_desde_anterior": "0"},
        {"evento_id": "E026", "caso_id": "1002", "fecha_evento": "2026-08-02 12:00", "estado": "Abierto", "agente_id": "A02", "minutos_desde_anterior": "60"},
    ])

    v2 = deepcopy(base)
    next(c for c in v2["casos"] if c["caso_id"] == "1010")["estado"] = "Cerrado"
    v2["eventos"].append({
        "evento_id": "E027", "caso_id": "1010", "fecha_evento": "2026-08-09 12:30",
        "estado": "Cerrado", "agente_id": "A03", "minutos_desde_anterior": "300",
    })
    next(c for c in v2["casos"] if c["caso_id"] == "1003")["estado"] = "Escalado"
    v2["eventos"].append({
        "evento_id": "E028", "caso_id": "1003", "fecha_evento": "2026-08-03 12:00",
        "estado": "Escalado", "agente_id": "A04", "minutos_desde_anterior": "230",
    })
    # Caso sin eventos: fuerza LEFT JOIN correcto en Q2 y Q5.
    v2["casos"].append({
        "caso_id": "1014", "fecha_creacion": "2026-08-12", "ciudadano_id": "C014",
        "tipo": "Basuras", "prioridad": "Media", "estado": "Abierto",
        "canal": "App", "barrio": "Fontibon",
    })
    return [v0, v1, v2]


def chaos_variant(base: dict) -> dict:
    v = deepcopy(base)
    v["casos"].append({
        "caso_id": "1015", "fecha_creacion": "2026-08-13", "ciudadano_id": "C015",
        "tipo": "Ruido", "prioridad": "Alta", "estado": "Cerrado",
        "canal": "App", "barrio": "Suba",
    })
    v["eventos"].extend([
        {"evento_id": "E101", "caso_id": "1015", "fecha_evento": "2026-08-13 08:00", "estado": "Abierto", "agente_id": "A07", "minutos_desde_anterior": "0"},
        {"evento_id": "E102", "caso_id": "1015", "fecha_evento": "2026-08-13 09:00", "estado": "En_proceso", "agente_id": "A07", "minutos_desde_anterior": "60"},
        {"evento_id": "E103", "caso_id": "1015", "fecha_evento": "2026-08-13 12:30", "estado": "Cerrado", "agente_id": "A07", "minutos_desde_anterior": "210"},
    ])
    next(c for c in v["casos"] if c["caso_id"] == "1005")["estado"] = "Cerrado"
    v["eventos"].append({
        "evento_id": "E104", "caso_id": "1005", "fecha_evento": "2026-08-04 18:00",
        "estado": "Cerrado", "agente_id": "A01", "minutos_desde_anterior": "465",
    })
    return v


def source_db(data: dict) -> sqlite3.Connection:
    con = sqlite3.connect(":memory:")
    con.executescript("""
    CREATE TABLE casos_src(
      caso_id INTEGER, fecha_creacion TEXT, ciudadano_id TEXT, tipo TEXT,
      prioridad TEXT, estado TEXT, canal TEXT, barrio TEXT
    );
    CREATE TABLE eventos_src(
      evento_id TEXT, caso_id INTEGER, fecha_evento TEXT, estado TEXT,
      agente_id TEXT, minutos_desde_anterior INTEGER
    );
    """)
    con.executemany("INSERT INTO casos_src VALUES(?,?,?,?,?,?,?,?)", [
        (int(r["caso_id"]), r["fecha_creacion"], r.get("ciudadano_id"), r["tipo"],
         r["prioridad"], r["estado"], r.get("canal"), r["barrio"])
        for r in data["casos"]
    ])
    con.executemany("INSERT INTO eventos_src VALUES(?,?,?,?,?,?)", [
        (r["evento_id"], int(r["caso_id"]), r["fecha_evento"], r["estado"],
         r.get("agente_id"), int(r["minutos_desde_anterior"]))
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
                 ROW_NUMBER() OVER(
                   PARTITION BY caso_id
                   ORDER BY fecha_evento DESC, evento_id DESC
                 ) AS rn
          FROM eventos_src
        )
        SELECT c.caso_id, c.estado AS estado_actual, u.estado AS ultimo_estado
        FROM casos_src c
        LEFT JOIN ult u ON u.caso_id = c.caso_id AND u.rn = 1
    """,
    "q3": """
        WITH ult AS (
          SELECT caso_id, estado,
                 ROW_NUMBER() OVER(
                   PARTITION BY caso_id
                   ORDER BY fecha_evento DESC, evento_id DESC
                 ) AS rn
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
    "q5": """
        WITH por_caso AS (
          SELECT c.caso_id, c.tipo,
                 COALESCE(SUM(e.minutos_desde_anterior), 0) AS total_minutos
          FROM casos_src c
          LEFT JOIN eventos_src e ON e.caso_id = c.caso_id
          GROUP BY c.caso_id, c.tipo
        )
        SELECT tipo,
               COUNT(*) AS casos,
               ROUND(AVG(total_minutos), 1) AS promedio_minutos
        FROM por_caso
        GROUP BY tipo
    """,
}


def normalize(rows):
    def nv(v):
        return round(v, 6) if isinstance(v, float) else v
    return sorted(tuple(nv(v) for v in row) for row in rows)


def test_reference_ddl() -> None:
    con = sqlite3.connect(":memory:")
    con.execute("PRAGMA foreign_keys=ON")
    con.executescript(REFERENCE_DDL)

    caso_info = {r[1]: r for r in con.execute("PRAGMA table_info(caso)")}
    evento_info = {r[1]: r for r in con.execute("PRAGMA table_info(evento)")}
    assert caso_info["caso_id"][5] > 0
    assert evento_info["evento_id"][5] > 0
    for col in ("fecha_creacion", "tipo", "prioridad", "estado", "barrio"):
        assert caso_info[col][3] == 1, f"caso.{col} debe ser NOT NULL"
    for col in ("caso_id", "fecha_evento", "estado", "minutos_desde_anterior"):
        assert evento_info[col][3] == 1, f"evento.{col} debe ser NOT NULL"

    fks = list(con.execute("PRAGMA foreign_key_list(evento)"))
    assert any(r[2] == "caso" and r[3] == "caso_id" and r[4] == "caso_id" for r in fks)

    con.execute("INSERT INTO caso VALUES(9001,'2026-09-01','Alumbrado','Alta','Abierto','Prueba')")
    con.execute("INSERT INTO evento VALUES('T001',9001,'2026-09-01 10:00','Abierto',0)")

    must_fail = [
        "INSERT INTO caso VALUES(9001,'2026-09-01','Alumbrado','Alta','Abierto','Prueba')",
        "INSERT INTO evento VALUES('T001',9001,'2026-09-01 10:05','Abierto',5)",
        "INSERT INTO evento VALUES('ORPH',999999,'2026-09-01 11:00','Abierto',0)",
        "INSERT INTO caso VALUES(9002,'2026-09-01',NULL,'Media','Abierto','Prueba')",
        "INSERT INTO evento VALUES('NEG1',9001,'2026-09-01 12:00','Abierto',-1)",
    ]
    for sql in must_fail:
        try:
            con.execute(sql)
        except sqlite3.IntegrityError:
            pass
        else:
            raise AssertionError(f"Debía fallar: {sql}")

    # Evolución legítima del dominio.
    con.execute("INSERT INTO caso VALUES(9003,'2026-09-01','Semaforo','Alta','Escalado','Prueba')")
    con.execute("INSERT INTO evento VALUES('EVOL1',9003,'2026-09-01 13:00','Escalado',10)")
    con.close()


def test_reference_queries() -> None:
    base = load_data()
    assert (len(base["casos"]), len(base["eventos"]), len(base["evidencias"])) == (12, 24, 4)
    scenarios = variants(base) + [chaos_variant(base)]
    for i, data in enumerate(scenarios):
        con = source_db(data)
        for task, sql in REFERENCE_QUERIES.items():
            got = normalize(con.execute(sql).fetchall())
            # Ejecutar de nuevo como oráculo independiente de la consulta del alumno.
            expected = normalize(con.execute(REFERENCE_QUERIES[task]).fetchall())
            assert got == expected, f"escenario {i} {task}: {got} != {expected}"
        con.close()


def test_workbench_contract() -> None:
    html = (ROOT / "evaluador-s15.html").read_text(encoding="utf-8")
    js = (ROOT / "assets/learning/s15-autograder.js").read_text(encoding="utf-8")
    css = (ROOT / "assets/learning/s15-workbench.css").read_text(encoding="utf-8")

    assert "S15 Workbench" in html
    assert "7 estaciones" in html
    assert "37 checkpoints" in html
    assert 'type="radio"' not in html.lower(), "S15 no debe volver a selección múltiple"
    for mission in range(1, 8):
        assert f'id="m{mission}"' in html, f"Falta estación m{mission}"
    for token in (
        "Inspector de datos", "Modelador ER", "Flow Builder", "DDL Lab",
        "SQL Debug Arena", "Star Builder", "Chaos / Change Lab",
    ):
        assert token in html, f"Falta herramienta visible: {token}"

    assert "s15-workbench-v3" in js
    assert "draggable" in html and "dragstart" in js and "drop" in js
    assert "q5" in js and "promedio_minutos" in js
    assert "runChaos" in js and "chaosVariant" in js
    assert "generateDDLFromModel" in js
    assert ".flow-board" in css and ".entity-board" in css and ".chaos-grid" in css


def test_presentation_contract() -> None:
    public = (ROOT / "Presentaciones/M6/sesion-15-desafio-final.html").read_text(encoding="utf-8")
    review = (ROOT / "revision/Presentaciones/M6/sesion-15-desafio-final.html")
    if review.exists():
        assert public == review.read_text(encoding="utf-8"), "S15 pública y revision deben ser idénticas"

    assert "/ANDESDB/evaluador-s15.html" in public
    assert "Construye. <span class=\"accent\">Rómpelo.</span> Repáralo." in public
    assert "37 checkpoints" in public
    assert public.count('class="slide') == 14, "S15 debe tener 14 diapositivas"

    no_scripts = re.sub(r"<script[\s\S]*?</script>", "", public, flags=re.I)
    visible_min = re.findall(r"\b\d+\s*(?:minutos|min)\b", no_scripts, flags=re.I)
    assert visible_min == ["15 minutos"], f"Minutaje rígido inesperado: {visible_min}"


def test_scoring_contract() -> None:
    js = (ROOT / "assets/learning/s15-autograder.js").read_text(encoding="utf-8")
    # 5 + 6 + 5 + 6 + 5 + 5 + 5 = 37 checkpoints.
    expected_ids = [
        *(f"s{i}" for i in range(1, 6)),
        *(f"m{i}" for i in range(1, 7)),
        *(f"f{i}" for i in range(1, 6)),
        *(f"d{i}" for i in range(1, 7)),
        *(f"q{i}" for i in range(1, 6)),
        *(f"st{i}" for i in range(1, 6)),
        *(f"x{i}" for i in range(1, 6)),
    ]
    assert len(expected_ids) == 37
    for cid in expected_ids:
        assert re.search(rf"\b{re.escape(cid)}\s*:", js) or f"'{cid}'" in js or f'"{cid}"' in js, f"Falta checkpoint {cid}"

    weights = {
        "source": 10, "model": 15, "flow": 15, "ddl": 15,
        "sql": 25, "star": 10, "chaos": 10,
    }
    assert sum(weights.values()) == 100


def main() -> int:
    test_reference_ddl()
    test_reference_queries()
    test_workbench_contract()
    test_presentation_contract()
    test_scoring_contract()
    print("S15 Workbench: 7 estaciones, 37 checkpoints, DDL, 5 queries, Chaos y contrato visual OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
