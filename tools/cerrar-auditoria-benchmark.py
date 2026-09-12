from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

P = {
    4: ROOT / 'Presentaciones/M2/sesion-4-uniones-de-tablas.html',
    5: ROOT / 'Presentaciones/M2/sesion-5-algoritmica-de-tablas.html',
    6: ROOT / 'Presentaciones/M3/sesion-6-reglas-de-negocio.html',
    8: ROOT / 'Presentaciones/M3/sesion-8-modelado-y-normalizacion.html',
    9: ROOT / 'Presentaciones/M3/sesion-9-ddl-supabase.html',
    10: ROOT / 'Presentaciones/M4/sesion-10-sql-o-nosql.html',
    11: ROOT / 'Presentaciones/M4/sesion-11-documentos-de-verdad.html',
    12: ROOT / 'Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html',
    13: ROOT / 'Presentaciones/M5/sesion-13-laboratorio-bigquery.html',
    14: ROOT / 'Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html',
    15: ROOT / 'Presentaciones/M6/sesion-15-desafio-final.html',
    16: ROOT / 'Presentaciones/M6/sesion-16-cierre-dp900.html',
}

T = {
    4: 'Uniones de tablas', 5: 'Algorítmica de tablas', 6: 'Reglas de negocio',
    8: 'Modelado y normalización', 9: 'SQL para creación de tablas',
    10: 'Taller de casos: ¿SQL o NoSQL?', 11: 'Documentos de verdad',
    12: 'Fundamentos de data warehouse', 13: 'Laboratorio BigQuery',
    14: 'BigQuery anidado + mapa Azure', 15: 'Desafío final integrador',
    16: 'Cierre + preparación DP-900',
}


def rd(p: Path) -> str:
    return p.read_text(encoding='utf-8')


def wr(p: Path, s: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s, encoding='utf-8')


def spans(text: str):
    op = re.compile(r'<section\b[^>]*\bclass=["\'][^"\']*\bslide\b[^"\']*["\'][^>]*>', re.I)
    tags = re.compile(r'</?section\b[^>]*>', re.I)
    out = []
    for m in op.finditer(text):
        depth = 0
        for tag in tags.finditer(text, m.start()):
            if tag.group(0).startswith('</'):
                depth -= 1
                if depth == 0:
                    out.append((m.start(), tag.end()))
                    break
            else:
                depth += 1
    clean = []
    for a, b in out:
        if not any(x <= a and b <= y for x, y in clean):
            clean.append((a, b))
    return clean


def title(frag: str) -> str:
    m = re.search(r'data-title=["\']([^"\']+)', frag, re.I)
    return html.unescape(m.group(1)).strip() if m else ''


def visible(frag: str) -> str:
    frag = re.sub(r'<style\b.*?</style>|<script\b.*?</script>', ' ', frag, flags=re.I | re.S)
    frag = re.sub(r'<[^>]+>', ' ', frag)
    return re.sub(r'\s+', ' ', html.unescape(frag)).strip()


def remove_titles(text: str, names: set[str]) -> str:
    wanted = {x.casefold() for x in names}
    for a, b in reversed(spans(text)):
        if title(text[a:b]).casefold() in wanted:
            text = text[:a] + text[b:]
    return text


def replace_slide(text: str, name: str, fragment: str) -> str:
    for a, b in spans(text):
        if title(text[a:b]).casefold() == name.casefold():
            return text[:a] + fragment.strip() + text[b:]
    raise RuntimeError(f'No se encontró diapositiva {name!r}')


def insert_after(text: str, name: str, fragment: str) -> str:
    for a, b in spans(text):
        if title(text[a:b]).casefold() == name.casefold():
            return text[:b] + '\n' + fragment.strip() + '\n' + text[b:]
    raise RuntimeError(f'No se encontró diapositiva {name!r}')


def insert_before(text: str, name: str, fragment: str) -> str:
    for a, b in spans(text):
        if title(text[a:b]).casefold() == name.casefold():
            return text[:a] + fragment.strip() + '\n' + text[a:]
    raise RuntimeError(f'No se encontró diapositiva {name!r}')


def slide(n: int, dt: str, ey: str, h2: str, body: str, cls='slide dense', extra='') -> str:
    return f'''<section class="{cls}" data-title="{html.escape(dt, quote=True)}"{extra}>
<div class="ey">{ey}</div><h2>{h2}</h2>{body}
<div class="brand"><span>ANDESDB · evidencia y razonamiento</span><span>Sesión {n} · {T[n]}</span></div></section>'''


def ensure_once(text: str, dt: str, frag: str, before: str | None = None, after: str | None = None) -> str:
    if any(title(text[a:b]).casefold() == dt.casefold() for a, b in spans(text)):
        return text
    if before:
        return insert_before(text, before, frag)
    if after:
        return insert_after(text, after, frag)
    ss = spans(text)
    if not ss:
        raise RuntimeError('HTML sin diapositivas')
    return text[:ss[-1][0]] + frag + '\n' + text[ss[-1][0]:]


def fix_course_manifest() -> None:
    p = ROOT / 'tools/curso.json'
    d = json.loads(rd(p))
    m1 = next(m for m in d['modulos'] if m.get('n') == 1)
    # Un único source of truth público para S1: el HTML. El PPTX puede seguir en el repo como histórico.
    m1['recursos'] = [r for r in m1.get('recursos', []) if not str(r.get('href', '')).lower().endswith('.pptx')]
    if not any(r.get('href') == 'Presentaciones/M1/sesion-1-diagnostico.html' for r in m1['recursos']):
        m1['recursos'].insert(0, {'txt': '🧭 Sesión 1 · diagnóstico, ecosistema y roles', 'href': 'Presentaciones/M1/sesion-1-diagnostico.html'})
    else:
        for r in m1['recursos']:
            if r.get('href') == 'Presentaciones/M1/sesion-1-diagnostico.html':
                r['txt'] = '🧭 Sesión 1 · presentación canónica: diagnóstico, ecosistema y roles'
    wr(p, json.dumps(d, ensure_ascii=False, indent=2) + '\n')


def fix_s4() -> None:
    text = rd(P[4])
    choose = slide(4, 'Checkpoint · elige el JOIN', 'Evidencia · 7 minutos · sin receta', 'El motor no elige la semántica por ti', '''
<div class="ctx"><b>Pregunta:</b> muestra <b>todas las películas</b>, incluidas las que nunca han sido alquiladas, y cuenta sus alquileres.</div>
<div class="g2"><div class="card"><h3>Antes de escribir</h3><ul class="checks"><li>elige <code>INNER</code> o <code>LEFT JOIN</code></li><li>justifica qué filas deben sobrevivir sin coincidencia</li><li>declara qué representa una fila del resultado</li></ul></div><div class="card blue"><h3>Criterio</h3><p>No basta con que ejecute: la elección del JOIN debe preservar las películas sin alquiler.</p></div></div>''')
    text = ensure_once(text, 'Checkpoint · elige el JOIN', choose, before='Cierre')
    alt = slide(4, 'Mapa relacional en texto', 'Accesibilidad · equivalente del diagrama', 'La misma cadena, sin depender del SVG', '''
<div class="g2"><div class="card"><h3>Camino principal</h3><p><code>film 1:N inventory 1:N rental N:1 customer</code></p><p>Una película puede tener varias copias; una copia puede alquilarse muchas veces; cada alquiler pertenece a un cliente.</p></div><div class="card blue"><h3>Pago</h3><p><code>rental 1:N payment</code></p><p>La cardinalidad explica por qué unir puede multiplicar filas aunque ningún dato esté duplicado.</p></div></div>''')
    text = ensure_once(text, 'Mapa relacional en texto', alt, before='Cierre')
    wr(P[4], text)


def fix_s5() -> None:
    text = rd(P[5])
    # Evitar la idea incorrecta de que una CTE fuerza el orden físico del motor.
    text = re.sub(r'(?i)la cte se ejecuta primero', 'la CTE se define antes de usarse; el optimizador decide el plan físico', text)
    ext = slide(5, 'Extensión · VIEW', 'Opcional · si el núcleo ya está logrado', 'Cuando una consulta se vuelve una pieza reutilizable', '''
<div class="g2"><div><pre><code>CREATE VIEW resumen_clientes AS
SELECT customer_id,
       COUNT(*) AS alquileres
FROM rental
GROUP BY customer_id;</code></pre></div><div class="card blue"><h3>Idea</h3><p>Una vista da nombre a una consulta. No cambia el método ANDESDB: primero declaras el grano y validas; después decides si vale la pena reutilizarla.</p></div></div>''', extra=' data-opcional="true"')
    text = ensure_once(text, 'Extensión · VIEW', ext, before='Cierre')
    wr(P[5], text)


def fix_s6() -> None:
    text = rd(P[6])
    text = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Sesión 6 · Reglas de negocio: evidencia, restricciones, permisos, patrones e hipótesis">', text, count=1, flags=re.I)
    text = re.sub(r'<div class="chips"><code>reglas de negocio</code>.*?</div>', '<div class="chips"><code>reglas de negocio</code><code>evidencia</code><code>restricción</code><code>permiso</code><code>patrón</code><code>hipótesis</code></div>', text, count=1, flags=re.I | re.S)
    # Eliminar cualquier lámina residual cuyo propósito siga siendo enseñar el hilo analítico.
    for a, b in reversed(spans(text)):
        f = text[a:b]
        v = visible(f).casefold()
        dt = title(f).casefold()
        if dt != 'portada' and any(k in v for k in ('siete palabras nuevas', 'laguna de datos', 'bodega de datos', 'etl transforma', 'elt guarda', 'oltp para operar', 'olap para entender')):
            text = text[:a] + text[b:]
    text = re.sub(r'<li>[^<]*(?:<[^>]+>[^<]*</[^>]+>[^<]*)*(?:OLTP|OLAP|Laguna|Bodega|ETL|ELT).*?</li>', '', text, flags=re.I | re.S)
    text = text.replace('OLTP', '').replace('OLAP', '').replace('ETL / ELT', '').replace('ETL/ELT', '')
    text = re.sub(r'\s*<code></code>', '', text)
    # Limpieza de frases de cierre que pudieron quedar huérfanas.
    text = text.replace('reglas de negocio ·  ·  · laguna de datos · bodega de datos · ETL · ELT', 'reglas de negocio · evidencia · regla comprobable')
    wr(P[6], text)


def fix_s8() -> None:
    text = rd(P[8])
    repl = {
        '102–108': '102–106', '108–116': '106–111', '116–126': '111–118',
        '126–138': '118–126', '138–145': '126–132', '145–154': '132–139',
        '154–162': '139–144', '162–170': '144–150',
    }
    for old, new in repl.items():
        text = text.replace(old, new)
    # La precisión mesero–mesa es extensión de transferencia, no parte del reloj núcleo.
    text = text.replace('<section class="slide dense" data-title="Supuesto mesero–mesa">', '<section class="slide dense" data-title="Supuesto mesero–mesa" data-opcional="true">')
    text = text.replace('<div class="ey">Precisión del modelo</div><h2>Una cardinalidad', '<div class="ey">Extensión opcional · 5 min de colchón</div><h2>Una cardinalidad')
    wr(P[8], text)


def fix_s9() -> None:
    text = rd(P[9])
    remove = {
        'Ruta de hoy', 'Ruta de 165 minutos', 'Antes de normalizar', 'Trabajo en Zoom',
        'La sala · quién hace qué, y cómo', 'Si quieren conectarse', 'Antes de las formas normales',
        'La pregunta central', 'Resumen visual', 'Checkpoint · esquema protegido', 'Cierre'
    }
    text = remove_titles(text, remove)
    text = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Sesión 9 · PostgreSQL en Supabase: del modelo a CREATE TABLE, PK/FK y restricciones comprobadas">', text, count=1, flags=re.I)
    text = text.replace('se rompe a prop&oacute;sito, se repara con las tres formas normales, y se escribe con <code>CREATE TABLE</code>.', 'se convierte en tablas y restricciones, y se comprueba intentando romper sus reglas.')
    text = re.sub(r'<code>1FN\s*&middot;\s*2FN\s*&middot;\s*3FN</code>', '', text, flags=re.I)
    # Quitar microcronómetros viejos: el tiempo se controla por bloques en una sola lámina.
    text = re.sub(r'\s*&middot;\s*\d+\s*(?:–|&ndash;|-)\s*\d+\s*(?:min|minutos)', '', text, flags=re.I)
    text = re.sub(r'\s*·\s*\d+\s*(?:–|-)\s*\d+\s*(?:min|minutos)', '', text, flags=re.I)
    route = slide(9, 'Ruta real · 165 minutos', 'Contrato de clase · una sola cronología', 'La sesión cabe porque S8 se recupera, no se vuelve a dictar', '''
<div class="g2"><div class="card"><h3>0–90 min</h3><ul class="checks"><li><b>0–15:</b> preflight Supabase + <code>SELECT 1</code></li><li><b>15–35:</b> modelo → anatomía de <code>CREATE TABLE</code></li><li><b>35–60:</b> <code>plato</code> + PK + <code>CHECK</code></li><li><b>60–90:</b> <code>pedido</code> + <code>DEFAULT</code> + prueba</li></ul></div><div class="card blue"><h3>105–165 min</h3><ul class="checks"><li><b>105–135:</b> <code>linea_pedido</code> + PK/FK</li><li><b>135–155:</b> pruebas negativas: <code>NOT NULL</code>, FK, <code>CHECK</code></li><li><b>155–165:</b> <code>schema.sql</code> + <code>tests.sql</code> + explicación</li></ul></div></div><div class="warn"><b>90–105:</b> pausa. Recuperación de normalización: máximo 5 min dentro del bloque 15–35, solo “¿de qué depende este dato?”.</div>''')
    text = insert_after(text, 'Portada', route)
    preflight = slide(9, 'Preflight Supabase', '0–15 min · éxito operacional primero', 'No empieces DDL hasta que cada sala pueda ejecutar una instrucción', '''
<div class="g2"><div class="card"><ul class="checks"><li>entré al proyecto</li><li>abrí SQL Editor</li><li>ejecuté <code>SELECT 1 AS listo;</code></li><li>sé dónde aparecen resultados/errores</li></ul></div><div class="card blue"><h3>Si falla</h3><p>Usa el proyecto espejo del docente para seguir el razonamiento. La evidencia cloud se recupera después; no se sustituye por una simulación.</p></div></div>''')
    text = insert_after(text, 'Ruta real · 165 minutos', preflight)
    # La contingencia se conserva, pero no consume el núcleo si todo funciona.
    text = text.replace('data-title="Plan B del docente"', 'data-title="Plan B del docente" data-opcional="true"')
    text = text.replace('<div class="ey">Plan B del docente', '<div class="ey">Contingencia · solo si una sala se bloquea')
    # Pausa única en el minuto 90.
    for a, b in spans(text):
        if title(text[a:b]).casefold() == 'pausa':
            f = text[a:b]
            f = re.sub(r'<div class="ey">.*?</div>', '<div class="ey">Pausa · 90–105 min</div>', f, count=1, flags=re.S)
            text = text[:a] + f + text[b:]
            break
    checkpoint = slide(9, 'Checkpoint · esquema protegido', '155–165 min · evidencia', 'Crear tablas no demuestra que las reglas estén protegidas', '''
<div class="g2"><div><pre><code>-- Debe pasar
INSERT INTO plato (nombre, precio_actual)
VALUES ('Ajiaco', 28000);

-- Debe fallar: CHECK
INSERT INTO plato (nombre, precio_actual)
VALUES ('Imposible', -1000);

-- Debe fallar: FK huérfana
INSERT INTO linea_pedido
(pedido_id, plato_id, cantidad, precio_unitario)
VALUES (999999, 1, 1, 28000);</code></pre></div><div class="card blue"><h3>Entrega en clase</h3><p><code>schema.sql</code> + <code>tests.sql</code>. Explica qué restricción acepta o rechaza cada caso.</p></div></div>''')
    text = ensure_once(text, 'Checkpoint · esquema protegido', checkpoint, before='Salida')
    close = slide(9, 'Cierre · DDL', 'Cierre · después del checkpoint', 'El modelo se volvió ejecutable y falsable', '''
<div class="g2"><div class="card"><h3>Construiste</h3><p><code>plato</code>, <code>pedido</code> y <code>linea_pedido</code> con tipos, PK, FK, <code>NOT NULL</code>, <code>CHECK</code> y <code>DEFAULT</code>.</p></div><div class="card blue"><h3>Demostraste</h3><p>Una regla existe cuando puedes mostrar un caso válido que entra y un caso inválido que PostgreSQL rechaza.</p></div></div><p class="quote">modelo → DDL → prueba → evidencia</p>''')
    text = ensure_once(text, 'Cierre · DDL', close, before='Salida')
    wr(P[9], text)


def fix_s10() -> None:
    text = rd(P[10])
    text = text.replace('se levanta una base de documentos de verdad, en Firestore y en\n                Cosmos DB.', 'se levanta una base de documentos de verdad, en Firestore y MongoDB Atlas. Cosmos DB queda como reconocimiento conceptual para DP-900.')
    text = text.replace('se levanta una base de documentos de verdad, en Firestore y en Cosmos DB.', 'se levanta una base de documentos de verdad, en Firestore y MongoDB Atlas. Cosmos DB queda como reconocimiento conceptual para DP-900.')
    wr(P[10], text)


def fix_s11() -> None:
    text = rd(P[11])
    contingency = slide(11, 'Contingencia explícita', 'Plan B · no confundir práctica con evidencia', 'Si Firestore se bloquea, la clase sigue; la evidencia cloud queda pendiente', '''
<div class="g2"><div class="card"><h3>Modo contingencia</h3><p>Usa <code>carrito-abc.html</code> para practicar forma del documento, embed/reference y transición carrito → pedido.</p></div><div class="card blue"><h3>Qué NO demuestra</h3><p>No demuestra persistencia ni listener de Firestore. Esa evidencia se recupera en el servicio real cuando vuelva el acceso.</p></div></div><div class="warn">La contingencia conserva el aprendizaje conceptual sin fingir equivalencia técnica.</div>''', extra=' data-opcional="true"')
    text = ensure_once(text, 'Contingencia explícita', contingency, before='Reasoning Check · checkout')
    wr(P[11], text)


def fix_s12() -> None:
    text = rd(P[12])
    text = text.replace('Las cinco tablas', 'Cuatro tablas del miniwarehouse + una tabla operacional defectuosa')
    text = text.replace('las cinco tablas se cargan solas', 'las cuatro tablas dimensionales y una comparación operacional se cargan solas')
    wr(P[12], text)


def fix_s13() -> None:
    text = rd(P[13])
    setup = slide(13, 'Crear dataset y cargar', '30–50 min · paso a paso reproducible', 'Carga exactamente las mismas cuatro tablas de S12', '''
<div class="g2"><div class="card"><h3>1 · Dataset</h3><ol><li>Abre <a href="https://console.cloud.google.com/bigquery" target="_blank" rel="noopener">BigQuery</a>.</li><li>Crea <code>andesdb_s13</code>.</li><li>En cada carga elige CSV + autodetectar esquema.</li></ol></div><div class="card blue"><h3>2 · Archivos</h3><p><a href="Datos/fact_venta.csv" target="_blank"><code>fact_venta.csv</code></a><br><a href="Datos/dim_fecha.csv" target="_blank"><code>dim_fecha.csv</code></a><br><a href="Datos/dim_plato.csv" target="_blank"><code>dim_plato.csv</code></a><br><a href="Datos/dim_mesero.csv" target="_blank"><code>dim_mesero.csv</code></a></p></div></div><div class="checkpoint"><b>Antes de seguir:</b> <code>fact_venta</code> debe tener <b>44 filas</b>. Si no coincide, no empieces las consultas.</div>''')
    text = ensure_once(text, 'Crear dataset y cargar', setup, after='Restaurante ABC')
    q = slide(13, 'Consultas núcleo', '50–90 min · predice → ejecuta → valida', 'El SQL es conocido; el motor y el costo de lectura son nuevos', '''
<div class="g2"><div><pre><code>SELECT fecha, SUM(ingreso) AS ventas
FROM `TU_PROYECTO.andesdb_s13.fact_venta`
GROUP BY fecha
ORDER BY fecha;</code></pre><p class="small">Cambia <code>TU_PROYECTO</code> por el id visible en BigQuery.</p></div><div class="card blue"><h3>Validación independiente</h3><pre><code>SELECT COUNT(*) AS filas,
       SUM(ingreso) AS total
FROM `TU_PROYECTO.andesdb_s13.fact_venta`;</code></pre><p>Debe dar <b>44 filas</b> y <b>1.455.000</b>.</p></div></div>''')
    text = ensure_once(text, 'Consultas núcleo', q, before='Workshop')
    sandbox = slide(13, 'Sandbox · qué significa', 'Acceso · servicio real primero', 'La ruta B sigue siendo BigQuery real', '''
<div class="g2"><div class="card"><h3>Sandbox</h3><p>Permite practicar BigQuery sin tarjeta ni cuenta de facturación, con límites. No es una simulación.</p><p><a href="https://cloud.google.com/bigquery/docs/sandbox" target="_blank" rel="noopener">Documentación oficial del Sandbox ↗</a></p></div><div class="card blue"><h3>DuckDB-Wasm</h3><p>Solo se usa si las rutas cloud fallan. Conserva SQL y grano, pero no sirve como evidencia de BigQuery.</p></div></div>''')
    text = ensure_once(text, 'Sandbox · qué significa', sandbox, after='Ruta de acceso')
    wr(P[13], text)


def fix_s14() -> None:
    text = rd(P[14])
    why = slide(14, 'Relacional vs anidado', 'Puente S8 → S14', '¿Por qué separar primero y volver a anidar después?', '''
<div class="g2"><div class="card"><h3>OLTP relacional</h3><p><code>pedido</code> + <code>linea_pedido</code> protege integridad y evita repetir datos operacionales.</p></div><div class="card blue"><h3>Analítica/documento anidado</h3><p>Si las líneas casi siempre se leen junto con el pedido, una estructura anidada puede reducir JOINs y acercar almacenamiento al patrón de lectura.</p></div></div><div class="warn"><b>No hay contradicción:</b> el modelo depende de la carga de trabajo.</div>''')
    text = ensure_once(text, 'Relacional vs anidado', why, before='ARRAY y STRUCT')
    runnable = slide(14, 'UNNEST ejecutable', 'BigQuery real · consulta autocontenida', 'Prueba ARRAY, STRUCT y UNNEST sin cargar otro archivo', '''
<pre><code>WITH pedidos AS (
  SELECT 42 AS pedido_id,
         [STRUCT('Ajiaco' AS plato, 2 AS cantidad),
          STRUCT('Jugo' AS plato, 1 AS cantidad)] AS lineas
)
SELECT pedido_id, linea.plato, linea.cantidad
FROM pedidos,
UNNEST(lineas) AS linea;</code></pre><div class="checkpoint">Predice antes de ejecutar: ¿cuántas filas aparecen y qué representa cada una?</div>''')
    text = ensure_once(text, 'UNNEST ejecutable', runnable, after='UNNEST')
    formats = slide(14, 'CSV · JSON · Parquet', 'Transferencia de formatos', 'La misma venta puede viajar con estructuras físicas distintas', '''
<div class="g3"><div class="card"><h3>CSV</h3><p>Plano, simple y universal. La jerarquía se aplana.</p></div><div class="card blue"><h3>JSON</h3><p>Semiestructurado; conserva objetos y arreglos de forma natural.</p></div><div class="card"><h3>Parquet</h3><p>Columnar, tipado y eficiente para analítica; puede conservar estructuras anidadas.</p></div></div><div class="ctx"><b>Pregunta:</b> ¿cuál elegirías para intercambio humano sencillo, documento anidado y lectura analítica por columnas?</div>''')
    # Reemplaza la lámina demasiado mínima de formatos.
    if any(title(text[a:b]).casefold() == 'formatos' for a, b in spans(text)):
        text = replace_slide(text, 'Formatos', formats)
    else:
        text = ensure_once(text, 'CSV · JSON · Parquet', formats, before='Workshop')
    azure = slide(14, 'Azure por casos', 'DP-900 · transferencia, no catálogo', 'Elige servicio a partir de la necesidad', '''
<table class="tbl"><thead><tr><th>Necesidad</th><th>Reconoce</th></tr></thead><tbody><tr><td>Objetos y archivos masivos</td><td><b>Azure Blob Storage</b></td></tr><tr><td>Compartición de archivos tipo SMB</td><td><b>Azure Files</b></td></tr><tr><td>Clave/atributos simples</td><td><b>Table Storage</b></td></tr><tr><td>NoSQL distribuido globalmente</td><td><b>Cosmos DB</b></td></tr><tr><td>Ingeniería/analítica</td><td><b>Fabric / Databricks</b></td></tr><tr><td>Consumo visual</td><td><b>Power BI</b></td></tr></tbody></table><div class="checkpoint">Primero nombra la necesidad; después el producto.</div>''')
    if any(title(text[a:b]).casefold() == 'mapa azure' for a, b in spans(text)):
        text = replace_slide(text, 'Mapa Azure', azure)
    else:
        text = ensure_once(text, 'Azure por casos', azure, before='Cierre')
    wr(P[14], text)


def fix_s15_templates() -> None:
    base = ROOT / 'Plantillas/proyecto-final'
    files = {
        'README.md': '# Proyecto final ANDESDB\n\nTrabaja durante S15. Completa los cinco archivos de texto y exporta tu modelo como `modelo.png`.\n',
        'decisiones.md': '# Decisiones\n\n1. ¿Qué problema resuelves?\n2. ¿Qué representa una fila del resultado principal?\n3. ¿Qué reglas de negocio encontraste?\n4. ¿Qué tecnología elegiste y por qué?\n5. ¿Cómo validaste?\n6. ¿Qué limitación conserva la solución?\n',
        'schema.sql': '-- DDL reproducible del modelo\n',
        'queries.sql': '-- Consultas que responden las preguntas del caso\n',
        'validaciones.sql': '-- Pruebas independientes: conteos, totales, casos que deben fallar\n',
        'arquitectura.md': '# Arquitectura\n\n## Componentes\n\n## Flujo de datos\n\n## Decisión SQL / NoSQL / híbrida\n\n## Riesgos y límites\n',
    }
    for name, content in files.items():
        wr(base / name, content)
    text = rd(P[15])
    links = slide(15, 'Plantilla lista', 'No empiezas desde una carpeta vacía', 'Los artefactos existen en el repositorio', '''
<div class="g2"><div class="card"><p><a href="../../Plantillas/proyecto-final/decisiones.md" target="_blank"><code>decisiones.md</code></a><br><a href="../../Plantillas/proyecto-final/schema.sql" target="_blank"><code>schema.sql</code></a><br><a href="../../Plantillas/proyecto-final/queries.sql" target="_blank"><code>queries.sql</code></a></p></div><div class="card blue"><p><a href="../../Plantillas/proyecto-final/validaciones.sql" target="_blank"><code>validaciones.sql</code></a><br><a href="../../Plantillas/proyecto-final/arquitectura.md" target="_blank"><code>arquitectura.md</code></a><br><code>modelo.png</code> · exportado por el equipo</p></div></div>''')
    text = ensure_once(text, 'Plantilla lista', links, after='Entregables')
    wr(P[15], text)


def fix_s16() -> None:
    text = rd(P[16])
    matrix = slide(16, 'Mapa curso → DP-900', 'Recuperación espaciada · no memorizar desde cero', 'Cada dominio ya apareció en una sesión concreta', '''
<table class="tbl"><thead><tr><th>Dominio</th><th>Sesiones ancla</th><th>Evidencia</th></tr></thead><tbody><tr><td>Conceptos de datos</td><td>S1 · S12 · S14</td><td>forma del dato + OLTP/analítica + formatos</td></tr><tr><td>Relacional</td><td>S2–S9</td><td>consultas + modelo + <code>schema.sql</code></td></tr><tr><td>No relacional</td><td>S10–S11 · S14</td><td>decisión + documentos + Cosmos</td></tr><tr><td>Analítica</td><td>S12–S14</td><td>estrella + BigQuery + batch/stream</td></tr></tbody></table><div class="ctx">El detalle mantenible vive en <code>assets/learning/dp900-map.json</code>.</div>''')
    text = ensure_once(text, 'Mapa curso → DP-900', matrix, after='Blueprint')
    wr(P[16], text)


def write_instructor_guides() -> None:
    spec = {
        1: ('¿Cómo pasa un dato de existir a generar una decisión?', 'confundir archivo, base, motor y rol profesional', 'pretest + mapa evento→dato→decisión'),
        2: ('¿Cómo traduzco una pregunta pequeña a SELECT?', 'copiar sintaxis sin identificar salida, fuente y filtro', 'checkpoint PG más largas'),
        3: ('¿Cuándo filtro filas y cuándo grupos?', 'usar WHERE y HAVING como sinónimos', 'checkpoint de marketing'),
        4: ('¿Qué relación necesito para no perder filas?', 'elegir JOIN por costumbre y usar DISTINCT para tapar multiplicación', 'elección de JOIN + reasoning check'),
        5: ('¿Cómo diseño la tabla resultado antes del SQL?', 'unir fuentes en granos incompatibles', 'método ANDESDB de seis pasos'),
        6: ('¿Qué puedo afirmar como regla a partir de evidencia?', 'convertir patrón o hipótesis en ley del negocio', 'tabla observación→certeza→evidencia→regla'),
        7: ('¿Cómo se convierte una regla en entidades y relaciones?', 'premiar cantidad de entidades en vez de justificación', 'modelo v1 + decisiones'),
        8: ('¿Qué anomalía revela que un dato está en el lugar incorrecto?', 'memorizar 1FN/2FN/3FN como checklist', 'modelo normalizado + transferencia'),
        9: ('¿Cómo hago ejecutables y comprobables las reglas del modelo?', 'consumir la sesión en onboarding o reenseñar normalización', 'schema.sql + tests.sql'),
        10: ('¿Qué necesita este dato antes de elegir tecnología?', 'responder SQL/NoSQL solo por volumen o moda', 'rúbrica 4 puntos'),
        11: ('¿Qué debe vivir junto en un documento y qué exige consistencia transaccional?', 'confundir temporal con no persistido', 'documentos + filtros + compra confirmada'),
        12: ('¿Por qué una tabla operacional correcta puede responder mal una pregunta analítica?', 'avanzar a productos cloud antes de dominar grano', 'estrella + 368k/184k'),
        13: ('¿Qué cambia cuando el mismo modelo llega a BigQuery?', 'perder la clase buscando botones o no validar cargas', '44 filas + 1.455.000 + consulta nueva'),
        14: ('¿Cuándo conviene anidar y cómo se traduce el concepto entre nubes?', 'creer que normalizar/anidar son dogmas', 'ARRAY/STRUCT/UNNEST + caso Azure'),
        15: ('¿Puedes construir, validar y defender una solución sin receta?', 'entregar código que el equipo no puede explicar', 'seis artefactos + defensa'),
        16: ('¿Qué aprendiste y qué hueco concreto queda para DP-900?', 'repasar todo indiscriminadamente', 'postest + plan individual'),
    }
    for n, (question, risk, evidence) in spec.items():
        p = ROOT / f'docs/instructor/S{n:02d}.md'
        content = f'''# S{n:02d} · Guía docente\n\n## Pregunta central\n{question}\n\n## Error esperable principal\n{risk}.\n\n## Dónde probablemente se atascan\n- En la interfaz si aparece una herramienta nueva.\n- En traducir la pregunta de negocio a una unidad de respuesta.\n- En explicar por qué el resultado es correcto, no solo en hacerlo ejecutar.\n\n## No avanzar hasta que…\nEl grupo pueda explicar con sus palabras el criterio de la actividad núcleo y exista una evidencia observable.\n\n## Evidencia mínima\n{evidence}.\n\n## Si vas 15 minutos atrasado\nConserva el caso central, el checkpoint y la validación. Mueve ejemplos adicionales a extensión; no recortes la evidencia final.\n\n## Si vas 15 minutos adelantado\nUsa una transferencia a un caso distinto o un Reasoning Check; no introduzcas un tema de la sesión siguiente.\n\n## Regla de cierre\nPide una explicación o artefacto verificable. “¿Se entendió?” no cuenta como evidencia.\n'''
        wr(p, content)


def main() -> None:
    marker = ROOT / 'docs/AUDITORIA-BENCHMARK-CERRADA.md'
    fix_course_manifest()
    fix_s4(); fix_s5(); fix_s6(); fix_s8(); fix_s9(); fix_s10(); fix_s11(); fix_s12(); fix_s13(); fix_s14(); fix_s15_templates(); fix_s16(); write_instructor_guides()
    wr(marker, '''# Auditoría benchmark · cierre\n\nEsta rama corrige los hallazgos de aceptación posteriores a la primera aplicación del benchmark.\n\n- S1 tiene un único material canónico público.\n- S4 exige elegir y justificar JOIN y ofrece equivalente textual.\n- S6 no enseña el hilo analítico reservado para S12.\n- S8 cierra el núcleo en 150 min y deja 15 min de colchón.\n- S9 usa una única cronología de 165 min, sin reteaching extenso de normalización.\n- S10 corrige la continuidad de S11.\n- S11 explicita contingencia sin fingir equivalencia técnica.\n- S12 distingue las cuatro tablas dimensionales de la comparación operacional defectuosa.\n- S13 incluye carga reproducible, validación 44 / 1.455.000, Sandbox y costo de lectura.\n- S14 incluye comparación relacional/anidado, UNNEST ejecutable, formatos y transferencia Azure por casos.\n- S15 tiene plantillas reales.\n- S16 conecta explícitamente curso y dominios DP-900.\n- S1–S16 tienen Instructor View específica.\n''')


if __name__ == '__main__':
    main()
