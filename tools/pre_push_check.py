# -*- coding: utf-8 -*-
"""Pre-push obligatorio para agentes IA que modifican ANDESDB.

Ejecutar desde la raíz del repositorio:
    python tools/pre_push_check.py

No reemplaza GitHub Actions: intenta detectar antes del push los errores que
Course QA y los workflows de publicación detectarían después.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
ERRORS: list[str] = []
WARNINGS: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def warn(msg: str) -> None:
    WARNINGS.append(msg)


def run(cmd: list[str], *, capture: bool = False) -> subprocess.CompletedProcess[str] | None:
    try:
        return subprocess.run(
            cmd,
            cwd=ROOT,
            text=True,
            capture_output=capture,
            check=False,
        )
    except FileNotFoundError:
        err(f"No se encontró el comando requerido: {cmd[0]}")
        return None


def changed_files() -> list[Path]:
    names: set[str] = set()
    for cmd in (
        ["git", "diff", "--name-only", "HEAD"],
        ["git", "ls-files", "--others", "--exclude-standard"],
    ):
        p = run(cmd, capture=True)
        if p and p.returncode == 0:
            names.update(x.strip() for x in p.stdout.splitlines() if x.strip())
    return [ROOT / x for x in sorted(names)]


def check_git_hygiene() -> None:
    p = run(["git", "diff", "--check"], capture=True)
    if p and p.returncode != 0:
        err("git diff --check detectó problemas:\n" + (p.stdout + p.stderr).strip())

    for path in changed_files():
        if not path.exists() or not path.is_file():
            continue
        if path.name.startswith("~$"):
            err(f"Temporal de Office no debe publicarse: {path.relative_to(ROOT)}")
        if path.suffix.lower() in {".xlsx"} and (
            path.name.lower().startswith("encuesta") or "respuestas" in path.name.lower()
        ):
            err(f"Posibles datos personales bloqueados: {path.relative_to(ROOT)}")
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if any(mark in text for mark in ("<<<<<<<", ">>>>>>>")):
            err(f"Marcadores de conflicto en {path.relative_to(ROOT)}")


def check_high_confidence_secrets() -> None:
    patterns = {
        "AWS access key": re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"),
        "GitHub token": re.compile(r"\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b"),
        "Google API key": re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
        "Private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    }
    for path in changed_files():
        if not path.exists() or not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        rel = path.relative_to(ROOT)
        for label, rx in patterns.items():
            if rx.search(text):
                err(f"Posible secreto ({label}) en {rel}")


def check_course_validator() -> None:
    p = run([sys.executable, "tools/validar_curso.py"], capture=True)
    if p is None:
        return
    if p.returncode != 0:
        err("tools/validar_curso.py falló:\n" + (p.stdout + p.stderr).strip())
    elif "Advertencias:" in p.stdout:
        warn("tools/validar_curso.py reportó advertencias; deben revisarse antes del push.")


def check_javascript() -> None:
    candidates = [
        "assets/learning/learning-core.js",
        "assets/pwa-install.js",
        "service-worker.js",
        "Presentaciones/M3/sql-lab-s6.js",
        "assets/learning/analytics-fallback-link.js",
    ]
    for rel in candidates:
        path = ROOT / rel
        if not path.exists():
            continue
        p = run(["node", "--check", rel], capture=True)
        if p and p.returncode != 0:
            err(f"JavaScript inválido en {rel}:\n" + (p.stdout + p.stderr).strip())


def check_pedagogy_runtime() -> None:
    learning = (ROOT / "assets/learning/learning-core.js").read_text(encoding="utf-8")
    pwa = (ROOT / "assets/pwa-install.js").read_text(encoding="utf-8")

    if "localStorage" in learning:
        err("learning-core.js no debe usar localStorage como progreso del estudiante")
    for forbidden in ("beforeinstallprompt", "ensureInstallCard", "api-install-btn"):
        if forbidden in pwa:
            err(f"pwa-install.js reintroduce una sugerencia visible de instalación: {forbidden}")


def check_early_plaintext_solutions() -> None:
    plan_path = ROOT / "assets/learning/learning-plan.json"
    try:
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
    except Exception as exc:
        err(f"No se pudo leer learning-plan.json para revisar soluciones: {exc}")
        return

    now = datetime.now(ZoneInfo("America/Bogota"))
    for n, session in plan.get("sesiones", {}).items():
        solution = session.get("solucion", {})
        if solution.get("modo") != "programada":
            continue
        date = session.get("fecha")
        hour = solution.get("publicar")
        if not date or not hour:
            continue
        try:
            target = datetime.fromisoformat(f"{date}T{hour}:00").replace(tzinfo=ZoneInfo("America/Bogota"))
        except ValueError:
            continue
        public_file = ROOT / "Scripts" / f"S{n}-solucion.sql"
        if public_file.exists() and now < target:
            err(
                f"Solución S{n} está en texto plano antes de {date} {hour} America/Bogota: "
                f"{public_file.relative_to(ROOT)}"
            )


def git_diff_generated() -> str:
    p = run(["git", "diff", "--binary", "--", "index.html", "Presentaciones"], capture=True)
    return p.stdout if p and p.returncode == 0 else ""


def check_generators_do_not_add_changes() -> None:
    before = git_diff_generated()
    for cmd in (
        [sys.executable, "tools/construir-index.py"],
        [sys.executable, "tools/integrar-experiencia.py"],
    ):
        p = run(cmd, capture=True)
        if p and p.returncode != 0:
            err(f"Generador falló: {' '.join(cmd)}\n" + (p.stdout + p.stderr).strip())
            return
    after = git_diff_generated()
    if before != after:
        err(
            "Los generadores modificaron index.html o Presentaciones. "
            "Revisa esos cambios, inclúyelos si son correctos y vuelve a ejecutar el pre-push."
        )


def main() -> int:
    print("=== ANDESDB · IA PRE-PUSH ===")
    check_git_hygiene()
    check_high_confidence_secrets()
    check_course_validator()
    check_javascript()
    check_pedagogy_runtime()
    check_early_plaintext_solutions()
    check_generators_do_not_add_changes()

    if WARNINGS:
        print("\nAdvertencias:")
        for msg in WARNINGS:
            print("  ⚠", msg)
    if ERRORS:
        print("\nBloqueos:")
        for msg in ERRORS:
            print("  ✗", msg)
        print(f"\nPRE-PUSH ANDESDB: FALLÓ ({len(ERRORS)} bloqueos)")
        return 1

    print("\nPRE-PUSH ANDESDB: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
