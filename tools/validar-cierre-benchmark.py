from __future__ import annotations

import csv
import json
import re
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


def section(text: str, heading: str) -> str:
    match = re.search(
        rf"^## {re.escape(heading)}\s*\n(.*?)(?=^## |\Z)",
        text,
        flags=re.M | re.S,
    )
    return match.group(1).strip() if match else ""


def validate_instructor_guides() -> None:
    required_headings = [
        "Pregunta central", "Hilo conductor", "Error esperable principal",
        "Dónde probablemente se atascan", "No avanzar hasta que…", "Evidencia mínima",
        "Si vas 15 minutos atrasado", "Si vas 15 minutos adelantado",
        "Intervención docente", "Regla de cierre",
    ]
    seen_questions: set[str] = set()
    seen_stuck: set[str] = set()
    seen_interventions: set[str] = set()
    for n in range(1, 17):
        rel = f"docs/instructor/S{n:02d}.md"
        guide = read(rel)
        require(guide, [f"# S{n:02d} · Guía docente"], f"Guía S{n:02d}")
        for heading in required_headings:
            if not section(guide, heading):
                err(f"Guía S{n:02d}: falta sección sustantiva {heading!r}")
        if len(guide) < 1100:
            err(f"Guía S{n:02d}: demasiado breve para ser una guía útil ({len(guide)} caracteres)")
        question = section(guide, "Pregunta central").casefold()
        stuck = section(guide, "Dónde probablemente se atascan").casefold()
        intervention = section(guide, "Intervención docente").casefold()
        if question in seen_questions:
            err(f"Guía S{n:02d}: pregunta central duplicada")
        if stuck in seen_stuck:
            err(f"Guía S{n:02d}: bloque de atascos duplicado")
        if intervention in seen_interventions:
            err(f"Guía S{n:02d}: intervención docente duplicada")
        seen_questions.add(question)
        seen_stuck.add(stuck)
        seen_interventions.add(intervention)


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
        reader = csv.DictReader(fh)
        events = list(reader)
        event_columns = set(reader.fieldnames or [])
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))

    required_event_columns = {
        "evento_id", "caso_id", "fecha_evento", "tipo_evento",
        "estado_anterior", "estado_nuevo", "agente_id", "minutos_desde_anterior",
        "canal_evento", "os", "dispositivo", "navegador", "ip_origen",
        "localidad_evento", "latitud", "longitud", "payload_bytes",
        "latencia_ms", "resultado", "http_status",
    }
    missing_columns = sorted(required_event_columns - event_columns)
    if missing_columns:
        err(f"S15 datos: eventos.csv perdió columnas requeridas {missing_columns}")

    expected = {
        "casos": 12,
        "eventos": 24,
        "cerrados": 4,
        "alta": 5,
        "alta_cerrado": 2,
        "evidencias": 4,
        "errores_evento": 2,
        "sin_ip": 2,
        "creaciones": 12,
    }
    actual = {
        "casos": len(cases),
        "eventos": len(events),
        "cerrados": sum(r["estado"] == "Cerrado" for r in cases),
        "alta": sum(r["prioridad"] == "Alta" for r in cases),
        "alta_cerrado": sum(r["prioridad"] == "Alta" and r["estado"] == "Cerrado" for r in cases),
        "evidencias": len(evidence),
        "errores_evento": sum(r.get("resultado") == "Error" for r in events),
        "sin_ip": sum(not (r.get("ip_origen") or "").strip() for r in events),
        "creaciones": sum(r.get("tipo_evento") == "creacion" for r in events),
    }
    for key, value in expected.items():
        if actual[key] != value:
            err(f"S15 datos: {key}={actual[key]}, esperado={value}")

    case_ids = {r["caso_id"] for r in cases}
    orphan_events = [r["evento_id"] for r in events if r["caso_id"] not in case_ids]
    if orphan_events:
        err(f"S15 datos: eventos huérfanos {orphan_events}")

    missing_ip_wrong_channel = [
        r["evento_id"] for r in events
        if not (r.get("ip_origen") or "").strip() and r.get("canal_evento") != "Telefono"
    ]
    if missing_ip_wrong_channel:
        err(f"S15 datos: IP ausente fuera de Telefono {missing_ip_wrong_channel}")

    allowed_ip_prefixes = ("192.0.2.", "198.51.100.", "203.0.113.", "2001:db8:")
    unsafe_ips = [
        r["evento_id"] for r in events
        if (r.get("ip_origen") or "").strip()
        and not r["ip_origen"].startswith(allowed_ip_prefixes)
    ]
    if unsafe_ips:
        err(f"S15 datos: IP fuera de rangos reservados para documentación {unsafe_ips}")

    file_evidence = [
        item
        for doc in evidence
        for item in doc.get("evidencias", [])
        if item.get("tipo") in {"foto", "video"}
    ]
    if not file_evidence:
        err("S15 datos: evidencias.json no contiene archivos foto/video")
    for item in file_evidence:
        for field in ["archivo", "mime_type", "tamano_bytes"]:
            if field not in item:
                err(f"S15 datos: evidencia {item.get('evidencia_id', '?')} sin {field}")


def validate_course_s13(course: dict) -> None:
    sessions = [s for m in course.get("modulos", []) for s in m.get("sesiones", [])]
    s13 = next((s for s in sessions if s.get("n") == 13), None)
    if not s13:
        err("curso.json: falta S13")
        return
    if s13.get("duracionUtil") != 165:
        err(f"curso.json S13: duración debe ser 165, no {s13.get('duracionUtil')!r}")
    resources = " ".join(str(r.get("href", "")) for r in s13.get("recursos", []))
    for token in ["paths/420", "562865", "562975"]:
        if token not in resources:
            err(f"curso.json S13: falta recurso M5C2 {token}")


def main() -> int:
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
    require(s1, ["Cinco preguntas que repetiremos en S16", "Dato no es valor", "Archivo vs base", "DBA", "Data engineer", "Data analyst", "dvdrental.db", 'href="sesion-1-diagnostico.html"'], "S1")
    forbid(s1, ["sesion-12-fundamentos-data-warehouse.html"], "S1 descarga")

    s7 = read("Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html")
    require(s7, ["Criterio de salida"], "S7")

    s13 = read("Presentaciones/M5/sesion-13-laboratorio-bigquery.html")
    require(s13, [
        "BigQuery Sandbox", "PARTITION BY", "partition pruning", "Clusterización", "CLUSTER BY", "bytes",
        "paths/420", "562865", "562975", "575654", "9", "4",
        "modificar o retirar la especificación de clustering",
        "Una tabla no particionada no se convierte directamente en particionada",
        'href="sesion-13-laboratorio-bigquery.html"', "learning-core.js"
    ], "S13")
    forbid(s13, ["fact_venta.csv · 44 filas", "Ni partición ni clusterización se agregan después"], "S13 residuos")

    s14 = read("Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html")
    require(s14, ["ARRAY", "STRUCT", "UNNEST", "CSV", "JSON", "Parquet", "Laboratorio 1", "Taller proyecto integrador", "Lab 2", "548383", "562904", "575654", "Azure Blob Storage", "Azure Cosmos DB", 'href="sesion-14-bigquery-anidados-mapa-azure.html"', "learning-core.js"], "S14")

    validate_final_dataset()
    read("Plantillas/proyecto-final/criterios.md")
    s15 = read("Presentaciones/M6/sesion-15-desafio-final.html")
    require(s15, [
        "Atención de incidentes urbanos", "casos cerrados", "Code ownership", "90 s por equipo",
        "Anatomía del evento", "payload_bytes", "latencia_ms", "Debe fallar",
        'href="sesion-15-desafio-final.html"', "learning-core.js"
    ], "S15")
    forbid(s15, ["sesion-12-fundamentos-data-warehouse.html"], "S15 descarga")

    s16 = read("Presentaciones/M6/sesion-16-cierre-dp900.html")
    require(s16, ["cinco preguntas de S1", "25–30%", "20–25%", "15–20%", "Escenarios 1–3", "Escenarios 4–6", "Escenarios 7–8", "Escenarios 9–11", "Escenarios 12–13", "Clasifica el error", 'href="sesion-16-cierre-dp900.html"'], "S16")
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
    validate_course_s13(course)
    validate_instructor_guides()

    if ERRORS:
        print("\n=== Curación benchmark: FALLÓ ===")
        for e in ERRORS:
            print("  ✗", e)
        return 1
    print("\n=== Curación benchmark: OK ===")
    print("  ✓ sesiones maduras protegidas, S13 alineada a M5C2, dataset S15 trazable y guías específicas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
