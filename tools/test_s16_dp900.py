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

html=DECK.read_text(encoding="utf-8")
rhtml=RDECK.read_text(encoding="utf-8")
sheet=SHEET.read_text(encoding="utf-8")
rsheet=RSHEET.read_text(encoding="utf-8")
guide=GUIDE.read_text(encoding="utf-8")
plan=json.loads(PLAN.read_text(encoding="utf-8"))
rplan=json.loads(RPLAN.read_text(encoding="utf-8"))
course=json.loads(COURSE.read_text(encoding="utf-8"))
rcourse=json.loads(RCOURSE.read_text(encoding="utf-8"))

assert html==rhtml, "S16 raíz/revision deben ser idénticas"
assert sheet==rsheet, "Cheat Sheet raíz/revision deben ser idénticos"
assert plan==rplan, "learning-plan raíz/revision deben ser idénticos"
assert course==rcourse, "curso.json raíz/revision deben ser idénticos"

titles=re.findall(r'<section class="slide[^"]*" data-title="([^"]+)"',html)
expected=["Portada","Recorrido","SQL que escribes","Pensamiento SQL","JOIN y conjuntos","De reglas a modelo","Integridad y DDL","SQL o NoSQL","OLTP a analítica","BigQuery físico","Anidados y formatos","S15 integró","Pausa","Tres casos","Resolución casos","Curso a DP900","Nombres Azure","DP900 práctico","Cheat sheet","Cierre"]
assert titles==expected, titles
assert len(titles)==20
assert html.count('class="micro"')>=6, "S16 debe mantener microactivaciones frecuentes sin nota"

# La sesión final no vuelve a ser formulario/examen.
for bad in [
    "<textarea","<input","<select","qcard","send-report","data-post=","data-portfolio=",
    "portfolio-url","24 escenarios","48 componentes","C / T / L","Me faltó guía",
    "¿Dónde estuvo SQL?","Hay vocabulario desconocido","La metodología trasladó",
    "Sin defensas","Autopercepción de salida","Enviar diagnóstico al docente","Hoy no vienes a demostrar otra vez que sabes","S15 convirtió lo anterior"
]:
    assert bad not in html, f"Contenido que no debe proyectarse: {bad}"

# SQL visible y pensamiento de consulta.
for token in [
    "SELECT","DISTINCT","WHERE","BETWEEN","IN","LIKE","IS NULL","ORDER BY","LIMIT",
    "COUNT","SUM","AVG","MIN/MAX","GROUP BY","HAVING","INNER JOIN","LEFT JOIN",
    "RIGHT JOIN","FULL OUTER","UNION / ALL","WITH / CTE","CASE","COALESCE",
    "INSERT","UPDATE","DELETE","CREATE TABLE","ALTER TABLE","DROP TABLE",
    "FROM → WHERE → GROUP BY → agregación → HAVING → SELECT → ORDER BY → LIMIT",
    "Pregunta → grano esperado → tablas → llaves → unión → filtros → agregación → validación"
]:
    assert token in html, token

# Cobertura conceptual acumulada.
for token in [
    "1FN/2FN/3FN","PRIMARY KEY","FOREIGN KEY","NOT NULL / UNIQUE","CHECK",
    "SQL / NoSQL","OLTP","OLAP","modelo estrella","Partición","Clustering","Pruning",
    "JSON / ARRAY / STRUCT","UNNEST","CSV","Parquet","S15 no añadió otro tema"
]:
    assert token in html, token

# Cierre con transferencia sin nota y puente Azure.
for token in [
    "Transferencia final · sin nota","Reporte inflado","Pedido completo","Tablero histórico",
    "Gran parte del razonamiento ya lo trabajaste","concepto conocido, nombre de proveedor nuevo",
    "Azure SQL Database","Managed Instance","SQL Server on Azure VM","Cosmos DB",
    "Databricks","Fabric","Power BI","5 preguntas oficiales"
]:
    assert token in html, token

for url in [
    "credentials/certifications/resources/study-guides/dp-900",
    "practice-assessments-for-microsoft-certifications",
    "credentials/certifications/prepare-exam",
    "credentials/certifications/register-schedule-exam"
]:
    assert url in html, url

# Cheat Sheet de tres páginas, no glosario mínimo.
assert sheet.count('<section class="page">')==3
for token in [
    "Cheat Sheet final · SQL y pensamiento de consulta",
    "Orden lógico del motor","INNER JOIN","FULL OUTER JOIN","UNION ALL","WITH / CTE",
    "CASE","COALESCE","Normalización","1FN","2FN","3FN","DDL · estructura","DML · datos",
    "Clave-valor","Grafo","Serie de tiempo","CAP","OLTP","OLAP","Modelo estrella",
    "ETL","ELT","Partición","Clustering","Pruning","ARRAY","STRUCT","UNNEST","Parquet",
    "Azure SQL Managed Instance","Blob Storage","Microsoft Fabric","Checklist antes de confiar"
]:
    assert token in sheet, token

# Manifiestos: S16 ya no promete otro diagnóstico custom.
s=plan["sesiones"]["16"]
assert s["titulo"]=="Cierre del curso + puente DP-900"
assert s["diagnostico"]["en_clase"] is False
assert s["diagnostico"]["practice_assessment_oficial_en_vivo"]==5
assert s["cierre"]["no_recopilar"]==["respuestas abiertas S1","mini encuesta adicional","URL de portafolio","diagnóstico S16 al docente"]
assert "tres casos finales sin nota" in s["objetivo"].casefold()

cs=next(x for m in course["modulos"] for x in m.get("sesiones",[]) if x["n"]==16)
assert cs["titulo"]=="Cierre del curso + puente DP-900"
assert "24 escenarios" not in cs["desc"]
assert "48 componentes" not in cs["desc"]
assert "Cheat Sheet" in cs["desc"]
assert any(r["href"]=="Presentaciones/M6/glosario-cierre-s16.html" and "Cheat Sheet" in r["txt"] for r in cs["recursos"])

dash=(ROOT/"revision/teacher-dashboard.html").read_text(encoding="utf-8")
legacy=(ROOT/"s16-analytics.html").read_text(encoding="utf-8")
assert "s16-analytics.html" not in dash, "La analítica S16 no debe seguir en la navegación docente activa"
assert "Analítica histórica (versión anterior)" in legacy
assert "la S16 actual ya no envía diagnósticos" in legacy

# La guía protege explícitamente la nueva intención.
for token in [
    "La última sesión no es otra evaluación",
    "No proyectar quejas",
    "No repetir las cinco preguntas abiertas de S1",
    "No hacer un segundo examen custom después de S15",
    "No pedir portafolios",
    "No enviar diagnóstico docente",
    "Una idea cognitiva por diapositiva",
    "Practice Assessment oficial",
    "Cheat Sheet final · 3 páginas"
]:
    assert token in guide, token

print("OK · S16: cierre fuerte + SQL completo + 3 casos sin nota + puente DP-900 + Cheat Sheet 3 páginas")
