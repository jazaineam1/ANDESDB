# -*- coding: utf-8 -*-
"""Configura el frontend estático del piloto LMS de forma fail-closed.

La clave publishable de Supabase es pública por diseño. Este script rechaza
claves secret/service-role, exige HTTPS y obliga a separar el origen del LMS
del origen que ejecuta el laboratorio heredado.

Ejemplo:
    python tools/configurar_piloto_lms.py \
      --project-ref abcdefghijklmnopqrst \
      --publishable-key sb_publishable_... \
      --lms-origin https://andesdb-pilot.pages.dev \
      --lab-origin https://andesdb-lab-pilot.pages.dev \
      --enable
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "assets/lms/config.js"
PILOT_PAGES = [
    ROOT / "pilot/index.html",
    ROOT / "pilot/s7.html",
    ROOT / "pilot/teacher.html",
]
BRIDGE_PAGE = ROOT / "pilot-lab/s7-bridge.html"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--project-ref", required=True, help="Project ref de Supabase, sin dominio")
    p.add_argument("--publishable-key", required=True, help="Solo sb_publishable_...")
    p.add_argument("--lms-origin", required=True, help="Origen HTTPS exacto del shell LMS")
    p.add_argument("--lab-origin", required=True, help="Origen HTTPS exacto y distinto del laboratorio")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--enable", action="store_true")
    mode.add_argument("--disable", action="store_true")
    return p.parse_args()


def normalize_origin(value: str, label: str) -> str:
    value = value.strip().rstrip("/")
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname:
        raise SystemExit(f"{label} debe ser un origen HTTPS")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise SystemExit(f"{label} no puede contener credenciales, query ni fragment")
    if parsed.path not in ("", "/"):
        raise SystemExit(f"{label} debe ser solo scheme + host + puerto opcional")
    if "*" in value:
        raise SystemExit(f"{label} no admite wildcard")
    origin = f"https://{parsed.hostname.lower()}"
    if parsed.port and parsed.port != 443:
        origin += f":{parsed.port}"
    return origin


def validate(project_ref: str, key: str, lms_origin: str, lab_origin: str) -> None:
    if not re.fullmatch(r"[a-z0-9]{10,40}", project_ref):
        raise SystemExit("Project ref inválido")
    if not re.fullmatch(r"sb_publishable_[A-Za-z0-9_-]+", key):
        raise SystemExit("Se exige una Supabase publishable key (sb_publishable_...)")
    if key.startswith("sb_secret_") or "service_role" in key.lower():
        raise SystemExit("Una clave privilegiada nunca puede ir al frontend")
    if lms_origin == lab_origin:
        raise SystemExit("El origen del laboratorio DEBE ser distinto al origen autenticado")


def replace_config(project_ref: str, key: str, lms_origin: str, lab_origin: str, enabled: bool) -> None:
    text = CONFIG.read_text(encoding="utf-8")
    url = f"https://{project_ref}.supabase.co"
    text = re.sub(r"enabled:\s*(?:true|false)", f"enabled: {'true' if enabled else 'false'}", text, count=1)
    text = re.sub(r"supabaseUrl:\s*'[^']*'", f"supabaseUrl: '{url}'", text, count=1)
    text = re.sub(r"supabasePublishableKey:\s*'[^']*'", f"supabasePublishableKey: '{key}'", text, count=1)
    text = re.sub(r"s7SandboxOrigin:\s*'[^']*'", f"s7SandboxOrigin: '{lab_origin}'", text, count=1)
    CONFIG.write_text(text, encoding="utf-8")


def replace_exact_origin(path: Path, patterns: list[str], replacement: str) -> None:
    text = path.read_text(encoding="utf-8")
    total = 0
    for pattern in patterns:
        text, count = re.subn(pattern, replacement, text, flags=re.I)
        total += count
    if total == 0:
        raise SystemExit(f"No se encontró placeholder/origen esperado en {path.relative_to(ROOT)}")
    path.write_text(text, encoding="utf-8")


def replace_csp(project_ref: str, lms_origin: str, lab_origin: str) -> None:
    supabase = f"https://{project_ref}.supabase.co"
    supabase_patterns = [
        r"https://supabase-pilot\.invalid",
        r"https://\*\.supabase\.co",
        r"https://[a-z0-9-]+\.supabase\.co",
    ]
    for page in PILOT_PAGES:
        replace_exact_origin(page, supabase_patterns, supabase)

    replace_exact_origin(
        ROOT / "pilot/s7.html",
        [r"https://lab-pilot\.invalid", r"https://[a-z0-9.-]+(?=[;\s][^\"]*object-src)"],
        lab_origin,
    )
    replace_exact_origin(
        BRIDGE_PAGE,
        [r"https://lms-pilot\.invalid", r"(?<=frame-ancestors )https://[^;\"\s]+"],
        lms_origin,
    )


def main() -> int:
    args = parse_args()
    project_ref = args.project_ref.strip().lower()
    key = args.publishable_key.strip()
    lms_origin = normalize_origin(args.lms_origin, "--lms-origin")
    lab_origin = normalize_origin(args.lab_origin, "--lab-origin")
    validate(project_ref, key, lms_origin, lab_origin)
    replace_config(project_ref, key, lms_origin, lab_origin, args.enable)
    replace_csp(project_ref, lms_origin, lab_origin)
    print("Piloto LMS configurado.")
    print("  enabled:", bool(args.enable))
    print("  supabase:", f"https://{project_ref}.supabase.co")
    print("  lms origin:", lms_origin)
    print("  lab origin:", lab_origin)
    print("  key: publishable (valor no impreso)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
