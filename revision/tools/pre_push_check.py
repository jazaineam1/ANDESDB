# -*- coding: utf-8 -*-
"""Pre-push obligatorio para agentes IA que modifican ANDESDB/revision.

Ejecutar desde la raíz de revision/:
    python tools/pre_push_check.py

No reemplaza GitHub Actions: intenta detectar antes del push los errores que
Course QA y los workflows de publicación detectarían después.
"""
from __future__ import annotations

import hashlib
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
            encoding="utf-8",
            errors="replace",
            capture_output=capture,
            check=False,
        )
    except FileNotFoundError:
        err(f"No se encontró el comando requerido: {cmd[0]}")
        return None


def changed_files() -> list[Path]:
    names: set[str] = set()
    for cmd in (["git", "diff", "--name-only", "HEAD"], ["git", "ls-files", "--others", "--exclude-standard"]):
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
        if path.suffix.lower() in {".xlsx"} and (path.name.lower().startswith("encuesta") or "respuestas" in path.name.lower()):
            err(f"Posibles datos personales bloqueados: {path.relative_to(ROOT)}")
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if any(mark * 7 in text for mark in ("<", ">")):
            err(f"Marcadores de conflicto en {path.relative_to(ROOT)}")


def check_text_quality() -> None:
    """Bloquea corrupción visible y mojibake en archivos de texto de revision.

    S6 conserva dos tokens corruptos dentro de su HTML legado monolítico. La
    versión publicada los corrige de forma exacta con presentation-text-fixes.js;
    se mantiene una excepción documentada hasta el refactor post-cohorte.
    """
    exts={".html",".js",".json",".py",".md",".css",".sql"}
    known_legacy={Path("Presentaciones/M3/sesion-6-reglas-de-negocio.html")}
    bad={
        "�":"carácter de reemplazo Unicode",
        "â€™":"mojibake de apóstrofo",
        "â€œ":"mojibake de comillas",
        "â€":"mojibake UTF-8",
        "sanalíticaes":"texto corrupto; debe mostrarse como solapamientos",
        "sanalíticaen":"texto corrupto; debe mostrarse como solapen",
    }
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in exts or "__pycache__" in path.parts:
            continue
        rel=path.relative_to(ROOT)
        try:text=path.read_text(encoding="utf-8")
        except (UnicodeDecodeError,OSError):continue
        for token,label in bad.items():
            if token not in text:continue
            if rel in known_legacy and token in {"sanalíticaes","sanalíticaen"}:continue
            err(f"QA de texto: {label} en {rel}")
    legacy=ROOT/"Presentaciones/M3/sesion-6-reglas-de-negocio.html"
    fixer=ROOT/"assets/learning/presentation-text-fixes.js"
    if legacy.exists() and any(x in legacy.read_text(encoding="utf-8") for x in ("sanalíticaes","sanalíticaen")):
        if not fixer.exists():
            err("S6 conserva texto legado corrupto y falta presentation-text-fixes.js")
        else:
            ft=fixer.read_text(encoding="utf-8")
            for required in ("sanalíticaes","solapamientos","sanalíticaen","solapen"):
                if required not in ft:err(f"presentation-text-fixes.js no cubre {required!r}")


def check_high_confidence_secrets() -> None:
    public_firebase_web_keys = {
        "Presentaciones/M4/carrito-abc-firebase.html": {"a7446d4348c8ce63ddb163751abf2dda349c7bbf7bcb15783c63d78834e2159f"},
        "Presentaciones/M4/sembrar-carta-firebase.html": {"a7446d4348c8ce63ddb163751abf2dda349c7bbf7bcb15783c63d78834e2159f"},
    }
    patterns = {
        "AWS access key": re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"),
        "GitHub token": re.compile(r"\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b"),
        "Google API key": re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
        "Private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    }
    for path in changed_files():
        if not path.exists() or not path.is_file(): continue
        try:text=path.read_text(encoding="utf-8")
        except (UnicodeDecodeError,OSError):continue
        rel=path.relative_to(ROOT)
        for label,rx in patterns.items():
            for match in rx.finditer(text):
                key_hash=hashlib.sha256(match.group(0).encode("utf-8")).hexdigest()
                if label=="Google API key" and key_hash in public_firebase_web_keys.get(rel.as_posix(),set()):continue
                err(f"Posible secreto ({label}) en {rel}")


def check_course_validator() -> None:
    p=run([sys.executable,"tools/validar_curso.py"],capture=True)
    if p is None:return
    if p.returncode!=0:err("tools/validar_curso.py falló:\n"+(p.stdout+p.stderr).strip())
    elif "Advertencias:" in p.stdout:warn("tools/validar_curso.py reportó advertencias; deben revisarse antes del push.")


def check_javascript() -> None:
    candidates=[
        "assets/learning/learning-core.js","assets/pwa-install.js","service-worker.js",
        "Presentaciones/M3/sql-lab-s6.js","Presentaciones/M5/sql-lab-s12.js",
        "assets/learning/analytics-fallback-link.js","assets/learning/course-data.js",
        "assets/learning/interactive-nav.js","assets/learning/access-gate.js",
        "assets/learning/resource-dock-a11y.js","assets/learning/presentation-text-fixes.js",
        "assets/learning/presentation-telemetry.js","assets/learning/lab-runtime-v4.js",
        "assets/learning/lab-runtime-v5.js","assets/learning/lab-capstone-patch.js",
    ]
    for rel in candidates:
        path=ROOT/rel
        if not path.exists():continue
        p=run(["node","--check",rel],capture=True)
        if p and p.returncode!=0:err(f"JavaScript inválido en {rel}:\n"+(p.stdout+p.stderr).strip())


def check_pedagogy_runtime() -> None:
    learning=(ROOT/"assets/learning/learning-core.js").read_text(encoding="utf-8")
    pwa=(ROOT/"assets/pwa-install.js").read_text(encoding="utf-8")
    if "localStorage" in learning:err("learning-core.js no debe usar localStorage como progreso del estudiante")
    for forbidden in ("beforeinstallprompt","ensureInstallCard","api-install-btn"):
        if forbidden in pwa:err(f"pwa-install.js reintroduce una sugerencia visible de instalación: {forbidden}")
    toolkit=ROOT/"assets/learning/interactive-tools.js"
    if toolkit.exists() and toolkit.stat().st_size>2500:
        err("interactive-tools.js volvió a convertirse en un segundo laboratorio dentro de las presentaciones")
    cap=ROOT/"capstone.html"
    if not cap.exists():err("Falta capstone.html: S15 requiere evidencia auténtica con revisión docente")


def check_early_plaintext_solutions() -> None:
    plan_path=ROOT/"assets/learning/learning-plan.json"
    try:plan=json.loads(plan_path.read_text(encoding="utf-8"))
    except Exception as exc:err(f"No se pudo leer learning-plan.json para revisar soluciones: {exc}");return
    now=datetime.now(ZoneInfo("America/Bogota"))
    for n,session in plan.get("sesiones",{}).items():
        solution=session.get("solucion",{})
        if solution.get("modo")!="programada":continue
        date,hour=session.get("fecha"),solution.get("publicar")
        if not date or not hour:continue
        try:target=datetime.fromisoformat(f"{date}T{hour}:00").replace(tzinfo=ZoneInfo("America/Bogota"))
        except ValueError:continue
        public_file=ROOT/"Scripts"/f"S{n}-solucion.sql"
        if public_file.exists() and now<target:err(f"Solución S{n} está en texto plano antes de {date} {hour} America/Bogota: {public_file.relative_to(ROOT)}")


def git_diff_generated() -> str:
    p=run(["git","diff","--binary","--","index.html","Presentaciones"],capture=True)
    return p.stdout if p and p.returncode==0 else ""


def check_generators_do_not_add_changes() -> None:
    before=git_diff_generated()
    for cmd in ([sys.executable,"tools/construir-index.py"],[sys.executable,"tools/integrar-experiencia.py"]):
        p=run(cmd,capture=True)
        if p and p.returncode!=0:err(f"Generador falló: {' '.join(cmd)}\n"+(p.stdout+p.stderr).strip());return
    after=git_diff_generated()
    if before!=after:err("Los generadores modificaron index.html o Presentaciones. Revisa esos cambios, inclúyelos si son correctos y vuelve a ejecutar el pre-push.")


def main() -> int:
    print("=== ANDESDB · IA PRE-PUSH ===")
    check_git_hygiene();check_text_quality();check_high_confidence_secrets();check_course_validator();check_javascript();check_pedagogy_runtime();check_early_plaintext_solutions();check_generators_do_not_add_changes()
    if WARNINGS:
        print("\nAdvertencias:")
        for msg in WARNINGS:print("  ⚠",msg)
    if ERRORS:
        print("\nBloqueos:")
        for msg in ERRORS:print("  ✗",msg)
        print(f"\nPRE-PUSH ANDESDB: FALLÓ ({len(ERRORS)} bloqueos)");return 1
    print("\nPRE-PUSH ANDESDB: OK");return 0


if __name__=="__main__":raise SystemExit(main())
