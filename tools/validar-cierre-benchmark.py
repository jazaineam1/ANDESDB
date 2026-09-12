from __future__ import annotations

import csv
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def read(rel: str) -> str:
    p = ROOT / rel
    if not p.exists():
        err(f"Falta {rel}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")


def require(text: str, tokens: list[str], label: str) -> None:
    low = text.casefold()
    for token in tokens:
        if token.casefold() not in low:
            err(f"{label}: falta {token!r}")


def forbid(text: str, tokens: list[str], label: str) -> None:
    low = text.casefold()
    for token in tokens:
        if token.casefold() in low:
            err(f"{label}: contiene residuo {token!r}")


def same_as_main(path: str) -> None:
    proc = subprocess.run(["git", "diff", "--quiet", "origin/main", "--", path], cwd=ROOT, check=False)
    if proc.returncode != 0:
        err(f"Curación: {path} debería permanecer idéntico a main")


def validate_final_dataset() -> None:
    cases_path = ROOT / "Plantillas/proyecto-final/Datos/casos.csv"
    events_path = ROOT / "Plantillas/proyecto-final/Datos/eventos.csv"
    evidence_path = ROOT / "Plantillas/proyecto-final/Datos/evidencias.json"
    if not cases_path.exists() or not events_path.exists() or not evidence_path.exists():
        err("S15: falta al menos uno de los tres archivos de datos")
        return

    with cases_path.open(encoding="utf-8", newline="") as fh:
        cases = list(csv.DictReader(fh))
    with events_path.open(encoding="utf-8", newline="") as fh:
        events = list(csv.DictReader(fh))
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))

    expected = {
        "casos": 12,
        "eventos": 24,
        "cerrados": 4,
        "alta": 5,
        "alta_cerrado": 2,
        "evidencias": 4,
    }
    actual = {
        "casos": len(cases),
        "eventos": len(events),
        "cerrados": sum(r["estado"] == "Cerrado" for r in cases),
        "alta": sum(r["prioridad"] == "Alta" for r in cases),
        "alta_cerrado": sum(r["prioridad"] == "Alta" and r["estado"] == "Cerrado" for r in cases),
        "evidencias": len(evidence),
    }
    for key, value in expected.items():
        if actual[key] != value:
            err(f"S15 datos: {key}={actual[key]}, esperado={value}")

    case_ids = {r["caso_id"] for r in cases}
    orphan_events = [r["evento_id"] for r in events if r["caso_id"] not in case_ids]
    if orphan_events:
        err(f"S15 datos: eventos huérfanos {orphan_events}")


def main() -> int:
    # Las sesiones maduras no se auto-reescriben en esta rama.
    for path in [
        "Presentaciones/M2/sesion-2-bases-de-datos-y-primeras-consultas.html",
        "Presentaciones/M2/sesion-3-filtros-y-agregaciones.html",
        "Presentaciones/M2/sesion-4-uniones-de-tablas.html",
        "Presentaciones/M2/sesion-5-algoritmica-de-tablas.html",
        "Presentaciones/M3/sesion-6-reglas-de-negocio.html",
        "Presentaciones/M3/sesion-8-modelado-y-normalizacion.html",
        "Presentaciones/M3/sesion-9-ddl-supabase.html",
        "Presentaciones/M4/sesion-10-sql-o-nosql.html",
        "Presentaciones/M4/sesion-11-documentos-de-verdad.html",
        "Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html",
    ]:
        same_as_main(path)

    s1 = read("Presentaciones/M1/sesion-1-diagnostico.html")
    require(s1, [
        "Cinco preguntas que repetiremos en S16", "Dato no es valor", "Archivo vs base",
        "DBA", "Data engineer", "Data analyst", "dvdrental.db",
        'href="sesion-1-diagnostico.html"'
    ], "S1")
    forbid(s1, ["sesion-12-fundamentos-data-warehouse.html"], "S1 descarga")

    s7 = read("Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html")
    require(s7, ["Criterio de salida"], "S7")

    s13 = read("Presentaciones/M5/sesion-13-laboratorio-bigquery.html")
    require(s13, [
        "Particionar", "PARTITION BY", "partition pruning", "Clusterización", "CLUSTER BY",
        "bytes", "Creating Date-Partitioned Tables in BigQuery",
        "Performance and Cost Optimization with BigQuery", "9", "4",
        'href="sesion-13-laboratorio-bigquery.html"', "learning-core.js"
    ], "S13")
    forbid(s13, ["fact_venta.csv · 44 filas"], "S13 no debe repetir S12 como tema central")

    s14 = read("Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html")
    require(s14, [
        "ARRAY", "STRUCT", "UNNEST", "CSV", "JSON", "Parquet",
        "Laboratorio 1", "Taller proyecto integrador", "Lab 2",
        "548383", "562904", "575654",
        "Azure Blob Storage", "Azure Cosmos DB",
        'href="sesion-14-bigquery-anidados-mapa-azure.html"', "learning-core.js"
    ], "S14")

    validate_final_dataset()
    read("Plantillas/proyecto-final/criterios.md")
    s15 = read("Presentaciones/M6/sesion-15-desafio-final.html")
    require(s15, [
        "Atención de incidentes urbanos", "casos cerrados", "Code ownership",
        "Pruebas negativas", "90 s por equipo", 'href="sesion-15-desafio-final.html"',
        "learning-core.js"
    ], "S15")
    forbid(s15, ["sesion-12-fundamentos-data-warehouse.html"], "S15 descarga")

    s16 = read("Presentaciones/M6/sesion-16-cierre-dp900.html")
    require(s16, [
        "cinco preguntas de S1", "25–30%", "20–25%", "15–20%",
        "Escenarios 1–3", "Escenarios 4–6", "Escenarios 7–8",
        "Escenarios 9–11", "Escenarios 12–13", "Clasifica el error",
        'href="sesion-16-cierre-dp900.html"'
    ], "S16")
    forbid(s16, ["sesion-12-fundamentos-data-warehouse.html", 'data-title="Mapa del curso"'], "S16")

    course = json.loads(read("tools/curso.json") or "{}")
    m1 = next((m for m in course.get("modulos", []) if m.get("n") == 1), {})
    s1_manifest = next((s for s in m1.get("sesiones", []) if s.get("n") == 1), None)
    if not s1_manifest:
        err("curso.json: S1 no está registrada como sesión")
    else:
        for key in ["fecha", "duracionUtil", "modo", "titulo", "href", "tags"]:
            if not s1_manifest.get(key):
                err(f"curso.json S1: falta {key}")

    if ERRORS:
        print("\n=== Curación benchmark: FALLÓ ===")
        for e in ERRORS:
            print("  ✗", e)
        return 1
    print("\n=== Curación benchmark: OK ===")
    print("  ✓ sesiones maduras protegidas, sesiones nuevas sustantivas y datos finales reproducibles")
    return 0


if __name__ == "__main__":
    sys.exit(main())
