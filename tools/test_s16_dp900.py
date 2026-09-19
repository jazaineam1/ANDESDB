from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parents[1]
DECK=ROOT/"Presentaciones/M6/sesion-16-cierre-dp900.html"
RDECK=ROOT/"revision/Presentaciones/M6/sesion-16-cierre-dp900.html"
SHEET=ROOT/"Presentaciones/M6/glosario-cierre-s16.html"
RSHEET=ROOT/"revision/Presentaciones/M6/glosario-cierre-s16.html"
GUIDE=ROOT/"revision/docs/instructor/S16.md"
PLAN=ROOT/"assets/learning/learning-plan.json"
RPLAN=ROOT/"revision/assets/learning/learning-plan.json"
COURSE=ROOT/"tools/curso.json"
RCOURSE=ROOT/"revision/tools/curso.json"
TIMER=ROOT/"assets/learning/presentation-timer.js"

html=DECK.read_text(encoding="utf-8")
rhtml=RDECK.read_text(encoding="utf-8")
sheet=SHEET.read_text(encoding="utf-8")
rsheet=RSHEET.read_text(encoding="utf-8")
guide=GUIDE.read_text(encoding="utf-8")
plan=json.loads(PLAN.read_text(encoding="utf-8"))
rplan=json.loads(RPLAN.read_text(encoding="utf-8"))
course=json.loads(COURSE.read_text(encoding="utf-8"))
rcourse=json.loads(RCOURSE.read_text(encoding="utf-8"))
timer=TIMER.read_text(encoding="utf-8")

assert html==rhtml
assert sheet==rsheet
assert plan==rplan
assert course==rcourse

titles=re.findall(r'<section class="slide[^"]*" data-title="([^"]+)"',html)
expected=[
"Portada","Recorrido","SQL que escribes","Pensamiento SQL","De reglas a modelo",
"Mapa consolidado","S15 integró","Caso puente","Caso resuelto",
"DP900 empieza","Blueprint DP900","Razonar DP900","DP900 dominio1 datos","DP900 dominio1 roles",
"Pausa","DP900 relacional conceptos","Familia Azure SQL","Caso Azure SQL",
"Azure Storage","Cosmos DB","Caso NoSQL Azure","Pipeline analítico Microsoft",
"Databricks Fabric PowerBI","Tiempo real y PowerBI","Casos analítica Azure",
"Practice Assessment","Examen y voucher","Cheat sheet","Cierre"]
assert titles==expected, titles
assert len(titles)==29

# Shell tradicional + timer compartido actual de S15 v7.
assert 'class="toolbar"' in html and 'class="progress"' in html
assert 'presentation-timer.js?v=20260919a' in html
for legacy in ['id="timeOv"','id="mini"','id="miniT"','id="minLibre"','data-start-break']:
    assert legacy not in html, legacy
for token in ['Personalizado · 7:30 o 25','data-min="5"','data-min="10"','data-min="15"','data-min="20"','data-free="1"','−5 min','+5 min','▶ Iniciar','↺ Reiniciar','apt-pause-stage']:
    assert token in timer, token

# No vuelve a ser otro examen/formulario del curso.
for bad in ["<textarea","qcard","send-report","24 escenarios","48 componentes","C / T / L","portfolio-url","Enviar diagnóstico al docente"]:
    assert bad not in html, bad

# El repaso queda condensado y S15 sigue como evidencia.
for token in [
    "En una hora: consulta, modelo, integridad, almacenamiento y analítica",
    "S15 convirtió lo anterior",
    "Un caso basta para comprobar que las piezas siguen conectadas",
    "Ese razonamiento ya lo tienes"
]:
    assert token in html, token
assert "Tres casos" not in titles and "Resolución casos" not in titles

# DP-900 ocupa la segunda mitad y usa blueprint vigente.
for token in [
    "100 min de preparación guiada","21 de julio de 2026",
    "25–30%","20–25%","15–20%",
    "Core data concepts","Relational on Azure","Non-relational","Analytics",
    "DBA","Data Engineer","Data Analyst",
    "Azure SQL Database","Azure SQL Managed Instance","SQL Server on Azure VM","Azure Database for PostgreSQL",
    "Blob Storage","Azure Files","Table Storage","Cosmos DB",
    "Azure Databricks","Microsoft Fabric","Power BI",
    "Batch","Streaming / real time","Línea","Barras","Card/KPI",
    "5–6 preguntas oficiales"
]:
    assert token in html, token

# Diferenciación por requisito, no memorización de nombres.
for token in [
    "condición que manda","compatibilidad de instancia","no quiere administrar una máquina virtual",
    "Storage y base NoSQL no son lo mismo","casos de uso y APIs de Cosmos DB",
    "Databricks, Fabric y Power BI no son sinónimos"
]:
    assert token in html, token

for url in [
    "credentials/certifications/resources/study-guides/dp-900",
    "practice-assessments-for-microsoft-certifications",
    "credentials/certifications/azure-data-fundamentals",
    "credentials/certifications/prepare-exam",
    "credentials/certifications/register-schedule-exam"
]:
    assert url in html, url

# Cheat Sheet sigue siendo de cuatro páginas y ahora incluye blueprint + matriz Azure.
assert len(re.findall(r'<section class="page"(?:\s|>)',sheet))==4
for token in [
    "DP-900 · blueprint vigente + mapa Azure","21-jul-2026",
    "Core data concepts","Relational data on Azure","Non-relational data on Azure","Analytics workload",
    "25–30%","20–25%","15–20%",
    "Azure SQL Database","Azure SQL Managed Instance","SQL Server on Azure VM","Azure Database for PostgreSQL",
    "Blob Storage","Azure Files","Table Storage","Cosmos DB","Azure Databricks","Microsoft Fabric","Power BI",
    "Rutas de profundización · referentes de industria"
]:
    assert token in sheet, token

# Manifiestos y tiempos.
s=plan["sesiones"]["16"]
assert s["titulo"]=="Cierre del curso + preparación DP-900"
assert s["actividad"]["distribucion"]["cierre_diplomado"]==65
assert s["actividad"]["distribucion"]["total_dp900_y_continuidad"]==100
assert s["dp900"]["version_blueprint"]=="2026-07-21"
assert [d["peso"] for d in s["dp900"]["dominios"]]==["25–30%","20–25%","15–20%","25–30%"]
assert s["diagnostico"]["en_clase"] is False
assert s["cierre"]["temporizador"]=="assets/learning/presentation-timer.js"

cs=next(x for m in course["modulos"] for x in m.get("sesiones",[]) if x["n"]==16)
assert cs["titulo"]=="Cierre del curso + preparación DP-900"
assert "~65 min" in cs["desc"] and "~100 min" in cs["desc"]
assert "blueprint 2026" in cs["tags"]

# Guía docente: la nueva intención debe quedar protegida.
for token in [
    "180 minutos = 165 útiles + 15 de pausa",
    "0–65 · Cierre del diplomado",
    "65–95 · DP-900",
    "110–175 · DP-900",
    "July 21, 2026",
    "5–6 preguntas oficiales",
    "temporizador de la presentación es el componente compartido de S15 v7"
]:
    assert token in guide, token

# Analítica S16 anterior sigue histórica y fuera del flujo activo.
dash=(ROOT/"revision/teacher-dashboard.html").read_text(encoding="utf-8")
legacy=(ROOT/"s16-analytics.html").read_text(encoding="utf-8")
assert "s16-analytics.html" not in dash
assert "Analítica histórica (versión anterior)" in legacy

print("OK · S16 v4: 65 min cierre + ~100 min DP-900 + timer S15 v7 + blueprint 2026")
