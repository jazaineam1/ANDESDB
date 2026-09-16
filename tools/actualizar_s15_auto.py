# -*- coding: utf-8 -*-
"""Sincroniza S15 Workbench v5 y sus manifiestos.

La fuente de verdad de la evaluación es v5:
- evaluador-s15-v5.html
- assets/learning/s15-autograder-v5.js
- assets/learning/s15-workbench-v5.css
- Presentaciones/M6/sesion-15-desafio-final-v5.html
- s15-analytics.html

Las rutas históricas se mantienen como redirecciones para no romper enlaces.
"""
from __future__ import annotations
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION = "s15-workbench-v5"


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
        "modo": "workbench_v5_mastery_transfer",
        "trabajoAutonomoMin": 120,
        "titulo": "Desafío final · Workbench v5",
        "estado": s.get("estado", "pendiente"),
        "desc": (
            "Evaluación integradora automatizada: seis estaciones de dominio corregible (80 puntos) "
            "y un Boss de transferencia inédita (20 puntos). Incluye inspector de datos, ER Builder, "
            "arquitectura por propiedades, DDL + Mutation Hunter, SQL con partial credit y feedback "
            "progresivo, modelo analítico con follow-through y grader server-side con datasets ocultos."
        ),
        "tags": [
            "workbench", "mastery", "transferencia", "server-side grading", "partial credit",
            "mutation testing", "feedback progresivo", "modelado ER", "SQL debugging",
            "follow-through", "evaluación automática", "LMS", "mobile"
        ],
        "href": "Presentaciones/M6/sesion-15-desafio-final-v5.html",
        "recursos": [
            {"txt": "🧪 Workbench v5 · dominio + transferencia", "href": "evaluador-s15-v5.html"},
            {"txt": "🧭 Tablero del desafío", "href": "capstone.html"},
            {"txt": "✅ Contrato y criterios", "href": "Plantillas/proyecto-final/criterios.md"},
        ],
    })
    for module in data.get("modulos", []):
        if module.get("n") == 6:
            module["desc"] = (
                "Integrar el curso en una solución ejecutable, aprender mediante reparación y comprobar "
                "transferencia con datos/requisitos inéditos antes del cierre DP-900."
            )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    copy("tools/curso.json")


def update_learning_plan() -> None:
    path = ROOT / "assets" / "learning" / "learning-plan.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    s = data.setdefault("sesiones", {}).setdefault("15", {})
    old_dp900 = s.get("dp900", [])
    s.update({
        "fecha": "2026-09-18",
        "titulo": "Desafío final · Workbench v5",
        "duracion_util": 165,
        "modo": "workbench_v5_mastery_transfer",
        "trabajo_autonomo_min": 120,
        "objetivo": (
            "Integrar grano, integridad, SQL, arquitectura y analítica; aprender mediante ciclos de "
            "feedback y demostrar transferencia ante datos y requisitos no practicados."
        ),
        "nucleo": {
            "titulo": "Mastery corregible · 80 puntos",
            "minutos": 90,
            "instrucciones": (
                "Completa Inspector, ER Builder, Flow Builder, DDL + Mutation Hunter, SQL Debug Arena "
                "y Star Builder. Puedes reintentar sin penalización; se conserva el mejor estado verificado."
            ),
            "criterios": [
                "grano y claves desde evidencia",
                "modelo operacional con integridad",
                "arquitectura válida por propiedades",
                "capacidad de diseñar pruebas contra mutantes",
                "SQL correcto sobre variaciones con partial credit",
                "modelo analítico coherente con el grano elegido",
            ],
        },
        "reto": {
            "titulo": "Boss Transfer · 20 puntos",
            "minutos": 30,
            "instrucciones": (
                "Adapta el flujo a una fuente nueva y el modelo analítico a SLA por caso. Al registrar, "
                "el servidor vuelve a ejecutar DDL y SQL sobre datasets secretos distintos del entrenamiento."
            ),
            "criterios": [
                "DDL acepta evolución legítima sin perder integridad",
                "SQL transfiere a datos inéditos",
                "flujo incorpora una fuente nueva sin atajos a BI",
                "modelo analítico responde a un nuevo grano requerido",
            ],
        },
        "solucion": {
            "modo": "automatica_server_side",
            "evaluador": "evaluador-s15-v5.html",
            "version": VERSION,
            "mastery_max": 80,
            "transfer_max": 20,
            "puntaje_maximo": 100,
            "grader": "learning-autograde-s15",
            "analytics": "s15-analytics.html",
        },
    })
    if old_dp900:
        s["dp900"] = old_dp900
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    copy("assets/learning/learning-plan.json")


def sync_assets() -> None:
    for rel in (
        "evaluador-s15.html",
        "evaluador-s15-v5.html",
        "assets/learning/s15-autograder-v5.js",
        "assets/learning/s15-workbench-v5.css",
        "assets/learning/s15-teacher-link.js",
        "Presentaciones/M6/sesion-15-desafio-final.html",
        "Presentaciones/M6/sesion-15-desafio-final-v5.html",
        "s15-analytics.html",
        "capstone.html",
        "Plantillas/proyecto-final/README.md",
        "Plantillas/proyecto-final/criterios.md",
    ):
        copy(rel)


def patch_teacher_dashboard() -> None:
    path = ROOT / "revision" / "teacher-dashboard.html"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    tag = '<script src="assets/learning/s15-teacher-link.js?v=s15v5a"></script>'
    if tag not in text:
        if "</body>" not in text:
            raise RuntimeError("teacher-dashboard.html no tiene </body>")
        text = text.replace("</body>", tag + "</body>", 1)
        path.write_text(text, encoding="utf-8")


def main() -> int:
    update_course()
    update_learning_plan()
    sync_assets()
    patch_teacher_dashboard()
    print("S15 Workbench v5 sincronizado: mastery 80 + transfer 20 + grader server-side + analytics docente.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
