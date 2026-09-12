from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def rw(rel: str, fn) -> None:
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    new = fn(text)
    if new != text:
        p.write_text(new, encoding="utf-8")


def insert_before_close(text: str, fragment: str) -> str:
    marker = '<section class="slide dark" data-title="Cierre">'
    if fragment.split('data-title="', 1)[1].split('"', 1)[0] in text:
        return text
    if marker in text:
        return text.replace(marker, fragment + "\n" + marker, 1)
    marker = '<section class="slide mid" data-title="Cierre">'
    if marker in text:
        return text.replace(marker, fragment + "\n" + marker, 1)
    return text


# S9: el título también debe reflejar que normalización ya no se vuelve a dictar.
rw(
    "Presentaciones/M3/sesion-9-ddl-supabase.html",
    lambda t: t.replace(
        "<title>Sesión 9 · Supabase, normalización y DDL · ANDESDB</title>",
        "<title>Sesión 9 · Supabase y DDL · ANDESDB</title>",
    ),
)


# S13: sesión corta = 75 min de trabajo autónomo real y cierre en 145 min.
def fix_s13(t: str) -> str:
    t = t.replace("50–110 min · autónomo guiado", "50–125 min · autónomo guiado")
    t = t.replace(
        '<section class="slide dense" data-title="Reasoning Check">\n<div class="ey">🔍 Reasoning Check</div>',
        '<section class="slide dense" data-title="Reasoning Check">\n<div class="ey">125–135 min · 🔍 Reasoning Check</div>',
    )
    t = t.replace(
        '<section class="slide dense" data-title="Checkpoint">\n<div class="ey">Evidencia · sin receta</div>',
        '<section class="slide dense" data-title="Checkpoint">\n<div class="ey">135–145 min · evidencia sin receta</div>',
    )
    return t

rw("Presentaciones/M5/sesion-13-laboratorio-bigquery.html", fix_s13)


# S14: el mapa Azure se usa por casos, no como catálogo de nombres.
def fix_s14(t: str) -> str:
    fragment = '''<section class="slide dense" data-title="Transferencia Azure por casos">
<div class="ey">DP-900 · razona antes de nombrar</div><h2>El servicio aparece después del requisito</h2>
<table class="data"><tr><th>Necesidad</th><th>Familia / servicio a reconocer</th><th>Por qué</th></tr>
<tr><td>CSV/Parquet históricos y objetos</td><td><b>Azure Blob Storage</b></td><td>almacenamiento de objetos</td></tr>
<tr><td>carpetas compartidas mediante protocolo de archivos</td><td><b>Azure Files</b></td><td>recurso compartido de archivos</td></tr>
<tr><td>clave/valor simple y económico</td><td><b>Azure Table Storage</b></td><td>NoSQL tabular simple</td></tr>
<tr><td>documentos distribuidos y baja latencia global</td><td><b>Azure Cosmos DB</b></td><td>NoSQL administrado y distribuido</td></tr>
<tr><td>ingeniería/analítica a escala</td><td><b>Microsoft Fabric / Azure Databricks</b></td><td>procesamiento y analítica</td></tr>
<tr><td>consumo de indicadores</td><td><b>Power BI</b></td><td>capa semántica y visualización</td></tr></table>
<div class="checkpoint"><b>Reasoning Check:</b> “tengo JSON” no basta para elegir Cosmos DB. Declara patrón de acceso, consistencia, distribución y carga antes del producto.</div>
<div class="brand"><span>ANDESDB · transferencia, no memorización</span><span>Sesión 14 · BigQuery anidado + mapa Azure</span></div></section>'''
    return insert_before_close(t, fragment)

rw("Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html", fix_s14)


# Mapa DP-900: granularidad objetivo -> sesión -> evidencia -> nivel de cobertura.
dp900 = {
    "version": "2026-07-21",
    "regla": "concepto → evidencia → transferencia → reconocimiento del servicio",
    "niveles": {
        "aprendido": "el estudiante lo construye o explica desde un problema",
        "transferido": "lo aplica en una tecnología distinta",
        "reconocido": "identifica el servicio o término del blueprint sin convertir la clase en catálogo"
    },
    "dominios": [
        {
            "dominio": "Core data concepts",
            "peso": "25–30%",
            "objetivos": [
                {"objetivo": "structured, semi-structured and unstructured data", "sesiones": [1, 2, 11, 14], "evidencia": "clasificación de casos + documentos JSON", "nivel": "aprendido"},
                {"objetivo": "common file formats: CSV, JSON and Parquet", "sesiones": [2, 13, 14], "evidencia": "carga CSV + comparación JSON/Parquet", "nivel": "transferido"},
                {"objetivo": "transactional vs analytical workloads", "sesiones": [9, 12, 13], "evidencia": "PostgreSQL operacional vs modelo estrella/BigQuery", "nivel": "aprendido"},
                {"objetivo": "data roles: DBA, data engineer, data analyst", "sesiones": [1, 16], "evidencia": "pre/post de roles", "nivel": "aprendido"}
            ]
        },
        {
            "dominio": "Relational data on Azure",
            "peso": "20–25%",
            "objetivos": [
                {"objetivo": "relational concepts: tables, keys and relationships", "sesiones": [4, 7, 8, 9], "evidencia": "JOIN + modelo ER + PK/FK", "nivel": "aprendido"},
                {"objetivo": "normalization and why it is used", "sesiones": [8, 9], "evidencia": "anomalía → dependencia → 1FN/2FN/3FN", "nivel": "aprendido"},
                {"objetivo": "common SQL statements", "sesiones": [2, 3, 4, 5, 9], "evidencia": "consultas + DDL + pruebas", "nivel": "aprendido"},
                {"objetivo": "database objects: tables and views; indexes at recognition level", "sesiones": [5, 9, 16], "evidencia": "CREATE TABLE + VIEW opcional + escenario de reconocimiento", "nivel": "transferido"},
                {"objetivo": "Azure SQL Database, Azure SQL Managed Instance and SQL Server on Azure VMs", "sesiones": [14, 16], "evidencia": "escenarios de selección por nivel de administración", "nivel": "reconocido"},
                {"objetivo": "Azure Database for PostgreSQL and MySQL", "sesiones": [9, 14, 16], "evidencia": "transferencia desde PostgreSQL/Supabase a servicio administrado Azure", "nivel": "reconocido"}
            ]
        },
        {
            "dominio": "Non-relational data on Azure",
            "peso": "15–20%",
            "objetivos": [
                {"objetivo": "Azure Blob Storage", "sesiones": [14, 16], "evidencia": "caso CSV/Parquet/objetos", "nivel": "reconocido"},
                {"objetivo": "Azure Files", "sesiones": [14, 16], "evidencia": "caso de recurso compartido de archivos", "nivel": "reconocido"},
                {"objetivo": "Azure Table Storage", "sesiones": [10, 14, 16], "evidencia": "caso clave/valor simple", "nivel": "reconocido"},
                {"objetivo": "document and key-value use cases", "sesiones": [10, 11], "evidencia": "rúbrica SQL/NoSQL + Firestore/Atlas", "nivel": "aprendido"},
                {"objetivo": "Azure Cosmos DB use cases and characteristics", "sesiones": [11, 14, 16], "evidencia": "partición/consistencia + escenario de servicio", "nivel": "transferido"},
                {"objetivo": "Cosmos DB APIs at recognition level", "sesiones": [11, 16], "evidencia": "micro-preguntas DP-900", "nivel": "reconocido"}
            ]
        },
        {
            "dominio": "Analytics workload on Azure",
            "peso": "25–30%",
            "objetivos": [
                {"objetivo": "data ingestion and processing", "sesiones": [12, 13, 14], "evidencia": "ETL/ELT + carga BigQuery + transformación", "nivel": "aprendido"},
                {"objetivo": "analytical data stores and data warehouses", "sesiones": [12, 13], "evidencia": "grano + hechos/dimensiones + warehouse cloud", "nivel": "aprendido"},
                {"objetivo": "star schema, facts, dimensions and measures", "sesiones": [12, 13, 15], "evidencia": "modelo estrella + validación de medidas", "nivel": "aprendido"},
                {"objetivo": "batch vs streaming", "sesiones": [12, 16], "evidencia": "clasificación de escenarios", "nivel": "aprendido"},
                {"objetivo": "Microsoft Fabric and Azure Databricks", "sesiones": [12, 14, 16], "evidencia": "transferencia de arquitectura", "nivel": "reconocido"},
                {"objetivo": "real-time analytics services at recognition level", "sesiones": [12, 16], "evidencia": "escenarios de streaming/tiempo real", "nivel": "reconocido"},
                {"objetivo": "Power BI", "sesiones": [14, 16], "evidencia": "capa de consumo/visualización", "nivel": "reconocido"}
            ]
        }
    ]
}
(ROOT / "assets/learning/dp900-map.json").write_text(json.dumps(dp900, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# Instructor View: mantener la estructura común, pero con decisiones específicas por sesión.
spec = {
1: ("¿Cómo pasa un dato de existir a generar una decisión?", "confundir dato, herramienta y valor o asumir que todos los roles hacen lo mismo", "describir la cadena evento → dato → almacenamiento → transformación → consumidor → decisión", "pretest + cadena de valor", "Reduce ejemplos; conserva diagnóstico y roles.", "Pide clasificar un caso nuevo y justificar el rol responsable."),
2: ("¿Cómo convierto una pregunta sencilla en mi primera consulta?", "copiar SELECT sin poder explicar SELECT/FROM/WHERE/ORDER BY/LIMIT", "traducir una pregunta a columnas, tabla, filtro, orden y límite", "checkpoint de las 3 películas PG más largas", "Omite comparaciones opcionales de motores; conserva práctica y checkpoint.", "Cambia la pregunta sin nombrar las cláusulas y exige explicación."),
3: ("¿Cuándo filtro filas y cuándo filtro grupos?", "usar HAVING y WHERE como si fueran intercambiables", "explicar qué representa una fila antes y después de GROUP BY", "reto de calificaciones con >180 películas", "Conserva GROUP BY/HAVING; mueve filtros repetitivos a repaso.", "Pide dos consultas parecidas, una con WHERE y otra con HAVING, y que expliquen la diferencia."),
4: ("¿Qué relación necesito para responder una pregunta que una tabla sola no contesta?", "usar INNER por reflejo y corregir multiplicaciones con DISTINCT", "declarar grano y justificar INNER vs LEFT", "checkpoint de películas incluso sin alquiler + Reasoning Check", "Prioriza INNER, LEFT, NULL y el checkpoint; RIGHT/FULL quedan en reconocimiento.", "Entrega una relación nueva y pide predecir cardinalidad antes del JOIN."),
5: ("¿Cómo diseño la tabla resultado antes de escribir SQL?", "unir fuentes con granos distintos y descubrir el error al final", "aplicar los seis pasos del Método ANDESDB", "consulta integradora con validación de conteos/totales", "Conserva grano, preagregación y validación; VIEW es extensión.", "Pide resolver el mismo resultado por dos caminos y comparar."),
6: ("¿Qué puedo afirmar del negocio a partir de la evidencia disponible?", "convertir un patrón o DEFAULT en una ley de negocio", "separar restricción, permiso, patrón e hipótesis", "tabla observación → certeza → evidencia → regla → pregunta", "No abras OLTP/OLAP; conserva el Reasoning Check de DEFAULT.", "Da una nueva observación ambigua y exige diseñar la pregunta al negocio."),
7: ("¿Cómo convierto reglas en entidades, atributos, relaciones y cardinalidades?", "crear entidades por sustantivo sin justificar identidad o cardinalidad", "rastrear cada decisión del modelo hasta una regla", "modelo v1 + decisiones defendibles", "Reduce discusión estética; conserva reglas y defensa.", "Introduce una regla nueva que obligue a cambiar una cardinalidad."),
8: ("¿Qué anomalía revela que un dato está en el lugar equivocado?", "memorizar 1FN/2FN/3FN sin ver dependencia o anomalía", "explicar anomalía → dependencia → separación → reconstrucción", "modelo final + normalización + transferencia", "Corta en 150 min de núcleo; la precisión mesero–mesa usa el colchón.", "Aplica normalización a un mini-caso fuera del restaurante."),
9: ("¿Cómo hago ejecutables y comprobables las reglas del modelo?", "consumir la sesión en onboarding o reenseñar normalización", "crear PK/FK/CHECK/DEFAULT y demostrar su efecto con pruebas negativas", "schema.sql + tests.sql", "Usa la ruta de 165 min; no reenseñes formas normales.", "Pide una restricción adicional y su prueba que debe fallar."),
10:("¿Qué evidencia necesito antes de decidir SQL o NoSQL?", "elegir por volumen, moda o la frase 'escala más'", "defender patrón de acceso, consistencia, forma y costo/riesgo", "rúbrica 4/4 + caso de información insuficiente", "Conserva menos casos pero completa la defensa.", "Quita un dato del requerimiento y pregunta qué información falta para decidir."),
11:("¿Qué debe vivir embebido, referenciado y en qué fuente de verdad?", "enseñar 'documento = temporal / SQL = permanente' como ley", "justificar embed/reference y distinguir estado transitorio de persistencia", "2 documentos + 2 filtros + checkout localizado", "Si falla cloud, usa contingencia pero marca qué evidencia falta repetir en real.", "Provoca fallo parcial del checkout y discute atomicidad."),
12:("¿Por qué una pregunta analítica exige un grano explícito?", "memorizar servicios antes de dominar grano, hechos y dimensiones", "detectar 368.000 vs 184.000 explicando multiplicación de filas", "estrella + laboratorio + Reasoning Check", "Detente en núcleo antes del catálogo cloud.", "Cambia el grano de la pregunta y obliga a rediseñar la tabla de hechos."),
13:("¿Qué cambia cuando el mismo modelo llega a BigQuery?", "perder la clase buscando botones o cargar tablas sin validar", "lograr preflight, 44 filas, 1.455.000 y leer bytes procesados", "75 min autónomos + consulta nueva validada", "Salta ejemplos; nunca saltes validación ni checkpoint final.", "Compara dos consultas equivalentes y explica cuál lee menos."),
14:("¿Cuándo conviene anidar y cómo transfiero el concepto a Azure?", "creer que anidar deshace la normalización o elegir Azure por formato solamente", "usar STRUCT/ARRAY/UNNEST y decidir servicios por requisito", "consulta anidada + mapa Azure por casos", "Prioriza UNNEST y casos; deja catálogo detallado como referencia.", "Pide rediseñar un pedido relacional como documento y defender qué no anidaría."),
15:("¿Puedo construir, validar y defender una solución sin receta?", "entregar archivos que ejecutan pero no poder explicar decisiones", "producir artefactos reproducibles y modificar una parte durante la defensa", "6 archivos + rúbrica + defensa de 90 s", "No recortes validaciones ni defensa; reduce alcance del caso.", "Introduce un cambio de requisito al final y evalúa adaptación."),
16:("¿Qué aprendí y qué hueco concreto me falta para DP-900?", "repetir Azure como catálogo en vez de diagnosticar transferencia", "volver al pretest, ubicar errores por dominio y planear recuperación", "pre/post + mapa objetivo/evidencia + plan individual", "Prioriza diagnóstico y dominios débiles; no intentes repetir 16 sesiones.", "Genera escenarios cruzados donde primero se nombra la necesidad y al final el servicio.")
}

for n, (q, err, gate, evidence, late, early) in spec.items():
    body = f"""# S{n:02d} · Guía docente\n\n## Pregunta central\n{q}\n\n## Error esperable principal\n{err}.\n\n## Dónde probablemente se atascan\n- Al traducir una pregunta de negocio a una unidad/grano de respuesta.\n- Al confundir que algo ejecute con que responda correctamente.\n- Al explicar la decisión con evidencia en lugar de repetir vocabulario.\n\n## No avanzar hasta que…\nEl grupo pueda {gate}.\n\n## Evidencia mínima\n{evidence}.\n\n## Si vas 15 minutos atrasado\n{late}\n\n## Si vas 15 minutos adelantado\n{early}\n\n## Intervención docente\nAntes de mostrar una solución, pide una predicción o una explicación causal. Si el error es conceptual, conserva el error visible el tiempo suficiente para compararlo con el resultado correcto.\n\n## Regla de cierre\nCierra con evidencia observable y una explicación breve. “¿Se entendió?” no cuenta como evaluación.\n"""
    p = ROOT / "docs/instructor" / f"S{n:02d}.md"
    p.write_text(body, encoding="utf-8")

print("Remate benchmark aplicado: S9/S13/S14, DP-900 e Instructor View.")
