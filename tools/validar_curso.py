# -*- coding: utf-8 -*-
"""Control de calidad de ANDESDB.

Valida infraestructura y decisiones pedagógicas que no deberían romperse al
crear nuevas sesiones. Diseñado para ejecutarse en GitHub Actions y localmente.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
COURSE = ROOT / "tools" / "curso.json"
LEARNING = ROOT / "assets" / "learning" / "learning-plan.json"
TECHNICAL_DIFFERENTIATION = {9, 11, 12, 13, 14, 15}

ERRORS: list[str] = []
WARNINGS: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def warn(msg: str) -> None:
    WARNINGS.append(msg)


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        err(f"JSON inválido en {path.relative_to(ROOT)}: {exc}")
        return {}


def local_path(href: str) -> Path | None:
    if not href or href.startswith(("http://", "https://", "mailto:", "#", "data:")):
        return None
    clean = unquote(urlparse(href).path).lstrip("/")
    return ROOT / clean


def validate_course_manifest(course: dict) -> None:
    if course.get("totalSesiones") != 16:
        err("tools/curso.json debe declarar totalSesiones = 16")

    method = course.get("metodologia", {})
    if method.get("progresoLocal") is not False:
        err("metodologia.progresoLocal debe ser false: los estudiantes cambian de dispositivo")
    declared = set(method.get("diferenciacionTecnicaSesiones", []))
    if declared != TECHNICAL_DIFFERENTIATION:
        err(
            "diferenciacionTecnicaSesiones debe ser "
            f"{sorted(TECHNICAL_DIFFERENTIATION)}, no {sorted(declared)}"
        )

    numbers = []
    for module in course.get("modulos", []):
        for resource in module.get("recursos", []):
            p = local_path(resource.get("href", ""))
            if p and not p.exists():
                err(f"Recurso inexistente: {resource.get('href')}")
        for session in module.get("sesiones", []):
            n = session.get("n")
            numbers.append(n)
            href = session.get("href")
            if href:
                p = local_path(href)
                if p and not p.exists():
                    err(f"S{n}: href no existe: {href}")
            for resource in session.get("recursos", []):
                p = local_path(resource.get("href", ""))
                if p and not p.exists():
                    err(f"S{n}: recurso inexistente: {resource.get('href')}")
                label = str(resource.get("txt", "")).lower()
                if "heredad" in label:
                    err(f"S{n}: el material heredado no debe publicarse en la página del curso")

    duplicates = sorted({n for n in numbers if numbers.count(n) > 1})
    if duplicates:
        err(f"Sesiones repetidas en curso.json: {duplicates}")

    expected = set(range(2, 17))
    missing = sorted(expected - set(n for n in numbers if isinstance(n, int)))
    if missing:
        err(f"curso.json todavía no describe estas sesiones: {missing}")


def validate_learning_plan(plan: dict) -> None:
    sessions = plan.get("sesiones", {})
    missing = [str(n) for n in range(6, 17) if str(n) not in sessions]
    if missing:
        err(f"learning-plan.json no tiene S{', S'.join(missing)}")
        return

    for n in range(6, 17):
        s = sessions[str(n)]
        if len(s.get("dp900", [])) < 2:
            err(f"S{n}: debe tener al menos 2 micro-preguntas DP-900")
        if n in TECHNICAL_DIFFERENTIATION:
            if not s.get("nucleo") or not s.get("reto"):
                err(f"S{n}: práctica técnica debe tener base y extensión")

    for n in (7, 10, 13):
        s = sessions[str(n)]
        if s.get("trabajo_autonomo_min", 0) < 60:
            err(f"S{n}: la sesión corta requiere >=60 min de trabajo autónomo")
        solution = s.get("solucion", {})
        if solution.get("modo") != "programada" or solution.get("publicar") != "20:00":
            err(f"S{n}: la solución debe estar programada a las 20:00")

    for n in (9, 11, 13, 14):
        real = sessions[str(n)].get("servicio_real", {})
        if not real.get("requerido"):
            err(f"S{n}: debe declarar servicio cloud real como obligatorio")
        if not real.get("fallback"):
            err(f"S{n}: debe documentar fallback sin sustituir el servicio real")


def validate_published_html() -> None:
    for path in ROOT.glob("Presentaciones/M*/sesion-*.html"):
        m = re.search(r"sesion-(\d+)", path.name)
        if not m:
            continue
        n = int(m.group(1))
        text = path.read_text(encoding="utf-8", errors="replace")
        if "data-title=" not in text:
            warn(f"S{n}: {path.name} no contiene data-title")

        if n == 6 and "learning-core.js" in text:
            err("S6 no debe cargar learning-core.js ni una capa de Ruta/Núcleo-Reto")
        if n in TECHNICAL_DIFFERENTIATION and "learning-core.js" not in text:
            err(f"S{n}: la práctica técnica publicada debe cargar learning-core.js")


def validate_runtime_policies() -> None:
    learning_core = ROOT / "assets/learning/learning-core.js"
    pwa_install = ROOT / "assets/pwa-install.js"

    if learning_core.exists():
        text = learning_core.read_text(encoding="utf-8", errors="replace")
        if "localStorage" in text:
            err("learning-core.js no debe usar localStorage como expediente de progreso")

    if pwa_install.exists():
        text = pwa_install.read_text(encoding="utf-8", errors="replace")
        forbidden = ("beforeinstallprompt", "ensureInstallCard", "api-install-btn")
        found = [token for token in forbidden if token in text]
        if found:
            err(
                "La PWA no debe mostrar sugerencias propias de instalación; "
                f"se encontraron: {', '.join(found)}"
            )


def validate_required_files() -> None:
    required = [
        "manifest.webmanifest",
        "service-worker.js",
        "assets/learning/learning-core.js",
        "assets/learning/learning-plan.json",
        "assets/icons/andesdb-192.png",
        "assets/icons/andesdb-512.png",
        "assets/icons/andesdb-maskable-512.png",
        ".github/ISSUE_TEMPLATE/problema-clase.yml",
        "docs/VALIDACION-IA-PRE-PUSH.md",
        "tools/pre_push_check.py",
        "AGENTS.md",
        "CLAUDE.md",
        ".github/copilot-instructions.md",
    ]
    for item in required:
        if not (ROOT / item).exists():
            err(f"Falta archivo requerido: {item}")

    wasm = [
        "assets/vendor/sqljs/sql-wasm.js",
        "assets/vendor/sqljs/sql-wasm.wasm",
        "assets/vendor/duckdb/duckdb-browser.mjs",
        "assets/vendor/duckdb/duckdb-mvp.wasm",
        "assets/vendor/duckdb/duckdb-browser-mvp.worker.js",
    ]
    for item in wasm:
        if not (ROOT / item).exists():
            warn(f"Motor WebAssembly todavía no vendorizado: {item}")


def main() -> int:
    course = load_json(COURSE)
    plan = load_json(LEARNING)
    if course:
        validate_course_manifest(course)
    if plan:
        validate_learning_plan(plan)
    validate_published_html()
    validate_runtime_policies()
    validate_required_files()

    print("\n=== ANDESDB · control de calidad ===")
    if WARNINGS:
        print("\nAdvertencias:")
        for msg in WARNINGS:
            print("  ⚠", msg)
    if ERRORS:
        print("\nErrores:")
        for msg in ERRORS:
            print("  ✗", msg)
        print(f"\nResultado: FALLÓ ({len(ERRORS)} errores, {len(WARNINGS)} advertencias)")
        return 1
    print(f"\nResultado: OK ({len(WARNINGS)} advertencias)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
