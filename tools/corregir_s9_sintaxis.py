from pathlib import Path
import re

HTML = Path('Presentaciones/M3/sesion-9-ddl-supabase.html')
SQL = Path('Scripts/S9.sql')

html = HTML.read_text(encoding='utf-8')
sql = SQL.read_text(encoding='utf-8')

anchor = '<section class="slide " data-title="Primer CREATE">'
slides = '''
<section class="slide " data-title="Convención SQL">
  <div class="ey">18–33 min · Antes de escribir</div>
  <h2>Cómo escribimos SQL en este curso</h2>
  <div class="vs-grid">
    <section><h3>Palabras del lenguaje</h3><p><code>CREATE TABLE</code>, <code>PRIMARY KEY</code>, <code>NOT NULL</code>, <code>REFERENCES</code>...</p><p><strong>Siempre en MAYÚSCULA.</strong></p></section>
    <section><h3>Nombres que inventamos</h3><p><code>cliente</code>, <code>cliente_id</code>, <code>nombre</code>...</p><p><strong>En minúscula y con guion bajo.</strong></p></section>
  </div>
  <p class="warn"><strong>Convención del curso:</strong> PostgreSQL acepta palabras clave en minúscula, pero aquí las escribimos en MAYÚSCULA para distinguir inmediatamente la sintaxis SQL de los nombres del modelo.</p>
  <div class="brand"><span>ANDESDB · Sesión 9</span><span>Convención SQL</span></div>
</section>
<section class="slide dense" data-title="Sintaxis CREATE TABLE">
  <div class="ey">18–33 min · Plantilla</div>
  <h2>La forma general de <code>CREATE TABLE</code></h2>
<pre><code>CREATE TABLE nombre_tabla (
    columna_1 TIPO_DE_DATO RESTRICCIONES,
    columna_2 TIPO_DE_DATO RESTRICCIONES,
    ...,
    CONSTRAINT nombre_regla TIPO_RESTRICCION (...)
);</code></pre>
  <table class="tbl" style="margin-top:1em"><thead><tr><th>Parte</th><th>Qué significa</th></tr></thead><tbody>
    <tr><td><code>CREATE TABLE</code></td><td>Orden: crear una tabla nueva.</td></tr>
    <tr><td><code>nombre_tabla</code></td><td>Nombre que nosotros damos al objeto.</td></tr>
    <tr><td><code>( ... )</code></td><td>Dentro van columnas y restricciones.</td></tr>
    <tr><td><code>,</code></td><td>Separa una definición de la siguiente.</td></tr>
    <tr><td><code>;</code></td><td>Termina la instrucción.</td></tr>
  </tbody></table>
  <div class="brand"><span>ANDESDB · Sesión 9</span><span>Sintaxis CREATE TABLE</span></div>
</section>
<section class="slide " data-title="Anatomía de una columna">
  <div class="ey">18–33 min · Leer una línea</div>
  <h2>Una columna se lee de izquierda a derecha</h2>
<pre><code>nombre TEXT NOT NULL</code></pre>
  <div class="steps" style="margin-top:1.4em">
    <article><b>1</b><h3><code>nombre</code></h3><p>Nombre de la columna.</p></article>
    <article><b>2</b><h3><code>TEXT</code></h3><p>Tipo de dato que acepta.</p></article>
    <article><b>3</b><h3><code>NOT NULL</code></h3><p>Regla: el dato es obligatorio.</p></article>
    <article><b>4</b><h3><code>,</code></h3><p>Después viene otra definición.</p></article>
  </div>
  <p class="hintbox"><strong>Patrón mental:</strong> nombre → tipo → reglas. Antes de escribir una línea debes poder responder esas tres cosas.</p>
  <div class="brand"><span>ANDESDB · Sesión 9</span><span>Anatomía de una columna</span></div>
</section>
<section class="slide dense" data-title="Sintaxis de restricciones">
  <div class="ey">18–33 min · Reglas declarativas</div>
  <h2>¿Cómo se escribe cada restricción?</h2>
  <table class="tbl"><thead><tr><th>Regla</th><th>Sintaxis</th><th>Lectura</th></tr></thead><tbody>
    <tr><td>Obligatorio</td><td><code>nombre TEXT NOT NULL</code></td><td>nombre no puede ser nulo</td></tr>
    <tr><td>Sin repetir</td><td><code>telefono TEXT UNIQUE</code></td><td>no acepta dos valores iguales</td></tr>
    <tr><td>Valor inicial</td><td><code>estado TEXT DEFAULT 'solicitada'</code></td><td>si no llega valor, usa ese</td></tr>
    <tr><td>Identidad</td><td><code>PRIMARY KEY (cliente_id)</code></td><td>identifica una fila</td></tr>
    <tr><td>Relación</td><td><code>FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id)</code></td><td>el cliente debe existir</td></tr>
    <tr><td>Condición</td><td><code>CHECK (personas &gt; 0)</code></td><td>la fila debe cumplir la expresión</td></tr>
  </tbody></table>
  <p class="warn"><code>DEFAULT</code> no valida el negocio: solo aporta un valor cuando la columna se omite.</p>
  <div class="brand"><span>ANDESDB · Sesión 9</span><span>Sintaxis de restricciones</span></div>
</section>
<section class="slide dense" data-title="Sintaxis CONSTRAINT">
  <div class="ey">18–33 min · Reglas con nombre</div>
  <h2>¿Para qué usamos <code>CONSTRAINT</code>?</h2>
<pre><code>CONSTRAINT pk_cliente
    PRIMARY KEY (cliente_id)

CONSTRAINT fk_reserva_cliente
    FOREIGN KEY (cliente_id)
    REFERENCES cliente(cliente_id)</code></pre>
  <div class="vs-grid" style="margin-top:1em">
    <section><h3><code>CONSTRAINT pk_cliente</code></h3><p>Le damos un nombre a la regla para reconocerla en el esquema y en los errores.</p></section>
    <section><h3><code>PRIMARY KEY (...)</code></h3><p>Indicamos qué clase de restricción es y sobre qué columna o columnas actúa.</p></section>
  </div>
  <p class="hintbox"><code>FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id)</code> se lee: “este valor debe existir como <code>cliente_id</code> en <code>cliente</code>”.</p>
  <div class="brand"><span>ANDESDB · Sesión 9</span><span>Sintaxis CONSTRAINT</span></div>
</section>
'''

if 'data-title="Sintaxis CREATE TABLE"' not in html:
    if anchor not in html:
        raise SystemExit('No se encontró el punto de inserción de la explicación sintáctica')
    html = html.replace(anchor, slides + '\n' + anchor, 1)

keywords = [
    'CREATE','TABLE','SCHEMA','IF','NOT','EXISTS','SET','TO','DROP','CASCADE',
    'CONSTRAINT','PRIMARY','KEY','FOREIGN','REFERENCES','UNIQUE','CHECK','DEFAULT',
    'GENERATED','ALWAYS','AS','IDENTITY','INSERT','INTO','VALUES','SELECT','FROM',
    'JOIN','INNER','LEFT','RIGHT','FULL','OUTER','ON','WHERE','GROUP','BY','HAVING',
    'ORDER','ALTER','ADD','UPDATE','DELETE','ENABLE','ROW','LEVEL','SECURITY',
    'AND','OR','IN','IS','NULL','TRUE','FALSE','TEXT','BIGINT','INTEGER','NUMERIC',
    'REAL','BOOLEAN','DATE','TIME','TIMESTAMP','VARCHAR','WITH','DISTINCT','LIMIT',
    'OFFSET','CURRENT_DATE','CURRENT_TIME','CURRENT_TIMESTAMP'
]
kw = re.compile(r'\b(?:' + '|'.join(sorted(map(re.escape, keywords), key=len, reverse=True)) + r')\b', re.I)

def uppercase_sql(text):
    parts = re.split(r"('(?:''|[^'])*')", text)
    for i in range(0, len(parts), 2):
        parts[i] = kw.sub(lambda m: m.group(0).upper(), parts[i])
    return ''.join(parts)

# Código de las diapositivas: keywords/tipos en MAYÚSCULA; identificadores no cambian.
html = re.sub(
    r'<code>(.*?)</code>',
    lambda m: '<code>' + uppercase_sql(m.group(1)) + '</code>',
    html,
    flags=re.S,
)

# Script descargable: misma convención, sin alterar comentarios ni literales de texto.
out = []
for line in sql.splitlines():
    if '--' in line:
        code, comment = line.split('--', 1)
        out.append(uppercase_sql(code) + '--' + comment)
    else:
        out.append(uppercase_sql(line))
sql = '\n'.join(out) + ('\n' if sql.endswith('\n') else '')

header = '''-- ============================================================
-- CÓMO LEER LA SINTAXIS DE ESTA SESIÓN
-- Palabras del lenguaje SQL: MAYÚSCULA.
-- Nombres de tablas y columnas: minúscula.
--
-- Patrón general:
-- CREATE TABLE nombre_tabla (
--     columna TIPO_DE_DATO RESTRICCIONES,
--     CONSTRAINT nombre_regla TIPO_RESTRICCION (...)
-- );
-- ============================================================

'''
if 'CÓMO LEER LA SINTAXIS DE ESTA SESIÓN' not in sql:
    sql = header + sql

HTML.write_text(html, encoding='utf-8')
SQL.write_text(sql, encoding='utf-8')

print('S9 corregida:', html.count('class="slide'), 'diapositivas')
print('Convención SQL: MAYÚSCULAS aplicada')
