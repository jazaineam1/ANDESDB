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
GLOSS=(ROOT/"Presentaciones/M6/glosario-cierre-s16.html").read_text(encoding="utf-8")
RGLOSS=(ROOT/"revision/Presentaciones/M6/glosario-cierre-s16.html").read_text(encoding="utf-8")
S16_ANALYTICS=(ROOT/"s16-analytics.html").read_text(encoding="utf-8")
RS16_ANALYTICS=(ROOT/"revision/s16-analytics.html").read_text(encoding="utf-8")
S16_EDGE=(ROOT/"supabase/functions/learning-s16-analytics/index.ts").read_text(encoding="utf-8")
TEACHER=(ROOT/"revision/teacher-dashboard.html").read_text(encoding="utf-8")

def need(token:str):
    assert token in HTML, token

assert HTML==REV
for token in [
    "Cierre del curso +", "primer contacto DP-900", "45 min", "65 min", "700+",
    "Variable", "Online o centro", "voucher", "30 minutos adicionales", "25–30%", "20–25%", "15–20%",
    "24 escenarios", "48 decisiones evaluables", "7–6–4–7", "Practice Assessment", "Exam Sandbox",
    "Enviar diagnóstico al docente", "challenge_completed", "learning-track",
    "andesdb.s16.dp900.v3", 'id="voucher-expiry"', 'id="exam-target"', "Confianza antes de ver feedback", "Marca tu confianza 1–3",
    "Apertura honesta", "Devolución S15", "Todo el SQL que escribiste", "Síntesis del curso", "Cápsula Azure", "Certificaciones", "Portafolio de evidencias", "Encuesta de cierre",
    'data-post="q1"', 'data-portfolio="sql"', 'id="portfolio-url"', 'data-survey="rel"', "post_s1_completed", "post_s1_responses", "portfolio:state.portfolio", "portfolio_url", "survey:state.survey"
]:
    need(token)
assert "puede variar" in HTML.casefold()

for bad in ["Microsoft Paint","Azure DNS","16 escenarios","Microsoft Fabric Power BI","S1 · Línea base","Pre/Post"]:
    assert bad not in HTML, bad

m=re.search(r"const QUESTIONS=(\[.*?\]);\nconst TOTALS=",HTML,re.S)
assert m, "No se pudo extraer QUESTIONS"
qs=json.loads(m.group(1))
assert len(qs)==24
counts={d:sum(q["d"]==d for q in qs) for d in ("core","rel","nonrel","ana")}
assert counts=={"core":7,"rel":6,"nonrel":4,"ana":7}, counts
assert {q["k"] for q in qs} >= {"single","yn","match"}
assert sum(q["k"]=="single" for q in qs) <= 12, "Selección única debe ser <= 50%"
assert sum(q["k"]!="single" for q in qs) >= 12
assert len({q["id"] for q in qs})==24
assert [q["id"] for q in qs]==list(range(1,25))

def components(q):
    if q["k"]=="single": return 1
    if q["k"]=="yn": return len(q["s"])
    if q["k"]=="match": return len(q["m"])
    raise AssertionError(q["k"])

component_counts={d:sum(components(q) for q in qs if q["d"]==d) for d in ("core","rel","nonrel","ana")}
assert sum(component_counts.values())==48
assert component_counts=={"core":15,"rel":12,"nonrel":8,"ana":13}, component_counts
assert qs[8]["p"].startswith("Relaciona cada necesidad con la construcción SQL")
assert "LEFT JOIN" in qs[8]["opts"] and "VIEW" in qs[8]["opts"]
assert "Databricks Runtime" in qs[19]["p"]
assert qs[19]["o"][0]=="Microsoft Fabric"
assert "visualización" in qs[22]["p"].casefold()

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
    "practice-assessments-for-microsoft-certifications","prepare-exam","online-exams","certifications/request-accommodations"
]:
    need(link)
assert "no es una nota" in HTML.casefold()
assert "predice" in HTML.casefold() and "aprobar" in HTML.casefold()
assert "no representa necesariamente la longitud o dificultad exacta" in HTML.casefold()
assert "state.confidence[q.id]" in HTML
assert "high_confidence_errors" in HTML
assert HTML.count('<section class="slide')==30
for token in ["Último evento vs.", "aceptar lo válido", "No mezclar granos", "Google Cloud Data Analytics", "HackerRank SQL", "SQL Arena", "DDL Mutation", "Boss Transfer", "PARTITION BY", "CROSS JOIN UNNEST", "Azure SQL Database", "Azure Table Storage"]:
    assert token in HTML, token
assert "0–10" not in HTML and "10–35" not in HTML and "107–142" not in HTML and "176–180" not in HTML

# Manifiesto y plan.
def session16(course):
    return next(s for m in course["modulos"] for s in m.get("sesiones",[]) if s.get("n")==16)
for c in (COURSE,RCOURSE):
    s=session16(c)
    assert s["titulo"]=="Cierre del curso + primer contacto DP-900"
    assert "24 escenarios" in s["desc"]
    assert "voucher" in s["desc"]
    assert "portafolio" in s["desc"].casefold()
    assert "encuesta" in s["desc"].casefold()
    assert any("skills.google/paths/420" in r.get("href","") for r in s.get("recursos",[]))
    assert any("hackerrank.com/skills-verification/sql_basic" in r.get("href","") for r in s.get("recursos",[]))
for p in (PLAN,RPLAN):
    s=p["sesiones"]["16"]
    assert s["titulo"]=="Cierre del curso + primer contacto DP-900"
    assert s["diagnostico"]["total"]==24
    assert s["diagnostico"]["distribucion"]=={"conceptos":7,"relacional":6,"no_relacional":4,"analitica":7}
    assert "fecha objetivo" in " ".join(s["actividad"]["criterios"]).casefold()
    assert "cierre" in s and len(s["cierre"]["certificaciones"])==3
    assert len(s["cierre"]["portafolio"])==8
    assert len(s["cierre"]["encuesta"])==4
    assert len(s["cierre"]["todo_sql"])==9
    assert s["diagnostico"]["live_practice_assessment"]==5
    assert s["diagnostico"]["keep_24_items"] is True
    assert s["diagnostico"]["version"]=="dp900-2026-07-v3"
    assert s["diagnostico"]["componentes_total"]==48
    assert s["diagnostico"]["distribucion_componentes"]=={"conceptos":15,"relacional":12,"no_relacional":8,"analitica":13}
    assert s["diagnostico"]["require_error_classification"] is True
    assert s["cierre"]["portfolio_url_optional"] is True
    assert "respuestas actuales de la reflexión S1" in s["diagnostico"]["reporte_docente"]

# Guía docente.
for token in ["45 minutos","65 minutos","700","24 escenarios","48 componentes","7–6–4–7","voucher","Practice Assessment","Exam Sandbox","C/T/L","0–10","10–35","35–50","50–60","60–75","75–93","93–103","103–148","148–162","162–177","177–180","Certificaciones trasladadas desde S7","Todo el SQL que escribiste","Cápsula de vocabulario DP-900","s15-analytics.html","Portafolio","Encuesta"]:
    assert token.casefold() in GUIDE.casefold(), token

assert GLOSS==RGLOSS
for token in ["Grano","Partición","Clustering","UNNEST","OLTP","OLAP","ETL","ELT","Parquet","CAP","0 · Diagnóstico","1 · SQL Arena","2 · Modelo + 3FN","3 · DDL Mutation","4 · Document Lab","5 · Warehouse","6 · BigQuery físico","7 · Nested BigQuery","8 · Boss Transfer"]:
    assert token in GLOSS, token

# El diagnóstico llega a un panel docente específico, no queda enterrado en lms_events.
assert S16_ANALYTICS==RS16_ANALYTICS
for token in ["learning-s16-analytics","Exactitud por componentes","Escenarios perfectos","Errores C / T / L / U","Ítems con mayor dificultad","Detalle por estudiante","portfolio_count"]:
    assert token in S16_ANALYTICS, token
for token in ['eq("session_number",16)','eq("activity_code","s16-dp900")','eq("event_type","challenge_completed")',"latest.size","target_after_expiry","itemAgg","weakest_domains","scenario_correct"]:
    assert token in S16_EDGE, token
assert '../s16-analytics.html' in TEACHER
assert '../s15-analytics.html' in TEACHER
assert "s16-analytics.html" in GUIDE
assert "modo invitado queda guardado solo en este dispositivo" in HTML
assert "Cobertura del reporte docente" in GUIDE
assert "requiere una sesión LMS válida" in GUIDE

print("OK · S16: cierre honesto + todo SQL + DP900 + 24 escenarios/48 componentes + C/T/L obligatorio + glosario + portafolio + analítica docente")
