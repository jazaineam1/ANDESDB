from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def read(rel: str) -> str:
    p = ROOT / rel
    if not p.exists():
        ERRORS.append(f"Falta {rel}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    doc = read("docs/HILO-CONDUCTOR.md")
    # El hilo se documenta una vez; no se exige pegar la misma diapositiva en 16 mazos.
    for n in range(1, 17):
        if not re.search(rf"\bS{n:02d}\b|\bS{n}\b", doc):
            ERRORS.append(f"Hilo: falta referencia a S{n}")

    course = json.loads(read("tools/curso.json") or "{}")
    sessions = []
    for module in course.get("modulos", []):
        sessions.extend(module.get("sesiones", []))
    nums = sorted({int(s.get("n")) for s in sessions if s.get("n") is not None})
    if nums != list(range(1, 17)):
        ERRORS.append(f"curso.json: se esperaban sesiones 1..16 y aparecen {nums}")

    # Puentes críticos: estos son los saltos donde una clase debe crear la necesidad de la siguiente.
    checks = {
        "Presentaciones/M1/sesion-1-diagnostico.html": ["S2", "empezamos a interrogarlas con SQL"],
        "Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html": ["sesión 8"],
        "Presentaciones/M5/sesion-13-laboratorio-bigquery.html": ["S14", "JSON", "ARRAY", "STRUCT"],
        "Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html": ["S15", "nadie te dirá"],
        "Presentaciones/M6/sesion-15-desafio-final.html": ["S16", "diagnosticar"],
        "Presentaciones/M6/sesion-16-cierre-dp900.html": ["S1", "S15"],
    }
    for rel, tokens in checks.items():
        text = read(rel).casefold()
        for token in tokens:
            if token.casefold() not in text:
                ERRORS.append(f"{rel}: falta puente {token!r}")

    if ERRORS:
        print("\n=== Hilo conductor: FALLÓ ===")
        for e in ERRORS:
            print("  ✗", e)
        return 1
    print("\n=== Hilo conductor: OK ===")
    print("  ✓ recorrido S1–S16 documentado sin exigir una diapositiva plantilla repetida")
    return 0


if __name__ == "__main__":
    sys.exit(main())
