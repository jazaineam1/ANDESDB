from __future__ import annotations
import json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"Presentaciones/M6/sesion-16-cierre-dp900.html").read_text(encoding="utf-8")
REV=(ROOT/"revision/Presentaciones/M6/sesion-16-cierre-dp900.html").read_text(encoding="utf-8")
COURSE=json.loads((ROOT/"tools/curso.json").read_text(encoding="utf-8"))
RCOURSE=json.loads((ROOT/"revision/tools/curso.json").read_text(encoding="utf-8"))
PLAN=json.loads((ROOT/"assets/learning/learning-plan.json").read_text(encoding="utf-8"))
RPLAN=json.loads((ROOT/"revision/assets/learning/learning-plan.json").read_text(encoding="utf-8"))
GUIDE=(ROOT/"revision/docs/instructor/S16.md").read_text(encoding="utf-8")

def need(token:str):
    assert token in HTML, token

assert HTML==REV
for token in [
    "Cierre del curso +", "primer contacto DP-900", "45 min", "65 min", "700+",
    "40–60", "Online o centro", "voucher", "25–30%", "20–25%", "15–20%",
    "24 escenarios", "7–6–4–7", "Practice Assessment", "Exam Sandbox",
    "Enviar diagnóstico al docente", "challenge_completed", "learning-track",
    "andesdb.s16.dp900.v2", 'id="voucher-expiry"', 'id="exam-target"'
]:
    need(token)
assert "puede variar" in HTML.casefold()

for bad in ["Microsoft Paint","Azure DNS","16 escenarios"]:
    assert bad not in HTML, bad

m=re.search(r"const QUESTIONS=(\[.*?\]);\nconst TOTALS=",HTML,re.S)
assert m, "No se pudo extraer QUESTIONS"
qs=json.loads(m.group(1))
assert len(qs)==24
counts={d:sum(q["d"]==d for q in qs) for d in ("core","rel","nonrel","ana")}
assert counts=={"core":7,"rel":6,"nonrel":4,"ana":7}, counts
assert {q["k"] for q in qs} >= {"single","yn","match"}
assert len({q["id"] for q in qs})==24
assert [q["id"] for q in qs]==list(range(1,25))

# Distractores: al menos 3 opciones/servicios por ítem aplicable y sin bromas evidentes.
for q in qs:
    if q["k"]=="single":
        assert len(q["o"])==4
        assert q["a"] in range(4)
    elif q["k"]=="yn":
        assert len(q["s"])>=3
    elif q["k"]=="match":
        assert len(q["m"])>=3 and len(q["opts"])>=3

# Fuentes oficiales y cautelas metodológicas.
for link in [
    "exam-duration-exam-experience","register-schedule-exam","resources/study-guides/dp-900",
    "practice-assessments-for-microsoft-certifications","prepare-exam","online-exams","certifications/accommodations"
]:
    need(link)
assert "no es una nota" in HTML.casefold()
assert "no predice si aprobarás" in HTML.casefold()
assert "no representa necesariamente la longitud o dificultad exacta" in HTML.casefold()

# Manifiesto y plan.
def session16(course):
    return next(s for m in course["modulos"] for s in m.get("sesiones",[]) if s.get("n")==16)
for c in (COURSE,RCOURSE):
    s=session16(c)
    assert s["titulo"]=="Cierre del curso + primer contacto DP-900"
    assert "24 escenarios" in s["desc"]
    assert "voucher" in s["desc"]
for p in (PLAN,RPLAN):
    s=p["sesiones"]["16"]
    assert s["titulo"]=="Cierre del curso + primer contacto DP-900"
    assert s["diagnostico"]["total"]==24
    assert s["diagnostico"]["distribucion"]=={"conceptos":7,"relacional":6,"no_relacional":4,"analitica":7}
    assert "fecha objetivo" in " ".join(s["actividad"]["criterios"]).casefold()

# Guía docente.
for token in ["45 minutos","65 minutos","700","24 escenarios","7–6–4–7","voucher","Practice Assessment","Exam Sandbox","C/T/L"]:
    assert token.casefold() in GUIDE.casefold(), token

print("OK · S16: cierre + examen + 24 escenarios + voucher + reporte docente")
