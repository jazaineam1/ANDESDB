# -*- coding: utf-8 -*-
"""Configura el frontend estático del piloto LMS.

La clave publishable de Supabase es pública por diseño. Este script rechaza
cualquier clave secret/service-role y sustituye el wildcard CSP por el origen
exacto del proyecto antes de habilitar el piloto.

Ejemplo:
    python tools/configurar_piloto_lms.py \
      --project-ref abcdefghijklmnopqrst \
      --publishable-key sb_publishable_... \
      --enable
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "assets/lms/config.js"
PAGES = [
    ROOT / "pilot/index.html",
    ROOT / "pilot/s7.html",
    ROOT / "pilot/teacher.html",
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--project-ref", required=True, help="Project ref de Supabase, sin dominio")
    p.add_argument("--publishable-key", required=True, help="Solo sb_publishable_...")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--enable", action="store_true")
    mode.add_argument("--disable", action="store_true")
    return p.parse_args()


def validate(project_ref: str, key: str) -> None:
    if not re.fullmatch(r"[a-z0-9]{10,40}", project_ref):
        raise SystemExit("Project ref inválido")
    if not re.fullmatch(r"sb_publishable_[A-Za-z0-9_-]+", key):
        raise SystemExit("Se exige una Supabase publishable key (sb_publishable_...)")
    if key.startswith("sb_secret_") or "service_role" in key.lower():
        raise SystemExit("Una clave privilegiada nunca puede ir al frontend")


def replace_config(project_ref: str, key: str, enabled: bool) -> None:
    text = CONFIG.read_text(encoding="utf-8")
    url = f"https://{project_ref}.supabase.co"
    text = re.sub(r"enabled:\s*(?:true|false)", f"enabled: {'true' if enabled else 'false'}", text, count=1)
    text = re.sub(r"supabaseUrl:\s*'[^']*'", f"supabaseUrl: '{url}'", text, count=1)
    text = re.sub(r"supabasePublishableKey:\s*'[^']*'", f"supabasePublishableKey: '{key}'", text, count=1)
    CONFIG.write_text(text, encoding="utf-8")


def replace_csp(project_ref: str) -> None:
    exact = f"https://{project_ref}.supabase.co"
    rx = re.compile(r"https://(?:\*|[a-z0-9-]+)\.supabase\.co", re.I)
    for page in PAGES:
        text = page.read_text(encoding="utf-8")
        text, count = rx.subn(exact, text)
        if count == 0:
            raise SystemExit(f"No se encontró origen Supabase en CSP de {page.relative_to(ROOT)}")
        page.write_text(text, encoding="utf-8")


def main() -> int:
    args = parse_args()
    project_ref = args.project_ref.strip().lower()
    key = args.publishable_key.strip()
    validate(project_ref, key)
    replace_config(project_ref, key, args.enable)
    replace_csp(project_ref)
    print("Piloto LMS configurado.")
    print("  enabled:", bool(args.enable))
    print("  origin:", f"https://{project_ref}.supabase.co")
    print("  key: publishable (valor no impreso)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
