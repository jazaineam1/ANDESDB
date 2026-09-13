# -*- coding: utf-8 -*-
"""Audita el contrato pedagógico pregunta → respuesta en ANDESDB.

No intenta decidir si una explicación es buena; comprueba que las preguntas visibles
no queden sin mecanismo de cierre: feedback, respuesta explícita o cierre de sesión.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
STORY=ROOT/"assets"/"learning"/"presentation-story-v2-patch.js"
NAV=ROOT/"assets"/"learning"/"interactive-nav.js"
CORE=ROOT/"assets"/"learning"/"learning-core.js"


def fail(msg:str, errors:list[str])->None: errors.append(msg)
def warn(msg:str, warnings:list[str])->None: warnings.append(msg)


def main()->int:
    errors:list[str]=[];warnings:list[str]=[]
    if not STORY.exists():
        fail("Falta presentation-story-v2-patch.js",errors)
    else:
        text=STORY.read_text(encoding="utf-8",errors="replace")
        for n in range(1,17):
            if not re.search(rf"\n{n}:'",text):fail(f"S{n}: falta respuesta explícita de sesión",errors)
        for token in ("addSessionClosure","answerInjectedPrompts","markQuestionContracts","story-explicit-answer","story-resolution"):
            if token not in text:fail(f"Falta contrato narrativo: {token}",errors)
        # Preguntas añadidas por la propia capa narrativa: todas deben tener cierre explícito.
        for n in (1,4,10,13,14):
            if f"if(n==={n})" not in text:fail(f"S{n}: pregunta narrativa añadida sin respuesta específica",errors)
        for fn in ("addS3ProblemFirst","addS6EvidenceFirst","addS7Counterexample","addS11Decision"):
            if fn not in text:fail(f"Falta intervención problema→respuesta: {fn}",errors)

    for path,label in ((NAV,"interactive-nav.js"),(CORE,"learning-core.js")):
        if not path.exists():fail(f"Falta {label}",errors);continue
        text=path.read_text(encoding="utf-8",errors="replace")
        if "presentation-story-v2-patch.js" not in text:fail(f"{label} no carga la capa pregunta→respuesta",errors)

    originals=sorted(ROOT.glob("Presentaciones/M*/__original__/sesion-*.html"))
    if not originals:warn("No se encontraron presentaciones originales para auditoría heurística",warnings)
    for path in originals:
        text=path.read_text(encoding="utf-8",errors="replace")
        # Es heurístico: solo detecta preguntas interactivas que, por estructura, deberían tener feedback.
        q_blocks=len(re.findall(r'class=["\'][^"\']*\bq\b[^"\']*["\']',text,re.I))
        answers=len(re.findall(r'data-answer\s*=|class=["\'][^"\']*\bfb\b[^"\']*["\']',text,re.I))
        if q_blocks and answers==0:warn(f"{path.relative_to(ROOT)}: tiene bloques de pregunta sin señal estática de feedback",warnings)

    print("=== ANDESDB · auditoría pregunta → respuesta ===")
    if warnings:
        print("\nAdvertencias:")
        for msg in warnings:print("  ⚠",msg)
    if errors:
        print("\nErrores:")
        for msg in errors:print("  ✗",msg)
        print(f"\nResultado: FALLÓ ({len(errors)} errores, {len(warnings)} advertencias)")
        return 1
    print(f"\nResultado: OK ({len(warnings)} advertencias)")
    return 0


if __name__=="__main__":sys.exit(main())
