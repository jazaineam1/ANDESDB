#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gate de seguridad del repositorio ANDESDB.

No reemplaza CodeQL, RLS tests, secret scanning del proveedor ni una revisión
manual. Bloquea regresiones de alta señal que el proyecto puede verificar sin
dependencias externas.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEXT_EXTS = {
    ".md", ".txt", ".py", ".js", ".mjs", ".html", ".css", ".json", ".yml", ".yaml",
    ".sql", ".toml", ".ini", ".env", ".sh", ".webmanifest",
}

# Documentación puede mencionar nombres de secretos de forma literal. Los
# patrones de valores reales se siguen buscando en el resto del repo.
DOC_PREFIXES = ("docs/", "specs/", "SECURITY.md")

SECRET_PATTERNS = [
    ("private key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("Supabase secret key", re.compile(r"\bsb_secret_[A-Za-z0-9_-]{12,}\b")),
    ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b")),
    ("AWS access key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    # URI de BD con user:password@host. Permite placeholders sin @ real.
    ("database URI with password", re.compile(
        r"\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?)://[^\s/:]+:[^\s/@]+@[^\s]+",
        re.I,
    )),
]

DANGEROUS_LMS_PATTERNS = [
    ("innerHTML", re.compile(r"\.innerHTML\b")),
    ("insertAdjacentHTML", re.compile(r"\binsertAdjacentHTML\b")),
    ("document.write", re.compile(r"\bdocument\.write\b")),
    ("eval", re.compile(r"\beval\s*\(")),
    ("new Function", re.compile(r"\bnew\s+Function\s*\(")),
]


def tracked_files() -> list[Path]:
    out = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT)
    return [ROOT / p.decode("utf-8") for p in out.split(b"\0") if p]


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_text(path: Path) -> str | None:
    if path.suffix.lower() not in TEXT_EXTS and path.name not in {"CODEOWNERS", ".gitignore"}:
        return None
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return None


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def check_secrets(files: list[Path], errors: list[str]) -> None:
    for path in files:
        text = read_text(path)
        if text is None:
            continue
        r = rel(path)
        for name, pattern in SECRET_PATTERNS:
            # Los docs pueden escribir `sb_secret_...` como ejemplo. URI con
            # password y private keys nunca se aceptan ni en material docente.
            if r.startswith(DOC_PREFIXES) and name in {"Supabase secret key", "GitHub token", "AWS access key"}:
                continue
            if pattern.search(text):
                fail(errors, f"{r}: posible {name}")


def check_workflows(files: list[Path], errors: list[str]) -> None:
    uses_re = re.compile(r"^\s*-?\s*uses:\s*([^\s#]+)", re.M)
    for path in files:
        r = rel(path)
        if not r.startswith(".github/workflows/") or path.suffix not in {".yml", ".yaml"}:
            continue
        text = path.read_text(encoding="utf-8")
        if "pull_request_target:" in text:
            fail(errors, f"{r}: pull_request_target prohibido sin excepción aprobada")
        if re.search(r"permissions:\s*write-all", text):
            fail(errors, f"{r}: permissions write-all prohibido")
        for use in uses_re.findall(text):
            if use.startswith("./"):
                continue
            if "@" not in use:
                fail(errors, f"{r}: action sin ref: {use}")
                continue
            action, ref = use.rsplit("@", 1)
            if not re.fullmatch(r"[0-9a-fA-F]{40}", ref):
                fail(errors, f"{r}: action no fijada por SHA completo: {action}@{ref}")


def check_lms(files: list[Path], errors: list[str]) -> None:
    for path in files:
        r = rel(path)
        if not r.startswith("assets/lms/") or path.suffix not in {".js", ".mjs"}:
            continue
        text = path.read_text(encoding="utf-8")
        for name, pattern in DANGEROUS_LMS_PATTERNS:
            if pattern.search(text):
                fail(errors, f"{r}: sink peligroso prohibido en LMS: {name}")

    config = ROOT / "assets/lms/config.js"
    if config.exists():
        text = config.read_text(encoding="utf-8")
        if re.search(r"supabasePublishableKey\s*:\s*['\"]sb_secret_", text):
            fail(errors, "assets/lms/config.js: secret key en campo público")
        if "s7SandboxOrigin" not in text:
            fail(errors, "assets/lms/config.js: falta origen separado para el laboratorio S7")

    required_csp = [
        "script-src 'self'", "object-src 'none'", "form-action 'self'", "frame-ancestors",
    ]
    for name in ("index.html", "s7.html", "teacher.html"):
        path = ROOT / "pilot" / name
        if not path.exists():
            fail(errors, f"pilot/{name}: falta página")
            continue
        text = path.read_text(encoding="utf-8")
        if "Content-Security-Policy" not in text:
            fail(errors, f"pilot/{name}: falta CSP")
        for directive in required_csp:
            if directive not in text:
                fail(errors, f"pilot/{name}: CSP sin {directive}")
        if re.search(r"<script\b[^>]*\bsrc=[\"']https?://", text, re.I):
            fail(errors, f"pilot/{name}: script remoto prohibido")


def check_required_security_files(errors: list[str]) -> None:
    required = [
        "SECURITY.md",
        "docs/SEGURIDAD-PROYECTO.md",
        ".specify/memory/constitution.md",
        "docs/piloto-lms/THREAT-MODEL.md",
        "docs/piloto-lms/PRUEBAS-ADVERSARIALES.md",
        "supabase/tests/rls-adversarial.sql",
        ".github/workflows/security-pilot.yml",
        ".github/workflows/dependency-review.yml",
        ".github/workflows/scorecard.yml",
    ]
    for item in required:
        if not (ROOT / item).is_file():
            fail(errors, f"falta artefacto de seguridad: {item}")


def main() -> int:
    errors: list[str] = []
    files = tracked_files()
    check_secrets(files, errors)
    check_workflows(files, errors)
    check_lms(files, errors)
    check_required_security_files(errors)

    if errors:
        print("SECURITY GATE: FAIL")
        for item in sorted(set(errors)):
            print(" -", item)
        return 1
    print("SECURITY GATE: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
