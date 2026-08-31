from pathlib import Path


def bounds(text, title):
    marker = f'data-title="{title}"'
    p = text.find(marker)
    if p < 0:
        raise SystemExit(f'No encontré: {title}')
    a = text.rfind('<section', 0, p)
    b = text.find('<section class="slide', p + len(marker))
    if b < 0:
        b = text.find('<div class="progress"', p)
    return a, b


def replace_slide(text, title, html):
    a, b = bounds(text, title)
    return text[:a] + html.strip() + '\n' + text[b:]

p8 = Path('Presentaciones/M3/sesion-8-modelado-y-normalizacion.html')
s8 = p8.read_text(encoding='utf-8')
s8 = s8.replace('<th>mesero</th><th>doc</th><th>cliente</th>', '<th>mesero</th><th>cliente</th>')
s8 = s8.replace('<td>Luis</td><td>CC1</td><td>Ana Restrepo</td>', '<td>Luis</td><td>Ana Restrepo</td>')
s8 = s8.replace('<td>Marta</td><td>CC2</td><td>Carlos Mejía</td>', '<td>Marta</td><td>Carlos Mejía</td>')
assert '<th>doc</th>' not in s8
p8.write_text(s8, encoding='utf-8')

p9 = Path('Presentaciones/M3/sesion-9-ddl-supabase.html')
s9 = p9.read_text(encoding='utf-8')

s9 = replace_slide(s9, 'Identity y PK', r'''
<section class="slide dense" data-title="Identity y PK">
<div class="ey">18–33 min · Distinción crítica</div>
<h2><code>IDENTITY</code> y <code>PRIMARY KEY</code> no son lo mismo</h2>
<div class="g2">
<div><div class="vs-grid" style="grid-template-columns:1fr">
<section><h3><code>GENERATED ALWAYS AS IDENTITY</code></h3><p>Genera números automáticamente.</p></section>
<section><h3><code>PRIMARY KEY</code></h3><p>Identifica de forma única cada fila.</p></section>
</div></div>
<div><h3>Antes de crear <code>reserva</code>, necesitamos <code>mesa</code></h3>
<pre class="smallcode"><code>CREATE TABLE mesa (
    mesa_id BIGINT GENERATED ALWAYS AS IDENTITY,
    codigo TEXT NOT NULL,
    puestos INTEGER NOT NULL,

    CONSTRAINT pk_mesa PRIMARY KEY (mesa_id),
    CONSTRAINT uq_mesa_codigo UNIQUE (codigo),
    CONSTRAINT ck_mesa_puestos CHECK (puestos &gt; 0)
);</code></pre>
<p class="small">El código único es una <strong>decisión explícita del laboratorio</strong>; la capacidad sí es necesaria para representar la regla 3 de S6.</p></div>
</div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>Primero las tablas que serán referenciadas</span></div>
</section>
''')

s9 = replace_slide(s9, 'Ejecutar primer bloque', r'''
<section class="slide dense" data-title="Ejecutar primer bloque">
<div class="ey">75–90 min · Laboratorio</div>
<h2>Bloque 1: <code>cliente</code> → <code>mesa</code> → <code>reserva</code></h2>
<pre><code>SET search_path TO abc_e01;

CREATE TABLE cliente (...);
CREATE TABLE mesa (...);
CREATE TABLE reserva (...);</code></pre>
<div class="g2" style="margin-top:.7em"><div class="hintbox"><p style="margin:0"><strong>Orden:</strong> <code>reserva</code> tiene FK hacia <code>cliente</code> y <code>mesa</code>; por eso esas dos tablas deben existir primero.</p></div><div class="ctx"><p style="margin:0">El archivo <code>Scripts/S9.sql</code> trae el bloque completo. Ejecútenlo <strong>por partes</strong> y revisen en Table Editor qué objeto apareció después de cada <code>CREATE TABLE</code>.</p></div></div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>Crear respetando dependencias</span></div>
</section>
''')

s9 = replace_slide(s9, 'Prueba FK', r'''
<section class="slide " data-title="Prueba FK">
<div class="ey">115–135 min · El payoff</div>
<h2>Una relación del modelo se vuelve integridad referencial</h2>
<pre><code>INSERT INTO reserva (cliente_id, estado)
VALUES (999999, 'pendiente');</code></pre>
<p class="warn"><strong>Debe fallar:</strong> si informamos un <code>cliente_id</code>, ese cliente debe existir. La FK protege la relación; <strong>no afirma que el cliente sea obligatorio</strong>.</p>
<p class="quote">La misma base distingue entre “puede faltar” y “si está, debe apuntar a algo real”.</p>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>FK ≠ NOT NULL</span></div>
</section>
''')

assert 'CREATE TABLE mesa (...);\nCREATE TABLE reserva (...);' in s9
assert 'Una frase del negocio se vuelve regla ejecutable' not in s9
p9.write_text(s9, encoding='utf-8')
print('Ajustes finales S8/S9 OK')
