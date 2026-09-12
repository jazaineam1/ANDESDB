from __future__ import annotations

import html as html_lib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] if Path(__file__).resolve().parent.name == 'tools' else Path.cwd()

PRESENTACIONES = {
    2: ROOT / 'Presentaciones/M2/sesion-2-bases-de-datos-y-primeras-consultas.html',
    3: ROOT / 'Presentaciones/M2/sesion-3-filtros-y-agregaciones.html',
    4: ROOT / 'Presentaciones/M2/sesion-4-uniones-de-tablas.html',
    5: ROOT / 'Presentaciones/M2/sesion-5-algoritmica-de-tablas.html',
    6: ROOT / 'Presentaciones/M3/sesion-6-reglas-de-negocio.html',
    7: ROOT / 'Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html',
    8: ROOT / 'Presentaciones/M3/sesion-8-modelado-y-normalizacion.html',
    9: ROOT / 'Presentaciones/M3/sesion-9-ddl-supabase.html',
    10: ROOT / 'Presentaciones/M4/sesion-10-sql-o-nosql.html',
    11: ROOT / 'Presentaciones/M4/sesion-11-documentos-de-verdad.html',
    12: ROOT / 'Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html',
}

TITULOS = {
    1: 'Cómo generamos valor con datos', 2: 'De la decisión a la primera consulta',
    3: 'Filtrar mejor y resumir', 4: 'Uniones de tablas', 5: 'Algorítmica de tablas',
    6: 'Reglas de negocio', 7: 'De las reglas al modelo', 8: 'Modelado y normalización',
    9: 'SQL para creación de tablas', 10: 'Taller de casos: ¿SQL o NoSQL?',
    11: 'Documentos de verdad', 12: 'Fundamentos de data warehouse',
    13: 'Laboratorio BigQuery', 14: 'BigQuery anidado + mapa Azure',
    15: 'Desafío final integrador', 16: 'Cierre + preparación DP-900',
}


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')


def slide_spans(text: str) -> list[tuple[int, int]]:
    opening = re.compile(r'<section\b[^>]*\bclass=["\'][^"\']*\bslide\b[^"\']*["\'][^>]*>', re.I)
    any_section = re.compile(r'</?section\b[^>]*>', re.I)
    spans: list[tuple[int, int]] = []
    for m in opening.finditer(text):
        depth = 0
        end = None
        for tag in any_section.finditer(text, m.start()):
            raw = tag.group(0)
            if raw.startswith('</'):
                depth -= 1
                if depth == 0:
                    end = tag.end()
                    break
            else:
                depth += 1
        if end:
            spans.append((m.start(), end))
    clean: list[tuple[int, int]] = []
    for span in spans:
        if not any(a <= span[0] and span[1] <= b for a, b in clean):
            clean.append(span)
    return clean


def visible_text(fragment: str) -> str:
    fragment = re.sub(r'<script\b.*?</script>', ' ', fragment, flags=re.I | re.S)
    fragment = re.sub(r'<style\b.*?</style>', ' ', fragment, flags=re.I | re.S)
    fragment = re.sub(r'<[^>]+>', ' ', fragment)
    fragment = html_lib.unescape(fragment)
    return re.sub(r'\s+', ' ', fragment).strip().lower()


def data_title(fragment: str) -> str:
    m = re.search(r'data-title=["\']([^"\']+)', fragment, re.I)
    return html_lib.unescape(m.group(1)).lower() if m else ''


def insert_before_last_slide(text: str, block: str) -> str:
    spans = slide_spans(text)
    if not spans:
        raise RuntimeError('No se encontraron diapositivas')
    pos = spans[-1][0]
    return text[:pos] + '\n' + block.strip() + '\n\n' + text[pos:]


def remove_slides(text: str, predicate) -> tuple[str, list[str]]:
    spans = slide_spans(text)
    removed: list[str] = []
    for start, end in reversed(spans):
        frag = text[start:end]
        if predicate(frag):
            removed.append(data_title(frag) or visible_text(frag)[:70])
            text = text[:start] + text[end:]
    removed.reverse()
    return text, removed


def slide(n: int, title: str, eyebrow: str, heading: str, body: str, classes: str = 'slide dense') -> str:
    return f'''<section class="{classes}" data-title="{html_lib.escape(title, quote=True)}">
<div class="ey">{eyebrow}</div><h2>{heading}</h2>{body}
<div class="brand"><span>ANDESDB · mejora benchmark</span><span>Sesión {n} · {TITULOS[n]}</span></div></section>'''


def ensure_accessibility(text: str) -> str:
    text = re.sub(r'<div class="fb"></div>', '<div class="fb" aria-live="polite"></div>', text)
    text = re.sub(r'<iframe(?![^>]*\btitle=)', '<iframe title="Recurso interactivo de apoyo de la sesión"', text, flags=re.I)
    text = re.sub(r'<svg(?![^>]*\brole=)', '<svg role="img" aria-label="Diagrama de apoyo de la sesión"', text, flags=re.I)
    return text


def enhance_existing() -> dict[int, dict[str, list[str] | int]]:
    report = {}
    for n, path in PRESENTACIONES.items():
        text = read(path); original = text; text = ensure_accessibility(text); removed = []
        if n == 2:
            text = insert_before_last_slide(text, slide(2, 'Checkpoint independiente', 'Evidencia · 5 minutos · sin pista', '¿Puedes construir una consulta sin copiar el patrón anterior?', '<div class="ctx"><b>Pregunta:</b> encuentra las <b>3 películas PG más largas</b> y muestra <code>title</code> y <code>length</code>.</div><div class="g2"><div class="card"><h3>Antes de escribir</h3><ul class="checks"><li>¿Qué columnas necesitas?</li><li>¿Qué tabla las tiene?</li><li>¿Qué filas entran?</li><li>¿Cómo se ordenan?</li><li>¿Cuántas deben quedar?</li></ul></div><div class="card blue"><h3>Criterio de logro</h3><p>La consulta devuelve exactamente tres filas correctas y puedes explicar <code>WHERE</code>, <code>ORDER BY</code> y <code>LIMIT</code>.</p><p class="small">Predice → ejecuta → explica.</p></div></div>'))
        elif n == 3:
            text = insert_before_last_slide(text, slide(3, 'Checkpoint: filas o grupos', 'Evidencia · 6 minutos', '<code>WHERE</code> filtra filas; <code>HAVING</code> filtra grupos', '<div class="g2"><div class="card"><h3>Reto sin receta</h3><p>Marketing quiere las calificaciones con <b>más de 180 películas</b> y su <b>duración promedio</b>, ordenadas de mayor a menor promedio.</p></div><div class="card blue"><h3>Explica</h3><ul class="checks"><li>¿qué representa una fila antes de agrupar?</li><li>¿qué representa después?</li><li>¿por qué el filtro de cantidad no pertenece a <code>WHERE</code>?</li></ul></div></div>'))
        elif n == 4:
            text = insert_before_last_slide(text, slide(4, 'NULL después de LEFT JOIN', 'Concepto difícil · 8 minutos', 'Que falte una coincidencia también es información', '<div class="g2"><div><pre><code>SELECT f.title, i.inventory_id\nFROM film AS f\nLEFT JOIN inventory AS i\n  ON f.film_id = i.film_id\nWHERE i.inventory_id IS NULL;</code></pre></div><div class="card"><h3>Predice</h3><p>¿Qué películas aparecerán?</p><div class="warn"><b>No uses:</b> <code>= NULL</code>. Usa <code>IS NULL</code> / <code>IS NOT NULL</code>.</div></div></div>') + '\n' + slide(4, 'Reasoning Check · JOIN', '🔍 Reasoning Check', 'La consulta corre. ¿El resultado tiene el grano que esperabas?', '<div class="ctx">Esperabas una fila por película. Después de unir <code>film → inventory → rental</code> aparecen miles de filas.</div><div class="g2"><div class="card"><h3>No respondas con DISTINCT</h3><p>Explica qué representa ahora una fila y por qué una película puede repetirse.</p></div><div class="card blue"><h3>Criterio</h3><p>Distingues duplicados de datos de una multiplicación legítima por cambio de grano.</p></div></div>'))
        elif n == 5:
            text = insert_before_last_slide(text, slide(5, 'Método ANDESDB', 'Método reusable · antes de escribir SQL', 'Seis pasos para construir una tabla sin inflar las cuentas', '<div class="g2"><div class="card"><ol><li><b>Declara la fila final.</b></li><li><b>Dibuja las columnas.</b></li><li><b>Lleva cada fuente al mismo grano.</b></li></ol></div><div class="card blue"><ol start="4"><li><b>Une.</b></li><li><b>Calcula.</b></li><li><b>Valida conteos y totales.</b></li></ol></div></div><div class="hintbox"><strong>Transferencia:</strong> volverá en S12 y S15.</div>'))
        elif n == 6:
            def s6_analytic(frag):
                t = visible_text(frag)
                return (('bloque 5' in t or 'bloque 6' in t) and any(x in t for x in ('oltp','olap','data lake','data warehouse','etl','elt','laguna','bodega')))
            text, removed = remove_slides(text, s6_analytic)
            text = text.replace('<article><b>5 y 6</b><h3>Operar o entender</h3><p>OLTP, OLAP, y d&oacute;nde acaba viviendo el dato.</p></article>', '<article><b>5</b><h3>Cierre y transferencia</h3><p>De evidencia a regla comprobable; la pr&oacute;xima sesi&oacute;n convierte esas reglas en modelo.</p></article>')
            text = re.sub(r'<code>OLTP</code><code>OLAP</code><code>data lake</code><code>data warehouse</code><code>ETL</code><code>ELT</code>', '', text, flags=re.I)
            text = insert_before_last_slide(text, slide(6, 'Reasoning Check · DEFAULT', '🔍 Reasoning Check', 'La tabla acepta el SQL. ¿La regla quedó realmente protegida?', '<pre><code>estado VARCHAR(20) DEFAULT \'abierto\'</code></pre><div class="g2"><div class="card"><h3>Afirmación</h3><p>“Todo pedido siempre empieza abierto porque pusimos <code>DEFAULT</code>”.</p></div><div class="card blue"><h3>Tu tarea</h3><p>Decide si es cierto y propón una prueba que pueda falsarlo. Diferencia valor por omisión de restricción.</p></div></div><div class="ctx"><b>Salida:</b> observación → certeza → evidencia → regla → pregunta pendiente.</div>'))
        elif n == 7:
            text = insert_before_last_slide(text, slide(7, 'Criterio de salida', 'Checkpoint · producto de la sesión', 'No necesitas “terminar el modelo”; necesitas poder defenderlo', '<div class="g2"><div class="card"><h3>Debes poder hacer</h3><ul class="checks"><li>convertir una regla en sustantivos candidatos</li><li>distinguir entidad de atributo</li><li>proponer relaciones y cardinalidades</li></ul></div><div class="card blue"><h3>Debes poder explicar</h3><ul class="checks"><li>qué regla originó cada decisión</li><li>qué sigue siendo hipótesis</li><li>qué pregunta devolver al negocio</li></ul></div></div><div class="warn"><b>No se califica por número de entidades.</b></div>'))
        elif n == 8:
            text = insert_before_last_slide(text, slide(8, 'Supuesto mesero–mesa', 'Precisión del modelo', 'Una cardinalidad solo es correcta bajo un supuesto explícito', '<div class="ctx"><b>Supuesto:</b> cada mesa tiene un único mesero asignado durante el período modelado.</div><div class="g2"><div class="card"><h3>Con ese supuesto</h3><p><code>mesa.mesero_id</code> basta.</p></div><div class="card blue"><h3>Si cambia por turno</h3><p>aparece <code>asignacion_mesa_mesero</code> con vigencia/turno.</p></div></div><div class="hintbox"><strong>Transferencia:</strong> aplica 1FN–3FN a un mini-caso distinto del restaurante explicando primero la anomalía.</div>'))
        elif n == 9:
            def overload(frag):
                t = data_title(frag)
                return t.startswith('1fn') or t.startswith('2fn') or t.startswith('3fn') or t.startswith('alter y drop') or t.startswith('unique con criterio')
            text, removed = remove_slides(text, overload)
            route = slide(9, 'Ruta de 165 minutos', 'Contrato de clase · núcleo obligatorio', 'Hoy no volvemos a enseñar normalización: la usamos para construir', '<div class="g2"><div class="card"><h3>0–90 min</h3><ul class="checks"><li>preflight Supabase: entrar, SQL Editor, <code>SELECT 1</code></li><li>modelo → <code>CREATE TABLE</code></li><li><code>plato</code> y <code>pedido</code></li></ul></div><div class="card blue"><h3>105–165 min</h3><ul class="checks"><li><code>linea_pedido</code> + PK/FK</li><li><code>NOT NULL</code>, <code>CHECK</code>, <code>DEFAULT</code></li><li>romper restricciones a propósito</li><li>checkpoint sin receta</li></ul></div></div><div class="warn"><b>Recuperación S8: 5 minutos.</b></div>')
            checkpoint = slide(9, 'Checkpoint · esquema protegido', 'Evidencia · schema.sql + tests.sql', 'Crear una tabla no demuestra que la regla esté protegida', '<div class="g2"><div><pre><code>-- Debe funcionar\nINSERT INTO plato (...);\n\n-- Debe fallar: precio negativo\nINSERT INTO plato (...);\n\n-- Debe fallar: FK huérfana\nINSERT INTO linea_pedido (...);</code></pre></div><div class="card"><h3>Criterio</h3><p>Entregas <code>schema.sql</code> y <code>tests.sql</code> y explicas qué restricción acepta o rechaza cada prueba.</p></div></div>')
            text = insert_before_last_slide(text, route + '\n' + checkpoint)
            text = text.replace('14 en vez de 6', '14 en vez de 11').replace('14 en lugar de 6', '14 en lugar de 11')
        elif n == 10:
            text = insert_before_last_slide(text, slide(10, 'Rúbrica de decisión', 'Evaluación · 4 puntos', 'Una tecnología no se defiende con “escala más”', '<div class="g2"><div class="card"><h3>1 punto cada uno</h3><ul class="checks"><li>patrón de acceso</li><li>consistencia requerida</li><li>forma/evolución del dato</li><li>costo o riesgo aceptado</li></ul></div><div class="card blue"><h3>Caso trampa</h3><p>“Necesitamos guardar 50 millones de registros. ¿SQL o NoSQL?”</p><p><b>Respuesta excelente:</b> aún no hay información suficiente. Formula tres preguntas.</p></div></div>'))
        elif n == 11:
            text = text.replace('Mientras se arma, el carrito es estado de pantalla — se pierde sin costo. En el instante en que se confirma, deja de serlo y se vuelve un hecho del negocio, con precio congelado y una fila que no se borra.', 'Mientras se arma, el carrito es un estado transitorio y mutable del proceso. En nuestra arquitectura lo persistimos temporalmente en Firestore. Al confirmar, nace un hecho permanente del negocio en PostgreSQL, con cantidades y precios históricos.')
            text = text.replace('Mientras se arma, el carrito es estado de pantalla &mdash; se pierde sin costo. En el instante en que se confirma, deja de serlo y se vuelve un hecho del negocio, con precio congelado y una fila que no se borra.', 'Mientras se arma, el carrito es un estado transitorio y mutable del proceso. En nuestra arquitectura lo persistimos temporalmente en Firestore. Al confirmar, nace un hecho permanente del negocio en PostgreSQL, con cantidades y precios hist&oacute;ricos.')
            text = insert_before_last_slide(text, slide(11, 'Reasoning Check · checkout', '🔍 Reasoning Check', '¿Qué ocurre si el pedido se crea pero sus líneas fallan?', '<div class="g2"><div class="card"><h3>Escenario</h3><p>El checkout escribe <code>pedido</code>. La segunda escritura falla antes de completar <code>linea_pedido</code>.</p></div><div class="card blue"><h3>Discute</h3><ul class="checks"><li>¿qué inconsistencia queda?</li><li>¿qué significa “todo o nada”?</li><li>¿qué merece una transacción?</li></ul></div></div><div class="ctx"><b>Evidencia:</b> 2 documentos · ≥2 filtros · embed/reference defendido · compra localizada en PostgreSQL.</div>'))
        elif n == 12:
            core = slide(12, 'Núcleo y referencia', 'Control de carga cognitiva', 'Lo obligatorio termina antes del catálogo de servicios', '<div class="g2"><div class="card"><h3>Núcleo</h3><p>dolor operacional → OLTP/OLAP → warehouse → ETL/ELT → grano → hechos/dimensiones → medidas → estrella → laboratorio → batch/streaming.</p></div><div class="card blue"><h3>Referencia / extensión</h3><p>hecho acumulativo, tabla detallada Azure y comparación Azure–Google Cloud.</p></div></div><div class="warn"><b>Si el grupo no puede declarar el grano, no avances a memorizar productos cloud.</b></div>')
            reason = slide(12, 'Reasoning Check · 368.000', '🔍 Reasoning Check', 'Las dos consultas ejecutan. Solo una responde la pregunta correcta.', '<div class="g2"><div class="card"><h3>Resultado A</h3><p class="quote">$368.000</p></div><div class="card blue"><h3>Resultado B</h3><p class="quote">$184.000</p></div></div><div class="ctx">Identifica el grano, encuentra dónde se multiplican filas y explica por qué <code>DISTINCT</code> puede ocultar el síntoma sin corregir el razonamiento.</div>')
            text = insert_before_last_slide(text, core + '\n' + reason)
            text = text.replace('cinco tablas del laboratorio', '4 tablas del miniwarehouse + 1 tabla operacional defectuosa de comparación')
        if text != original:
            write(path, text)
        report[n] = {'removed': removed, 'slides': len(slide_spans(text))}
    return report


def shell_from_s12():
    text = read(PRESENTACIONES[12]); spans = slide_spans(text)
    return text[:spans[0][0]], text[spans[-1][1]:]


def generated_presentation(n: int, slides_html: list[str]) -> str:
    prefix, suffix = shell_from_s12(); title = TITULOS[n]
    prefix = re.sub(r'<title>.*?</title>', f'<title>Sesión {n} · {html_lib.escape(title)}</title>', prefix, count=1, flags=re.I|re.S)
    prefix = re.sub(r'(<meta\s+name="description"\s+content=")[^"]*("\s*/?>)', rf'\1Sesión {n}: {html_lib.escape(title, quote=True)} · ANDESDB\2', prefix, count=1, flags=re.I)
    prefix = prefix.replace('Sesión 12', f'Sesión {n}').replace('sesión 12', f'sesión {n}')
    suffix = re.sub(r'\s*<script src="sql-lab-s12\.js"></script>', '', suffix)
    suffix = re.sub(r'\s*<script src="\.\./\.\./assets/learning/analytics-fallback-link\.js"></script>', '', suffix)
    return prefix + '\n' + '\n\n'.join(slides_html) + '\n' + suffix


def build_future_sessions() -> None:
    s1 = [
        slide(1,'Portada','Sesión 1 · diagnóstico de entrada','Antes de aprender: hagamos visible desde dónde empezamos','<p class="lead">No tiene nota. Responde lo que piensas hoy; volveremos a estas preguntas en S16.</p>','slide dark'),
        slide(1,'Pretest','Diagnóstico · 8 minutos','Cinco preguntas que volveremos a mirar al final','<div class="g2"><div class="card"><ol><li>¿Archivo y base de datos son lo mismo?</li><li>¿Qué crees que hace SQL?</li><li>¿Qué significa relacionar dos tablas?</li></ol></div><div class="card blue"><ol start="4"><li>¿Dónde guardarías una transferencia bancaria?</li><li>¿Qué diferencias imaginas entre analista, ingeniero de datos y DBA?</li></ol></div></div>'),
        slide(1,'Cadena de valor','Producto de salida','De un evento a una decisión','<div class="ctx">Construye una cadena con un ejemplo propio:</div><p class="quote">evento → dato → almacenamiento → transformación → consumidor → decisión</p>'),
        slide(1,'Roles','Puente DP-900 · reconocimiento','Tres roles; tres preguntas distintas','<div class="g3"><div class="card"><h3>DBA</h3><p>¿Cómo opero, protejo y mantengo la base?</p></div><div class="card blue"><h3>Data engineer</h3><p>¿Cómo muevo y preparo datos?</p></div><div class="card"><h3>Data analyst</h3><p>¿Cómo modelo, analizo y comunico?</p></div></div>'),
        slide(1,'Cierre','Salida','No necesitas conocer las respuestas todavía','<div class="ctx"><b>Próxima:</b> abriremos una base real y responderemos la primera pregunta con SQL.</div>','slide dark')]
    write(ROOT/'Presentaciones/M1/sesion-1-diagnostico.html', generated_presentation(1,s1))

    s13 = [
        slide(13,'Portada','Sesión 13 de 16 · laboratorio real','BigQuery: del modelo estrella a un warehouse cloud','<p class="lead">Primero éxito operacional; después razonamos sobre costo y arquitectura.</p>','slide dark'),
        slide(13,'Briefing','Producto de hoy','Cuatro evidencias, no veinte capturas','<div class="g2"><div class="card"><ul class="checks"><li>consulta en BigQuery real</li><li>consultas núcleo resueltas</li></ul></div><div class="card blue"><ul class="checks"><li>validación por consulta</li><li>bytes procesados observados</li></ul></div></div>'),
        slide(13,'Ruta de acceso','Continuidad · servicio real primero','Tres rutas, en este orden','<div class="g3"><div class="card"><h3>A · Skills/lab</h3><p>Entorno asignado.</p></div><div class="card blue"><h3>B · BigQuery Sandbox</h3><p>BigQuery real sin tarjeta ni billing.</p></div><div class="card"><h3>C · DuckDB-Wasm</h3><p>Solo contingencia final.</p></div></div>'),
        slide(13,'Preflight','0–15 min','No empieces el laboratorio hasta completar esto','<ul class="checks"><li>abrí BigQuery</li><li>identifico proyecto/dataset</li><li>ejecuté <code>SELECT 1;</code></li><li>ubico resultados y detalles del job</li></ul>'),
        slide(13,'Primera victoria','15–30 min · hazlo conmigo','Una consulta pequeña antes del workshop','<pre><code>SELECT 1 AS primera_consulta;</code></pre><div class="ctx">Ubica bytes procesados: una consulta usa recursos.</div>'),
        slide(13,'Restaurante ABC','30–50 min','El modelo de S12 llega al cloud','<div class="g2"><div class="card"><p><code>fact_venta</code><br><code>dim_fecha</code><br><code>dim_plato</code><br><code>dim_mesero</code></p></div><div class="card blue"><p>¿Cambió SQL o cambió el motor y la escala?</p></div></div>'),
        slide(13,'Workshop','50–110 min · autónomo guiado','Resuelve preguntas, no una lista de comandos','<div class="g2"><div class="card"><ul class="checks"><li>ventas por día</li><li>ventas por categoría</li><li>top platos</li></ul></div><div class="card blue"><ul class="checks"><li>declara grano</li><li>predice</li><li>ejecuta</li><li>valida</li></ul></div></div>'),
        slide(13,'Reasoning Check','🔍 Reasoning Check','Dos consultas responden lo mismo. ¿Cuál lee menos?','<div class="ctx">Compara <code>SELECT *</code> con seleccionar solo columnas necesarias y observa bytes procesados.</div>'),
        slide(13,'Checkpoint','Evidencia · sin receta','Una pregunta nueva antes del cierre','<p class="lead">Construye una consulta nueva, explica su grano y presenta una validación independiente.</p>'),
        slide(13,'Cierre','Salida','Cloud no reemplazó lo aprendido: lo puso a otra escala','<p class="quote">pregunta → grano → consulta → validación → costo de lectura</p>','slide dark')]
    write(ROOT/'Presentaciones/M5/sesion-13-laboratorio-bigquery.html', generated_presentation(13,s13))

    s14 = [
        slide(14,'Portada','Sesión 14 de 16 · semiestructurados','¿Por qué volvemos a juntar datos después de aprender a separarlos?','<p class="lead">Un modelo se evalúa contra su carga de trabajo.</p>','slide dark'),
        slide(14,'Recuperación','Conecta S8 + S11 + S13','Tres formas de representar el mismo pedido','<div class="g3"><div class="card"><h3>Relacional</h3><p>pedido + línea</p></div><div class="card blue"><h3>Documento</h3><p>líneas anidadas</p></div><div class="card"><h3>Analítico</h3><p>STRUCT/ARRAY</p></div></div>'),
        slide(14,'ARRAY y STRUCT','Concepto · 15 min','Una columna también puede contener estructura','<pre><code>{ pedido_id: 42, lineas: [{plato: "Ajiaco", cantidad: 2}] }</code></pre><div class="ctx"><b>STRUCT</b> agrupa campos; <b>ARRAY</b> repite valores/estructuras.</div>'),
        slide(14,'UNNEST','Hazlo conmigo','Para consultar el arreglo, lo convertimos temporalmente en filas','<pre><code>SELECT pedido_id, linea.plato, linea.cantidad\nFROM pedidos, UNNEST(lineas) AS linea;</code></pre>'),
        slide(14,'Reasoning Check','🔍 Reasoning Check','Normalizar o anidar no es una decisión moral','<div class="g2"><div class="card"><p>¿Las líneas se leen junto con el pedido?</p></div><div class="card blue"><p>¿Se comparten/actualizan independientemente?</p></div></div>'),
        slide(14,'Formatos','JSON · Parquet','Mismo negocio, distinta representación física','<div class="g2"><div class="card"><h3>JSON</h3><p>semiestructurado y anidado</p></div><div class="card blue"><h3>Parquet</h3><p>columnar y analítico</p></div></div>'),
        slide(14,'Workshop','45 min · BigQuery real','Consulta datos anidados','<ul class="checks"><li>campo de STRUCT</li><li><code>UNNEST</code></li><li>agrega tras expandir</li><li>predice filas antes de ejecutar</li></ul>'),
        slide(14,'Mapa Azure','Transferencia DP-900','Concepto primero; servicio después','<div class="g3"><div class="card"><h3>Almacenar</h3><p>Blob · Files · Table · Cosmos</p></div><div class="card blue"><h3>Procesar</h3><p>Fabric · Databricks</p></div><div class="card"><h3>Consumir</h3><p>Power BI</p></div></div>'),
        slide(14,'Checkpoint','Evidencia · transferencia','Elige representación antes de producto','<p class="lead">Decide tabla plana, normalizada o anidada y justifica con patrón de consulta + limitación.</p>'),
        slide(14,'Cierre','Salida','La tecnología sigue al problema','<div class="ctx"><b>S15:</b> nadie te dirá qué modelo ni herramienta usar.</div>','slide dark')]
    write(ROOT/'Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html', generated_presentation(14,s14))

    s15 = [
        slide(15,'Portada','Sesión 15 de 16 · desafío integrador','Hoy no hay receta: debes diagnosticar y defender','<p class="lead">La evidencia final es una solución que puedes explicar, probar y modificar.</p>','slide dark'),
        slide(15,'Entregables','Proyecto reproducible','Seis artefactos hacen visible tu razonamiento','<div class="g2"><div class="card"><p><code>decisiones.md</code><br><code>modelo.png</code><br><code>schema.sql</code></p></div><div class="card blue"><p><code>queries.sql</code><br><code>validaciones.sql</code><br><code>arquitectura.md</code></p></div></div>'),
        slide(15,'Decisiones','decisiones.md · máximo una página','Seis preguntas; ninguna pide decorar','<ol><li>¿Qué problema resuelves?</li><li>¿Qué representa una fila?</li><li>¿Qué reglas encontraste?</li><li>¿Qué tecnología y por qué?</li><li>¿Cómo validaste?</li><li>¿Qué limitación queda?</li></ol>'),
        slide(15,'Rúbrica','100 puntos','Se evalúa el razonamiento completo','<div class="g2"><div class="card"><p>Diagnóstico 15<br>Modelo 20<br>Transformación 15<br>Consultas 15</p></div><div class="card blue"><p>Validación 15<br>Arquitectura 15<br>Comunicación 5</p></div></div>'),
        slide(15,'Trabajo','90 min · autónomo guiado','Orden sugerido','<p class="quote">diagnosticar → grano → modelar → construir → consultar → validar → decidir</p>'),
        slide(15,'Reasoning Check','🔍 Code ownership','Puedes usar herramientas; no puedes delegar la comprensión','<div class="g2"><div class="card"><p>El profesor elige una línea: “¿por qué está este JOIN?”</p></div><div class="card blue"><p>Debes explicar y modificar la solución ante una pregunta nueva.</p></div></div>'),
        slide(15,'Defensa','90 segundos por equipo','Tres cosas sin leer','<ul class="checks"><li>decisión más difícil</li><li>validación que te hizo confiar</li><li>qué cambiarías para producción</li></ul>'),
        slide(15,'Cierre','Salida','El curso completo cabe en una cadena','<p class="quote">entender → consultar → modelar → implementar → elegir → analizar → integrar</p>','slide dark')]
    write(ROOT/'Presentaciones/M6/sesion-15-desafio-final.html', generated_presentation(15,s15))

    s16 = [
        slide(16,'Portada','Sesión 16 de 16 · consolidación','No es otra clase de Azure: es recuperar lo que ya sabes','<p class="lead">Primero demostramos progreso; después traducimos al vocabulario DP-900.</p>','slide dark'),
        slide(16,'Pre/Post','Evidencia de aprendizaje','Vuelve a S1 antes de mirar apuntes','<ul class="checks"><li>archivo vs base</li><li>qué hace SQL</li><li>relaciones</li><li>dónde guardar transacciones</li><li>DBA vs DE vs DA</li></ul>'),
        slide(16,'Blueprint','DP-900 · cuatro dominios','Organiza lo aprendido','<div class="g2"><div class="card"><p><b>25–30%</b> conceptos<br><b>20–25%</b> relacional</p></div><div class="card blue"><p><b>15–20%</b> no relacional<br><b>25–30%</b> analítica</p></div></div>'),
        slide(16,'Mapa del curso','Recuperación espaciada','Cada dominio ya apareció en una experiencia','<div class="g2"><div class="card"><p>S2–S9 relacional<br>S10–S11 NoSQL<br>S12–S14 analítica</p></div><div class="card blue"><p>S1/S16 roles<br>S11/S14 Cosmos/Storage<br>S12/S14 Fabric/Databricks/Power BI</p></div></div>'),
        slide(16,'Escenarios','Práctica acumulativa','Responde por escenario, no por definición','<p class="lead">1) carga; 2) forma del dato; 3) concepto; 4) servicio.</p>'),
        slide(16,'Debilidades','Diagnóstico personal','Clasifica cada error','<div class="g3"><div class="card"><h3>Concepto</h3><p>No entiendo la diferencia.</p></div><div class="card blue"><h3>Transferencia</h3><p>Entiendo pero no recuerdo Azure.</p></div><div class="card"><h3>Lectura</h3><p>Interpreté mal el escenario.</p></div></div>'),
        slide(16,'Plan','Salida individual','Estudia el hueco, no repitas todo','<ul class="checks"><li>dominio más débil</li><li>dos objetivos</li><li>recurso Microsoft Learn</li><li>fecha de simulacro</li><li>criterio de preparación</li></ul>'),
        slide(16,'Cierre','Fin','La certificación reconoce nombres; el curso construyó razonamiento','<p class="quote">No memorices el servicio antes de saber qué problema resuelve.</p>','slide dark')]
    write(ROOT/'Presentaciones/M6/sesion-16-cierre-dp900.html', generated_presentation(16,s16))


def update_manifests() -> None:
    p = ROOT/'tools/curso.json'; curso = json.loads(read(p))
    for mod in curso.get('modulos', []):
        if mod.get('n') == 1:
            r = mod.setdefault('recursos', [])
            if not any('sesion-1-diagnostico.html' in x.get('href','') for x in r):
                r.append({'txt':'🧭 Diagnóstico de entrada y roles de datos','href':'Presentaciones/M1/sesion-1-diagnostico.html'})
        for s in mod.get('sesiones', []):
            n = s.get('n')
            if n == 6:
                s['desc']='Leer lo que una base implementa, distinguir certeza de suposición y levantar reglas de un caso nuevo. El camino analítico se reserva para la sesión 12.'; s['tags']=['reglas de negocio','evidencia','restricciones','permisos','patrones','hipótesis']
            elif n == 9:
                s['desc']='Convertir el modelo del Restaurante ABC en PostgreSQL real y demostrar con pruebas positivas y negativas que las restricciones protegen reglas.'; s['tags']=['PostgreSQL','Supabase','CREATE TABLE','PRIMARY KEY','FOREIGN KEY','NOT NULL','CHECK','DEFAULT','pruebas']
            elif n == 13: s['href']='Presentaciones/M5/sesion-13-laboratorio-bigquery.html'
            elif n == 14: s['href']='Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html'
            elif n == 15: s['href']='Presentaciones/M6/sesion-15-desafio-final.html'
            elif n == 16: s['href']='Presentaciones/M6/sesion-16-cierre-dp900.html'
    write(p, json.dumps(curso,ensure_ascii=False,indent=2)+'\n')

    p = ROOT/'assets/learning/learning-plan.json'; plan=json.loads(read(p)); s=plan['sesiones']
    if len(s['6'].get('dp900',[]))>1: s['6']['dp900']=[s['6']['dp900'][-1]]
    s['6']['actividad']['criterios']=['clasifica observación vs explicación','asigna certeza y evidencia','redacta regla comprobable','deja pregunta pendiente']
    s['9']['objetivo']='Orientarse en Supabase y convertir el modelo de S8 en tablas PostgreSQL que hagan cumplir reglas con PK, FK, NOT NULL, CHECK y DEFAULT.'
    s['9']['actividad']={'titulo':'Del modelo a schema.sql + tests.sql','minutos':60,'instrucciones':'Construye PLATO, PEDIDO y LINEA_PEDIDO; luego escribe pruebas que deban funcionar y pruebas que deban fallar.','criterios':['preflight Supabase','PK/FK coherentes','NOT NULL/CHECK/DEFAULT defendibles','dos pruebas negativas','explica por qué ejecutar no demuestra integridad']}
    s['10']['actividad']['criterios']=['patrón de acceso','consistencia requerida','forma/evolución del dato','costo o riesgo','reconoce cuándo falta información']
    s['11']['objetivo']='Modelar documentos reales, persistir temporalmente el estado mutable del carrito y convertir la confirmación en un hecho relacional auditable; decidir entre embeber y referenciar.'
    s['13']['servicio_real']['fallback']='Primero BigQuery Sandbox para mantener BigQuery real sin tarjeta ni cuenta de facturación; DuckDB-Wasm queda como contingencia final.'
    if 'observa y explica bytes/datos procesados en al menos una consulta' not in s['13']['nucleo']['criterios']: s['13']['nucleo']['criterios'].append('observa y explica bytes/datos procesados en al menos una consulta')
    s['15']['nucleo']['criterios']=['diagnóstico','modelo','transformación','consultas','validación','decisión explicada','defensa oral']; s['15']['artefactos']=['decisiones.md','modelo.png','schema.sql','queries.sql','validaciones.sql','arquitectura.md']
    s['16']['evidencia_prepost']='Repite las cinco preguntas diagnósticas de S1 antes de consultar apuntes y compara la calidad de las explicaciones.'
    write(p,json.dumps(plan,ensure_ascii=False,indent=2)+'\n')


def update_documentation(report) -> None:
    p=ROOT/'README.md'
    if p.exists():
        t=read(p).replace('| 6 | Reglas de negocio | Evidencia, restricciones, permisos, patrones e hipótesis; introducción a OLTP/OLAP, lake, warehouse y ETL/ELT. |','| 6 | Reglas de negocio | Evidencia, restricciones, permisos, patrones e hipótesis; el camino analítico se reserva para S12. |').replace('Firestore + Cosmos DB','Firestore + MongoDB Atlas; Cosmos DB como puente conceptual DP-900'); write(p,t)
    for rel in ['.claude/agents/docente-sql.md','.codex/agents/docente-sql.toml']:
        p=ROOT/rel
        if p.exists():
            t=read(p).replace('6 · Reglas de negocio · OLTP vs OLAP','6 · Reglas de negocio').replace('Firestore + Cosmos DB','Firestore + MongoDB Atlas; Cosmos DB como puente conceptual DP-900').replace('S12 · por crear','S12 · fundamentos de data warehouse'); write(p,t)
    instructor={1:('Diagnóstico + valor','No explicar el pretest antes de recogerlo','cadena + pretest'),2:('Pregunta→SELECT','Ejecutar sin comprender','consulta independiente'),3:('Filas→grupos','WHERE/HAVING','reto sin receta'),4:('Relaciones','JOIN y NULL','grano + JOIN'),5:('Algorítmica','SQL antes de salida','método de seis pasos'),6:('Reglas','patrón como ley','evidencia→regla'),7:('Modelo','entidades sin regla','decisiones trazables'),8:('Normalización','memorizar FN','anomalía + dependencia'),9:('DDL','cuenta + reteaching','schema.sql + tests.sql'),10:('SQL/NoSQL','moda','rúbrica 4 criterios'),11:('Documentos','temporal=no persistido','docs + filtros + checkout'),12:('DW','productos antes de grano','estrella + reasoning'),13:('BigQuery','onboarding','preflight + bytes'),14:('Nested','anidar como ley','UNNEST + decisión'),15:('Integración','código no defendible','6 artefactos + defensa'),16:('DP-900','repasar todo','pre/post + plan')}
    base=ROOT/'docs/instructor'
    for n,(q,r,e) in instructor.items():
        dur=145 if n in (7,10,13,16) else 165
        write(base/f'S{n:02d}.md',f'# S{n:02d} · {TITULOS[n]} · guía docente\n\n## Pregunta central\n{q}\n\n## Riesgo didáctico principal\n{r}\n\n## Evidencia mínima\n{e}\n\n## Ritmo\n- Duración útil: **{dur} min**.\n- Actividad cada 10–15 min.\n- Conserva checkpoint y validación si vas tarde.\n- Usa extensión solo si el núcleo está logrado.\n\n## Cierre\nPide evidencia observable, no solo “¿se entendió?”.\n')
    write(ROOT/'docs/BENCHMARK-PEDAGOGICO-APLICADO.md','# Benchmark pedagógico aplicado a ANDESDB\n\n| Referente | Idea incorporada | Sesiones |\n|---|---|---|\n| SQLBolt | predice → ejecuta → explica | S2–S5 |\n| Data Carpentry | guía docente + errores esperables | S1–S14 |\n| CS50 SQL | artefactos verificables | S2, S7, S9, S15 |\n| CMU 15-445 | Reasoning Checks + defensa | S4–S15 |\n| Microsoft Learn DP-900 | objetivo → sesión → evidencia | S1, S8–S16 |\n| BigQuery oficial | preflight, Sandbox, bytes procesados | S13–S14 |\n\nNo se cambia el CSS ni la identidad visual. Las nuevas diapositivas reutilizan clases existentes.\n\n## Resultado del transformador\n```json\n'+json.dumps(report,ensure_ascii=False,indent=2)+'\n```\n')


def write_dp900_map() -> None:
    d={'version':'2026-07-21','regla':'concepto → evidencia → reconocimiento del servicio','dominios':[{'dominio':'Core data concepts','peso':'25–30%','objetivos':[{'objetivo':'structured/semi/unstructured','sesiones':[1,11,14],'evidencia':'clasificación + JSON/Parquet'},{'objetivo':'transactional vs analytical','sesiones':[9,12],'evidencia':'OLTP vs estrella'},{'objetivo':'data roles','sesiones':[1,16],'evidencia':'pre/post'}]},{'dominio':'Relational data on Azure','peso':'20–25%','objetivos':[{'objetivo':'relational concepts and normalization','sesiones':[7,8,9],'evidencia':'modelo + schema.sql'},{'objetivo':'SQL and database objects','sesiones':[2,3,4,5,9],'evidencia':'queries + constraints'},{'objetivo':'Azure SQL / OSS recognition','sesiones':[12,16],'evidencia':'escenarios'}]},{'dominio':'Non-relational data on Azure','peso':'15–20%','objetivos':[{'objetivo':'document/key-value use cases','sesiones':[10,11],'evidencia':'decisión + Firestore'},{'objetivo':'Cosmos DB','sesiones':[11,14,16],'evidencia':'escenarios'},{'objetivo':'Blob/Files/Table Storage','sesiones':[14,16],'evidencia':'mapa por caso'}]},{'dominio':'Analytics workload on Azure','peso':'25–30%','objetivos':[{'objetivo':'analytical stores and star schemas','sesiones':[12,13],'evidencia':'estrella + BigQuery'},{'objetivo':'batch vs streaming','sesiones':[12,16],'evidencia':'escenarios'},{'objetivo':'Fabric / Databricks','sesiones':[12,14,16],'evidencia':'mapa'},{'objetivo':'Power BI','sesiones':[14,16],'evidencia':'capa consumo'}]}]}
    write(ROOT/'assets/learning/dp900-map.json',json.dumps(d,ensure_ascii=False,indent=2)+'\n')


def patch_service_worker() -> None:
    p=ROOT/'service-worker.js'
    if not p.exists(): return
    t=read(p); anchor="'./Presentaciones/M3/sesion-9-ddl-supabase.html',"
    add=["'./Presentaciones/M4/sesion-10-sql-o-nosql.html',","'./Presentaciones/M4/sesion-11-documentos-de-verdad.html',","'./Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html',","'./Presentaciones/M5/sesion-13-laboratorio-bigquery.html',","'./Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html',","'./Presentaciones/M6/sesion-15-desafio-final.html',","'./Presentaciones/M6/sesion-16-cierre-dp900.html',","'./assets/learning/dp900-map.json',"]
    if anchor in t:
        missing=[x for x in add if x not in t]
        if missing: t=t.replace(anchor,anchor+'\n  '+'\n  '.join(missing)); write(p,t)


def main() -> None:
    report=enhance_existing(); build_future_sessions(); update_manifests(); write_dp900_map(); update_documentation(report); patch_service_worker(); print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__': main()
