# -*- coding: utf-8 -*-
"""Mantiene S15 como un workbench integrador autoevaluado.

Fuentes de verdad:
- evaluador-s15.html
- assets/learning/s15-autograder.js
- assets/learning/s15-workbench.css
- Presentaciones/M6/sesion-15-desafio-final.html
- capstone.html
- Plantillas/proyecto-final/{README.md,criterios.md}

El script sincroniza esas piezas a /revision y alinea curso.json y
learning-plan.json sin volver a incrustar HTML antiguo.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def copy(rel: str) -> None:
    src = ROOT / rel
    dst = ROOT / "revision" / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def find_session(course: dict, n: int) -> dict | None:
    for module in course.get("modulos", []):
        for session in module.get("sesiones", []):
            if session.get("n") == n:
                return session
    return None


def update_course() -> None:
    path = ROOT / "tools" / "curso.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    s = find_session(data, 15)
    if not s:
        raise RuntimeError("No se encontró S15 en tools/curso.json")
    s.update({
        "fecha": "2026-09-18",
        "duracionUtil": 165,
        "modo": "workbench_integrador_autoevaluado",
        "trabajoAutonomoMin": 120,
        "titulo": "Desafío final · Workbench integrador",
        "estado": s.get("estado", "pendiente"),
        "desc": (
            "Reto de dos horas de trabajo activo: inspector de datos, modelador ER drag-and-drop, "
            "constructor de flujo, DDL con pruebas, SQL Debug Arena, modelo estrella y Chaos Lab. "
            "37 checkpoints automáticos generan retroalimentación y registran reintentos en el LMS."
        ),
        "tags": [
            "workbench", "drag-and-drop", "modelado ER", "arquitectura",
            "DDL", "SQL debugging", "modelo estrella", "chaos testing",
            "evaluación automática", "LMS"
        ],
        "href": "Presentaciones/M6/sesion-15-desafio-final.html",
        "recursos": [
            {"txt": "🧪 S15 Workbench · 7 estaciones / 37 checkpoints", "href": "evaluador-s15.html"},
            {"txt": "🧭 Tablero del desafío", "href": "capstone.html"},
            {"txt": "✅ Contrato y rúbrica del workbench", "href": "Plantillas/proyecto-final/criterios.md"},
        ],
    })
    for module in data.get("modulos", []):
        if module.get("n") == 6:
            module["desc"] = (
                "Integrar el recorrido en un caso nuevo construyendo una solución ejecutable, "
                "sometiéndola a pruebas y cambios automáticos, y cerrar después con transferencia hacia DP-900."
            )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    copy("tools/curso.json")


def update_learning_plan() -> None:
    path = ROOT / "assets" / "learning" / "learning-plan.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    s = data.setdefault("sesiones", {}).setdefault("15", {})
    dp900 = s.get("dp900", [])
    s.update({
        "fecha": "2026-09-18",
        "titulo": "Desafío final · Workbench integrador",
        "duracion_util": 165,
        "modo": "workbench_integrador_autoevaluado",
        "trabajo_autonomo_min": 120,
        "objetivo": (
            "Integrar grano, modelado, integridad, SQL, arquitectura y analítica construyendo "
            "una solución que sobreviva pruebas y cambios de requisitos."
        ),
        "nucleo": {
            "titulo": "Construye y prueba una solución completa",
            "minutos": 90,
            "instrucciones": (
                "Completa Inspector, ER Builder, Flow Builder, DDL Lab y SQL Debug Arena. "
                "Cada estación genera evidencia automática y puede corregirse antes de continuar."
            ),
            "criterios": [
                "clasifica fuentes y claves desde evidencia",
                "construye el modelo ER por manipulación directa",
                "crea un flujo de datos coherente",
                "implementa integridad ejecutable",
                "repara consultas que sobreviven a variaciones",
            ],
        },
        "reto": {
            "titulo": "Transferencia analítica + Chaos Lab",
            "minutos": 30,
            "instrucciones": (
                "Construye el modelo estrella y ejecuta el Chaos Lab. La prueba final reutiliza "
                "el DDL, las consultas y el flujo; no agrega preguntas de selección."
            ),
            "criterios": [
                "define grano, medidas y dimensiones",
                "acepta evolución legítima sin perder integridad",
                "mantiene resultados al cambiar los datos",
                "conserva un camino para evidencia semiestructurada",
            ],
        },
        "solucion": {
            "modo": "automatica",
            "evaluador": "evaluador-s15.html",
            "version": "s15-workbench-v3",
            "checkpoints": 37,
            "puntaje_maximo": 100,
        },
    })
    if dp900:
        s["dp900"] = dp900
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    copy("assets/learning/learning-plan.json")


def sync_assets() -> None:
    for rel in (
        "evaluador-s15.html",
        "assets/learning/s15-autograder.js",
        "assets/learning/s15-workbench.css",
        "Presentaciones/M6/sesion-15-desafio-final.html",
        "capstone.html",
        "Plantillas/proyecto-final/README.md",
        "Plantillas/proyecto-final/criterios.md",
    ):
        copy(rel)


def main() -> int:
    update_course()
    update_learning_plan()
    sync_assets()
    print("S15 Workbench v3 sincronizado: pública + revision + manifiestos.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
