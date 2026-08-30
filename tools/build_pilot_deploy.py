#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Construye dos artefactos estáticos mutuamente aislados para el piloto.

Nunca desplegar la raíz completa del repositorio como LMS autenticado: hacerlo
volvería a publicar el laboratorio heredado en el mismo origen de la sesión.
"""
from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
CONFIG = ROOT / "assets/lms/config.js"

LMS_ASSETS = [
    "config.js", "auth-client.js", "lms-client.js", "pilot-index.js",
    "s7-host.js", "teacher.js", "pilot.css",
]
LAB_ASSETS = ["s7-bridge.js", "s7-bridge.css"]


def origin(value: str, label: str) -> str:
    value = value.strip().rstrip("/")
    u = urlparse(value)
    if u.scheme != "https" or not u.hostname or u.username or u.password or u.query or u.fragment:
        raise SystemExit(f"{label}: se exige origen HTTPS simple")
    if u.path not in ("", "/") or "*" in value:
        raise SystemExit(f"{label}: no se admiten path/wildcard")
    out = f"https://{u.hostname.lower()}"
    if u.port and u.port != 443:
        out += f":{u.port}"
    return out


def config_value(name: str) -> str:
    text = CONFIG.read_text(encoding="utf-8")
    m = re.search(rf"{re.escape(name)}:\s*'([^']*)'", text)
    if not m:
        raise SystemExit(f"Falta {name} en config.js")
    return m.group(1)


def copy_file(rel: str, out: Path) -> None:
    src = ROOT / rel
    if not src.is_file():
        raise SystemExit(f"Falta archivo requerido: {rel}")
    dst = out / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def copy_tree(rel: str, out: Path) -> None:
    src = ROOT / rel
    dst = out / rel
    if not src.is_dir():
        raise SystemExit(f"Falta directorio requerido: {rel}")
    shutil.copytree(src, dst, dirs_exist_ok=True)


def write_lms_headers(out: Path, supabase: str, lab: str) -> None:
    csp = (
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
        f"connect-src 'self' {supabase}; frame-src {lab}; object-src 'none'; "
        "base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    )
    (out / "_headers").write_text(
        "/*\n"
        f"  Content-Security-Policy: {csp}\n"
        "  Referrer-Policy: no-referrer\n"
        "  X-Content-Type-Options: nosniff\n"
        "  X-Frame-Options: DENY\n"
        "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n"
        "  Cross-Origin-Opener-Policy: same-origin\n"
        "  Cache-Control: no-store\n",
        encoding="utf-8",
    )


def write_lab_headers(out: Path, lms: str) -> None:
    # El constructor heredado usa script/style inline y WebAssembly. Esa deuda
    # queda confinada a un origen que no contiene la sesión LMS.
    csp = (
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; "
        "frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; "
        f"frame-ancestors {lms}"
    )
    (out / "_headers").write_text(
        "/*\n"
        f"  Content-Security-Policy: {csp}\n"
        "  Referrer-Policy: no-referrer\n"
        "  X-Content-Type-Options: nosniff\n"
        "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n"
        "  Cache-Control: no-store\n",
        encoding="utf-8",
    )


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--lms-origin", required=True)
    args = p.parse_args()

    lms = origin(args.lms_origin, "--lms-origin")
    supabase = origin(config_value("supabaseUrl"), "supabaseUrl")
    lab = origin(config_value("s7SandboxOrigin"), "s7SandboxOrigin")
    if lab == lms:
        raise SystemExit("LMS y laboratorio no pueden compartir origen")
    if "enabled: true" not in CONFIG.read_text(encoding="utf-8"):
        raise SystemExit("Configura y habilita el piloto antes de construir deploy")

    lms_out = DIST / "pilot-lms"
    lab_out = DIST / "pilot-lab"
    shutil.rmtree(lms_out, ignore_errors=True)
    shutil.rmtree(lab_out, ignore_errors=True)
    lms_out.mkdir(parents=True)
    lab_out.mkdir(parents=True)

    copy_tree("pilot", lms_out)
    for name in LMS_ASSETS:
        copy_file(f"assets/lms/{name}", lms_out)
    write_lms_headers(lms_out, supabase, lab)

    copy_tree("pilot-lab", lab_out)
    for name in LAB_ASSETS:
        copy_file(f"assets/lms/{name}", lab_out)
    copy_file("Presentaciones/M3/constructor-abc.html", lab_out)
    copy_file("assets/andesdb-icon.svg", lab_out)
    copy_file("assets/vendor/sqljs/sql-wasm.js", lab_out)
    copy_file("assets/vendor/sqljs/sql-wasm.wasm", lab_out)
    write_lab_headers(lab_out, lms)

    print("Artefactos separados construidos:")
    print(" ", lms_out.relative_to(ROOT))
    print(" ", lab_out.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
