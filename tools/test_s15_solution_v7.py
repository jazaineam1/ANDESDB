# -*- coding: utf-8 -*-
"""Regresiones del solucionario guiado S15 v7."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent.parent
ORIG_HTML=(ROOT/"evaluador-s15-v7.html").read_text(encoding="utf-8")
ORIG_JS=(ROOT/"assets/learning/s15-autograder-v7.js").read_text(encoding="utf-8")
SOL_HTML=(ROOT/"solucionario-s15.html").read_text(encoding="utf-8")
REV_HTML=(ROOT/"revision/solucionario-s15.html").read_text(encoding="utf-8")
SOL_JS=(ROOT/"assets/learning/s15-autograder-v7-solution.js").read_text(encoding="utf-8")
REV_JS=(ROOT/"revision/assets/learning/s15-autograder-v7-solution.js").read_text(encoding="utf-8")
CSS=(ROOT/"assets/learning/s15-workbench-v7.css").read_text(encoding="utf-8")

def mission_titles(text):
    out=[]
    for m in re.finditer(r'<section class="mission[^"]*" id="([^"]+)">.*?<h2>(.*?)</h2>',text,re.S):
        out.append((m.group(1),re.sub(r"<[^>]+>","",m.group(2)).strip()))
    return out

def main():
    # Contrato de la práctica original: no se cambia su clave, versión ni Q1–Q5.
    assert "const VERSION='s15-workbench-v7',STORE='andesdb.s15.workbench.v7'" in ORIG_JS
    for q in ("q1","q2","q3","q4","q5"):
        assert q+":" in ORIG_JS
    assert "q6:" not in ORIG_JS and "q6:" not in SOL_JS

    # El solucionario conserva la estructura visible del Workbench.
    assert mission_titles(ORIG_HTML)==mission_titles(SOL_HTML)
    for sid in ("s0","s1","s2","s3","s4","s5","s6","s7","boss"):
        assert f'id="{sid}"' in SOL_HTML
    for control in ("toggleNav","nav","ddl","domainMigration","mutationProbe","bossStrategy","bossUnnest"):
        assert f'id="{control}"' in SOL_HTML
    assert "@media(max-width:760px)" in CSS

    # Importa el avance original sin escribirlo ni convertir la guía en progreso persistente.
    assert "SOURCE_STORE='andesdb.s15.workbench.v7'" in SOL_JS
    assert "localStorage.getItem(SOURCE_STORE)" in SOL_JS
    assert "localStorage.setItem(SOURCE_STORE" not in SOL_JS
    assert "localStorage.removeItem(SOURCE_STORE)" not in SOL_JS
    assert "sessionStorage.setItem(STORE,JSON.stringify(state))" in SOL_JS
    assert "sessionStorage.getItem(STORE)" in SOL_JS
    assert "localStorage.setItem(STORE" not in SOL_JS
    assert "RESET_STORE='andesdb.s15.solution.reset.v7'" in SOL_JS
    assert "sessionStorage.setItem(RESET_STORE,'1')" in SOL_JS

    # Q1–Q5: tres pistas antes de solución, sin autorrelleno.
    assert "data-solution=" in SOL_JS and "h<3?'disabled'" in SOL_JS
    assert "Math.min(3,(state.hints[id]||0)+1)" in SOL_JS
    assert "Pista 1/3" in SOL_JS and "Pista 2/3" in SOL_JS and "Pista 3/3" in SOL_JS
    assert "toggleSqlSolution" in SOL_JS
    assert "data-sql-view=" in SOL_JS and "data-study-view=" in SOL_JS
    assert "SQL_EXPLANATIONS" in SOL_JS and "STATION_EXPLANATIONS" in SOL_JS
    assert "guided-tabs" in SOL_JS and "study-answer-open" in SOL_JS
    assert ".mission.study-answer-open" in CSS
    assert "Tu intento" in SOL_JS and "Solución" in SOL_JS and "Explicación" in SOL_JS
    assert "function runReferenceQ" in SOL_JS
    assert "solution-status-" in SOL_JS and "solution-result-" in SOL_JS
    assert "4/4 escenarios de la solución" in SOL_JS
    assert "no modifica tu intento ni tu puntuación" in SOL_JS
    assert ".sqltask.sql-reference-open .sqlbody" in CSS
    for token in (
        "WHERE prioridad = 'Alta'",
        "MAX(fecha_evento) AS fecha_evento",
        "WHERE e.estado = 'Cerrado'",
        "COUNT(DISTINCT c.caso_id)",
        "AVG(total_minutos)",
    ):
        assert token in SOL_JS

    # Q3: último evento -> inclusión -> historial completo -> suma.
    for token in (
        "1. encontrar último evento",
        "2. decidir qué casos entran",
        "3. volver al historial completo",
        "4. sumar",
        "Caso 1001",
        "Caso 1002",
        "termina Reabierto",
        "WHERE estado = 'Cerrado'",
    ):
        assert token in SOL_JS

    # DDL: solo el DDL se edita; los INSERT de prueba están preparados.
    assert re.search(r'<textarea id="ddl" class="code"(?![^>]*readonly)',SOL_HTML)
    assert re.search(r'<textarea id="domainMigration"[^>]*readonly',SOL_HTML)
    assert re.search(r'<textarea id="mutationProbe"[^>]*readonly',SOL_HTML)
    assert "INSERT INTO estado_catalogo(estado) VALUES ('Escalado');" in SOL_JS
    assert "MUTANT_PROBES" in SOL_JS
    assert "minutos = 0 válido" in SOL_HTML and "minutos = -1 inválido" in SOL_HTML
    assert "una restricción correcta acepta lo válido y rechaza lo inválido" in SOL_HTML

    # Ejemplos concretos obligatorios de transferencia.
    for token in ("foto-1.jpg","Se verificó el lugar","E01","E02","Chapinero",
                  "Patrón de consultas","Antes de UNNEST","1 fila = 1 caso",
                  "P01","12.000","36.000"):
        assert token in SOL_HTML, token

    # El espejo revision debe ser ejecutable y usar exactamente el mismo runtime.
    assert 'assets/learning/s15-autograder-v7-solution.js?v=s15v7-sol-tabs1' in REV_HTML
    assert SOL_JS==REV_JS

    print("OK · S15 solucionario guiado: estructura, 3 pistas, ejemplos, DDL, sesión y espejo revision")

if __name__=="__main__":
    main()
