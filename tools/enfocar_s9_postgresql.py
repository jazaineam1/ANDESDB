from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')


def write(rel, text):
    (ROOT / rel).write_text(text, encoding='utf-8')


def replace_all(text, pairs):
    for old, new in pairs:
        text = text.replace(old, new)
    return text


# ------------------------------------------------------------
# S9 · PostgreSQL es la meta; Supabase es solo el entorno.
# ------------------------------------------------------------
s9_path = 'Presentaciones/M3/sesion-9-ddl-supabase.html'
s = read(s9_path)
s = replace_all(s, [
    ('Sesion 9 - DDL y Supabase/PostgreSQL:', 'Sesion 9 - DDL y PostgreSQL:'),
    ('<title>Sesión 9 · DDL + Supabase/PostgreSQL</title>', '<title>Sesión 9 · DDL + PostgreSQL</title>'),
    ('<p class="lead">DDL + Supabase/PostgreSQL</p>', '<p class="lead">DDL + PostgreSQL</p>'),
    ('data-title="Supabase no es el motor"', 'data-title="PostgreSQL es el motor"'),
    ('<h2>¿Quién hace qué?</h2>', '<h2>¿Dónde estamos ejecutando PostgreSQL?</h2>'),
    ('<article><span>🟢</span><b>Supabase</b><p>Dashboard y servicios</p></article>', '<article><span>🟢</span><b>SQL Editor</b><p>Interfaz de Supabase</p></article>'),
    ('<p class="warn">Supabase es la plataforma. PostgreSQL es el motor que ejecuta el DDL.</p>', '<p class="warn"><strong>PostgreSQL es el objetivo técnico de la sesión.</strong> Supabase solo nos da una instancia administrada y una interfaz para enviarle SQL al motor.</p>'),
    ('<div class="brand"><span>ANDESDB · Sesión 9</span><span>Supabase no es el motor</span></div>', '<div class="brand"><span>ANDESDB · Sesión 9</span><span>PostgreSQL es el motor</span></div>'),
    ('data-title="Antes de Supabase"', 'data-title="Antes de PostgreSQL"'),
    ('<p class="lead" style="margin:auto">Al volver, abrimos Supabase y ejecutamos el primer DDL real.</p>', '<p class="lead" style="margin:auto">Al volver, abrimos PostgreSQL desde el SQL Editor y ejecutamos el primer DDL real.</p>'),
    ('data-title="Entrar a Supabase"', 'data-title="Abrir PostgreSQL"'),
    ('<h2>Ruta exacta en Supabase</h2>', '<h2>Entrar al SQL Editor que usaremos para PostgreSQL</h2>'),
    ('<li>Entrar a <strong>supabase.com</strong> y abrir el proyecto del curso.</li>', '<li>Entrar al proyecto de clase en <strong>Supabase</strong>: ese proyecto contiene la instancia de <strong>PostgreSQL</strong> que vamos a usar.</li>'),
    ('data-title="Supabase en el mapa"', 'data-title="PostgreSQL en el mapa"'),
    ('<h2>Qué aprendimos del servicio real</h2>', '<h2>Qué aprendimos de PostgreSQL</h2>'),
    ('<section><h3>Supabase</h3><p>Nos dio un PostgreSQL administrado y una interfaz para ejecutar SQL y revisar las tablas.</p></section>', '<section><h3>Supabase</h3><p>Fue el entorno de acceso: nos dio el SQL Editor y una instancia administrada del motor.</p></section>'),
    ('<div class="hintbox"><p style="margin:0"><strong>El aprendizaje no es “usar Supabase”.</strong> Es poder llevar un modelo a un motor real y comprobar qué reglas quedaron realmente protegidas.</p></div>', '<div class="hintbox"><p style="margin:0"><strong>La meta es PostgreSQL.</strong> Debes poder escribir el DDL, crear los objetos, interpretar los errores y comprobar qué restricciones protege el motor. Supabase es solo la interfaz usada hoy.</p></div>'),
    ('<div class="brand"><span>ANDESDB · Sesión 9</span><span>El servicio sirve al objetivo</span></div>', '<div class="brand"><span>ANDESDB · Sesión 9</span><span>PostgreSQL es el objetivo</span></div>'),
])

new_pg_slide = '''<section class="slide dense" data-title="Tipos PostgreSQL">
<div class="ey">48–60 min · PostgreSQL en concreto</div>
<h2>Antes del laboratorio: tipos que vamos a escribir en PostgreSQL</h2>
<table class="tbl"><thead><tr><th>Necesidad</th><th>PostgreSQL</th><th>Qué expresa</th></tr></thead><tbody>
<tr><td>identificador automático</td><td><code>BIGINT GENERATED ALWAYS AS IDENTITY</code></td><td>el motor genera el identificador</td></tr>
<tr><td>texto</td><td><code>TEXT</code></td><td>cadena de longitud variable</td></tr>
<tr><td>dinero</td><td><code>NUMERIC(10,2)</code></td><td>decimal exacto con dos posiciones</td></tr>
<tr><td>booleano</td><td><code>BOOLEAN</code></td><td><code>TRUE</code> / <code>FALSE</code></td></tr>
<tr><td>fecha y hora</td><td><code>DATE</code>, <code>TIME</code>, <code>TIMESTAMP</code></td><td>tipos temporales propios</td></tr>
<tr><td>integridad</td><td><code>PRIMARY KEY</code>, <code>FOREIGN KEY</code>, <code>CHECK</code></td><td>reglas que PostgreSQL hace cumplir</td></tr>
</tbody></table>
<div class="g2" style="margin-top:.7em"><div class="warn"><p style="margin:0"><strong>No memoricen una tabla de equivalencias.</strong> Desde este punto trabajamos directamente con la sintaxis que ejecutará PostgreSQL.</p></div><div class="hintbox"><p style="margin:0"><strong>Fuente única del laboratorio:</strong> <code>Scripts/S9.sql</code>. A partir de aquí, todo el SQL que ejecutamos en clase está escrito para PostgreSQL.</p></div></div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>PostgreSQL: tipos y restricciones</span></div>
</section>'''
s, n = re.subn(r'<section class="slide dense" data-title="Dialecto">.*?</section>', new_pg_slide, s, count=1, flags=re.S)
if n != 1:
    raise RuntimeError('No pude sustituir la diapositiva Dialecto por Tipos PostgreSQL')
s = re.sub(r'<a href="constructor-abc\.html\?sesion=9&amp;paso=5">.*?</a>', '', s, flags=re.S)
write(s9_path, s)

# ------------------------------------------------------------
# Constructor · en S9 se usa como referencia del modelo, no como DDL.
# ------------------------------------------------------------
c_path = 'Presentaciones/M3/constructor-abc.html'
c = read(c_path)
c = c.replace('  9: {paso8:true,  ddl:true}', '  9: {paso8:true,  ddl:false}')
c = c.replace("  var elDDL = ' El DDL local se abre <b>en la sesi&oacute;n 9</b>, despu&eacute;s de explicar la sintaxis.';",
              "  var elDDL = ' El DDL se escribe y ejecuta en <b>PostgreSQL durante la sesi&oacute;n 9</b>.';")
c = re.sub(
    r"  if \(SESION >= 9\)\n    return '<b>Sesi&oacute;n 9\.</b>.*?;\n  if \(SESION === 8\)",
    "  if (SESION >= 9)\n    return '<b>Sesi&oacute;n 9.</b> Este constructor queda como referencia del <b>modelo</b>. ' +\n           'El DDL de hoy se escribe y ejecuta directamente en <b>PostgreSQL</b> con <b>Scripts/S9.sql</b>.';\n  if (SESION === 8)",
    c, count=1, flags=re.S)
c = c.replace("['ddl', hoy().ddl ? 'DDL local · SQLite' : 'DDL · sesión 9']",
              "['ddl', hoy().ddl ? 'DDL' : (SESION >= 9 ? 'DDL · PostgreSQL' : 'DDL · sesión 9')]")
c = c.replace('<p><strong>El DDL local de tu modelo ya est&aacute; generado.</strong> La herramienta lo construye ',
              '<p><strong>En la sesi&oacute;n 9 el DDL se trabaja directamente en PostgreSQL.</strong> Este constructor queda para recuperar y revisar el modelo. ')
c = c.replace("Se abre <strong>en la sesi&oacute;n 9</strong>, despu&eacute;s de aprender la sintaxis y comparar ",
              "En la sesi&oacute;n 9 la fuente del laboratorio es <code>Scripts/S9.sql</code>: SQL escrito para ")
c = c.replace("SQLite con PostgreSQL. <strong>No es el script que se pega en Supabase.</strong> El laboratorio real usa <code>Scripts/S9.sql</code>.",
              "<strong>PostgreSQL</strong> y ejecutado en el SQL Editor del proyecto de clase.")
write(c_path, c)

# ------------------------------------------------------------
# Manifiesto visible.
# ------------------------------------------------------------
curso_path = ROOT / 'tools/curso.json'
curso = json.loads(curso_path.read_text(encoding='utf-8'))
s9j = next((ses for mod in curso.get('modulos', []) for ses in mod.get('sesiones', []) if ses.get('n') == 9), None)
if not s9j:
    raise RuntimeError('No encontré sesión 9 en tools/curso.json')
s9j['titulo'] = 'DDL + PostgreSQL'
s9j['desc'] = 'Convertir el modelo del Restaurante ABC en CREATE TABLE y restricciones de PostgreSQL, ejecutarlo en un motor real desde el SQL Editor de Supabase y comprobar qué reglas acepta o rechaza el motor.'
s9j['recursos'] = [{'txt': '📄 Script PostgreSQL del laboratorio', 'href': 'Scripts/S9.sql', 'download': True}]
curso_path.write_text(json.dumps(curso, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# ------------------------------------------------------------
# Plan de aprendizaje.
# ------------------------------------------------------------
lp_path = ROOT / 'assets/learning/learning-plan.json'
lp = json.loads(lp_path.read_text(encoding='utf-8'))
plan9 = lp.get('sesiones', {}).get('9') or lp.get('9')
if not plan9:
    raise RuntimeError('No encontré sesión 9 en learning-plan.json')
plan9['titulo'] = 'DDL + PostgreSQL'
plan9['objetivo'] = 'Convertir el modelo del Restaurante ABC en tablas y restricciones ejecutables sobre PostgreSQL real, y comprobar qué reglas acepta o rechaza el motor. Supabase se usa únicamente como entorno de acceso al PostgreSQL de la clase.'
if 'servicio_real' in plan9:
    plan9['servicio_real']['nombre'] = 'PostgreSQL en Supabase'
    plan9['servicio_real']['fallback'] = 'Si falla el acceso individual, el docente mantiene la ejecución en PostgreSQL y el estudiante sigue la prueba en clase; SQLite no sustituye el objetivo de esta sesión.'
lp_path.write_text(json.dumps(lp, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# ------------------------------------------------------------
# Script del laboratorio.
# ------------------------------------------------------------
sql_path = 'Scripts/S9.sql'
sql = read(sql_path)
sql = sql.replace('-- ANDESDB · Sesión 9 · DDL + Supabase/PostgreSQL', '-- ANDESDB · Sesión 9 · DDL + PostgreSQL')
sql = sql.replace('-- Nota Supabase: hoy usamos SQL Editor y un schema de clase.\n-- No exponemos estas tablas a una app ni configuramos Data API/RLS.',
                  '-- Entorno de clase: ejecutamos este SQL de PostgreSQL desde el SQL Editor de Supabase.\n-- Supabase es la interfaz de acceso; el objetivo técnico de la sesión es PostgreSQL.\n-- No exponemos estas tablas a una app ni configuramos Data API/RLS.')
write(sql_path, sql)

# ------------------------------------------------------------
# Validador · S9 debe exigir PostgreSQL en el título, no Supabase.
# ------------------------------------------------------------
v_path = 'tools/validar_curso.py'
v = read(v_path)
v = v.replace('    if "Supabase" not in str(s9.get("titulo", "")):\n        err("S9 en learning-plan.json debe estar alineada con Supabase/PostgreSQL")',
              '    if "PostgreSQL" not in str(s9.get("titulo", "")):\n        err("S9 en learning-plan.json debe tener PostgreSQL como objetivo técnico")')
v = v.replace('        err("S9 debe declarar Supabase + PostgreSQL como servicio real")',
              '        err("S9 debe declarar PostgreSQL en Supabase como entorno de servicio real")')
write(v_path, v)

# ------------------------------------------------------------
# Verificaciones de objetivo.
# ------------------------------------------------------------
s = read(s9_path)
c = read(c_path)
assert '<p class="lead">DDL + PostgreSQL</p>' in s
assert 'data-title="Tipos PostgreSQL"' in s
assert 'SQLite → PostgreSQL' not in s
assert 'Ahora sí abran su modelo' not in s
assert '<strong>La meta es PostgreSQL.</strong>' in s
assert '  9: {paso8:true,  ddl:false}' in c
assert s9j['titulo'] == 'DDL + PostgreSQL'
assert len(s9j['recursos']) == 1 and s9j['recursos'][0]['href'] == 'Scripts/S9.sql'
assert 'DDL + PostgreSQL' in read(sql_path)
assert 'if "PostgreSQL" not in str(s9.get("titulo", ""))' in read(v_path)
print('OK · S9 enfocada en PostgreSQL')
