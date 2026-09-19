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
timer=TIMER.read_text(encoding="utf-8")
plan=json.loads(PLAN.read_text(encoding="utf-8"))
rplan=json.loads(RPLAN.read_text(encoding="utf-8"))
course=json.loads(COURSE.read_text(encoding="utf-8"))
rcourse=json.loads(RCOURSE.read_text(encoding="utf-8"))

assert html==rhtml, "S16 raíz/revision deben ser idénticas"
assert sheet==rsheet, "Cheat Sheet raíz/revision deben ser idénticos"
assert plan==rplan, "learning-plan raíz/revision deben ser idénticos"
assert course==rcourse, "curso.json raíz/revision deben ser idénticos"

titles=re.findall(r'<section class="slide[^"]*" data-title="([^"]+)"',html)
expected=[
"Portada","Recorrido","SQL que escribes","Pensamiento SQL","JOIN y conjuntos",
"De reglas a modelo","Integridad y DDL","SQL o NoSQL","OLTP a analítica",
"BigQuery físico","Anidados y formatos","S15 integró","Pausa",
"DP900 blueprint","DP900 transferencia","Core datos","Core roles",
"Relacional Azure","Relacional escenarios","Storage Azure","Cosmos DB",
"Analytics Azure","Databricks Fabric","Tiempo real","Power BI",
"Razonar DP900","DP900 práctico","Plan voucher","Cierre"
]
assert titles==expected, titles
assert len(titles)==29

# Shell y estilo tradicional.
assert 'class="toolbar"' in html
assert 'class="progress"' in html
assert 'class="ctlbar"' not in html
assert html.count('pre class="sqlviz"')==8
assert "pre.sqlviz .copybtn" in html
assert ".journey:before" in html and ".journey .step:before" in html
assert 'class="slide dense yellow" data-title="S15 integró"' in html
assert html.count("data-r")>=8

# SVG: cuatro flujos de escritorio + cuatro verticales para móvil.
assert html.count('class="joinviz s16-flowviz s16-desktop-flowviz"')==4
assert html.count('class="joinviz s16-flowviz s16-mobile-flowviz"')==4
assert '.s16-flowviz{display:none}' not in html
assert '.s16-mobile-flowviz{display:none}' in html
for flow_title in ["Recorrido","De reglas a modelo","OLTP a analítica","BigQuery físico"]:
    block=re.search(rf'<section class="slide[^"]*" data-title="{re.escape(flow_title)}".*?</section>',html,re.S)
    assert block and 's16-desktop-flowviz' in block.group(0) and 's16-mobile-flowviz' in block.group(0), flow_title

# Timer: S16 no mantiene otra implementación. Carga exactamente el componente de S15 v7.
assert '../../assets/learning/presentation-timer.js?v=20260916a' in html
for old in ['id="timeOv"','id="mini"','id="miniT"','id="minLibre"','data-start-break']:
    assert old not in html, f"Timer local obsoleto en S16: {old}"
assert 'data-title="Pausa" data-break="15"' in html
for token in [
    'id="andes-presentation-timer"','data-min="5"','data-min="10"','data-min="15"',
    'data-min="20"','data-free="1"','Personalizado · 7:30 o 25','Aplicar',
    'data-adjust="-300"','data-adjust="300"','▶ Iniciar','↺ Reiniciar',
    'El reloj es opcional. Arrástralo para moverlo o minimízalo.',
    '▶ Iniciar los 15 minutos'
]:
    assert token in timer, token

# La sesión final no vuelve a ser un formulario o examen custom.
main=re.search(r'<main class="stage">(.*?)</main>',html,re.S).group(1)
for bad in [
    "<textarea","<input","<select","qcard","send-report","data-post=","data-portfolio=",
    "portfolio-url","24 escenarios","48 componentes","C / T / L","Me faltó guía",
    "¿Dónde estuvo SQL?","Hay vocabulario desconocido","Autopercepción de salida",
    "Enviar diagnóstico al docente"
]:
    assert bad not in main, f"Contenido que no debe proyectarse: {bad}"

# Repaso conserva profundidad técnica, pero no vuelve a evaluarse.
for token in [
    "SELECT","DISTINCT","WHERE","BETWEEN","IN","LIKE","IS NULL","ORDER BY","LIMIT",
    "COUNT","SUM","AVG","MIN/MAX","GROUP BY","HAVING","INNER JOIN","LEFT JOIN",
    "RIGHT JOIN","FULL OUTER","UNION / ALL","WITH / CTE","CASE","COALESCE",
    "INSERT","UPDATE","DELETE","CREATE TABLE","ALTER TABLE","DROP TABLE",
    "FROM → WHERE → GROUP BY → agregación → HAVING → SELECT → ORDER BY → LIMIT",
    "Pregunta → grano esperado → tablas → llaves → unión → filtros → agregación → validación",
    "1FN/2FN/3FN","PRIMARY KEY","FOREIGN KEY","CHECK","modelo estrella",
    "Partición","Clustering","Pruning","UNNEST","Parquet"
]:
    assert token in html, token

# DP-900 v2: blueprint vigente y los cuatro dominios tienen desarrollo explícito.
for token in [
    "25–30%","20–25%","15–20%","21-jul-2026",
    "Core data concepts","Relational on Azure","Non-relational","Analytics",
    "Database Administrator","Data Engineer","Data Analyst",
    "Azure SQL Database","Azure SQL Managed Instance","SQL Server on Azure VM",
    "Azure Database for PostgreSQL","Blob Storage","Azure Files","Table Storage",
    "API for NoSQL","MongoDB","Cassandra","Gremlin","Table",
    "Azure Databricks","Microsoft Fabric","Power BI","Batch","Streaming / real time",
    "modelo semántico","Practice Assessment oficial","700+","45 min","65 min"
]:
    assert token in html, token

# Ya no hay tres casos finales de repaso después de la pausa.
for old in ["Transferencia final · sin nota","Reporte inflado","Pedido completo","Tablero histórico","Gran parte del razonamiento ya lo trabajaste"]:
    assert old not in html, old

# Recursos oficiales.
for url in [
    "credentials/certifications/resources/study-guides/dp-900",
    "practice-assessments-for-microsoft-certifications",
    "credentials/certifications/prepare-exam",
    "credentials/certifications/register-schedule-exam",
    "azure/cosmos-db/account-overview"
]:
    assert url in html, url

# Cheat Sheet sigue siendo 4 páginas con referentes.
assert len(re.findall(r'<section class="page"(?:\s|>)',sheet))==4
assert 'id="referentes-industria"' in sheet
for token in [
    "Cheat Sheet final · SQL y pensamiento de consulta","Normalización","CAP","Modelo estrella",
    "Partición","Clustering","Pruning","UNNEST","Parquet",
    "Rutas de profundización · referentes de industria","PostgreSQL · Table Expressions",
    "MongoDB · Data Modeling","Neo4j Fundamentals","Dimensional Modeling Techniques"
]:
    assert token in sheet, token

# Manifiestos.
s=plan["sesiones"]["16"]
assert s["titulo"]=="Cierre del curso + preparación DP-900"
assert s["modo"]=="consolidacion_y_preparacion_dp900"
assert s["distribucion_tiempo"]["cierre_diplomado_min"]==65
assert s["distribucion_tiempo"]["pausa_min"]==15
assert s["distribucion_tiempo"]["preparacion_dp900_min"]==100
assert s["diagnostico"]["en_clase"] is False
assert s["diagnostico"]["practice_assessment_oficial_en_vivo"]==6
assert s["diagnostico"]["banco_custom_en_clase"] is False
assert [x["peso"] for x in s["dp900"]]==["25–30%","20–25%","15–20%","25–30%"]

cs=next(x for m in course["modulos"] for x in m.get("sesiones",[]) if x["n"]==16)
assert cs["titulo"]=="Cierre del curso + preparación DP-900"
assert cs["modo"]=="consolidacion_y_preparacion_dp900"
assert "100 min de preparación DP-900" in cs["desc"]
assert "blueprint DP-900" in cs["tags"]
assert "Cosmos DB APIs" in cs["tags"]
assert "real-time analytics" in cs["tags"]

# Analítica S16 vieja sigue fuera del flujo activo.
dash=(ROOT/"revision/teacher-dashboard.html").read_text(encoding="utf-8")
legacy=(ROOT/"s16-analytics.html").read_text(encoding="utf-8")
assert "s16-analytics.html" not in dash
assert "Analítica histórica (versión anterior)" in legacy

# La guía debe proteger la nueva distribución.
for token in [
    "cierre del diplomado · 65 min","preparación DP-900 · 100 min",
    "skills measured as of July 21, 2026","seis preguntas oficiales",
    "presentation-timer.js?v=20260916a","No mantener un segundo timer local"
]:
    assert token in guide, token

print("OK · S16 v2: 65 min cierre + 100 min DP-900 + timer S15 v7 + 29 slides + SVG desktop/móvil")
