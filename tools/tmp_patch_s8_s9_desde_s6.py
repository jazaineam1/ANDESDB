from pathlib import Path


def bounds(text, title):
    marker = f'data-title="{title}"'
    p = text.find(marker)
    if p < 0:
        raise SystemExit(f'No encontré diapositiva: {title}')
    start = text.rfind('<section', 0, p)
    nxt = text.find('<section class="slide', p + len(marker))
    if nxt < 0:
        nxt = text.find('<div class="progress"', p)
    if start < 0 or nxt < 0:
        raise SystemExit(f'No pude delimitar: {title}')
    return start, nxt


def replace_slide(text, title, html):
    a, b = bounds(text, title)
    return text[:a] + html.strip() + '\n' + text[b:]


def insert_after(text, title, html):
    _, b = bounds(text, title)
    return text[:b] + html.strip() + '\n' + text[b:]


# ============================================================
# S8 · S6 (certeza) -> S7 (decisiones) -> S8 (dependencias)
# ============================================================
p8 = Path('Presentaciones/M3/sesion-8-modelado-y-normalizacion.html')
s8 = p8.read_text(encoding='utf-8')

if 'data-title="Qué heredamos"' not in s8:
    s8 = insert_after(s8, 'Otra pregunta', r'''
<section class="slide dense mid" data-title="Qué heredamos">
<div class="ey">Puente S6 → S7 → S8 · 7 minutos</div>
<h2>Normalizar no aumenta la certeza de una regla</h2>
<p class="lead">S6 enseñó a distinguir <strong>restricción, permiso, patrón e hipótesis</strong>. S7 convirtió evidencia en decisiones de modelo. Hoy hacemos otra cosa: <strong>probamos la coherencia interna de un recorte de ese modelo</strong>.</p>
<div class="g2">
<div><h3>Tres cosas que NO debemos mezclar</h3>
<table class="optbl"><tbody>
<tr><td><b>Regla del negocio</b></td><td>puede estar confirmada, candidata o ser hipótesis</td></tr>
<tr><td><b>Patrón de los datos</b></td><td>algo que ocurre en la muestra de hoy; por sí solo no obliga al negocio</td></tr>
<tr><td><b>Decisión de diseño</b></td><td>la estructura que elegimos para representar la evidencia disponible</td></tr>
</tbody></table>
<div class="warn"><p style="margin:0"><strong>Ejemplo:</strong> que hoy todas las filas de una mesa muestren 4 puestos puede ser solo un patrón. Lo que justifica <code>mesa_id → puestos</code> es que la capacidad sea realmente una propiedad de la mesa.</p></div></div>
<div><h3>Hoy usamos un recorte, no borramos el modelo</h3>
<p>Para ver dependencias sin mezclar cinco problemas a la vez, aislamos:</p>
<p><code>pedido</code> · <code>linea_pedido</code> · <code>plato</code> · <code>mesa</code> · <code>mesero</code> · <code>cliente</code></p>
<div class="ctx"><p style="margin:0"><strong>Siguen existiendo fuera del ejercicio:</strong> reservas, pagos, inventario/ingredientes, la decisión <code>pedido_mesa</code> de S7 y las preguntas pendientes. No desaparecieron: <strong>hoy no son el objeto de la lupa</strong>.</p></div>
<p class="small">La muestra de hoy contiene pedidos de una sola mesa para que la normalización se vea limpia; eso no revierte la llamada de S7 que permitió varias mesas por pedido.</p></div>
</div>
<div class="brand"><span>Continuidad</span><span>Recorte pedagógico ≠ modelo completo</span></div>
</section>
''')

s8 = replace_slide(s8, 'Dependencias', r'''
<section class="slide dense mid" data-title="Dependencias">
<div class="ey">10 minutos</div>
<h2>«Si sé X, ¿debería poder saber Y?»</h2>
<p class="lead">La dependencia funcional no se decide mirando coincidencias. Se apoya en <strong>el significado del dato y la evidencia del negocio</strong>. S6 ya nos enseñó que un patrón observado no es automáticamente una regla.</p>
<div class="g2">
<div><h3>La pregunta práctica</h3>
<div class="ctx"><p style="margin:0;font-size:1.04em">Si conozco <strong>X</strong>, ¿el negocio y nuestro modelo dicen que <strong>Y</strong> debe quedar determinado?</p></div>
<table class="optbl"><tbody>
<tr><td><code>mesa_id</code></td><td><code>puestos</code></td><td><b>sí</b>: la capacidad pertenece a la mesa</td></tr>
<tr><td><code>linea_id</code></td><td><code>cantidad</code></td><td><b>sí</b>: decisión del modelo de línea</td></tr>
<tr><td><code>pedido_id</code></td><td>un solo plato</td><td><b>no</b>: un pedido contiene varias líneas</td></tr>
</tbody></table>
<p class="small" style="margin-top:.5em">La notación compacta será, por ejemplo: <code>mesa_id → puestos</code>.</p></div>
<div><h3>El filtro heredado de S6</h3>
<ul class="checks">
<li>Si solo lo ves en los datos de hoy, trátalo primero como <strong>patrón observado</strong>.</li>
<li>Si el negocio lo afirma o el concepto lo exige, puede sostener una <strong>dependencia del modelo</strong>.</li>
<li>Si no sabes si debe mantenerse en el tiempo, queda como <strong>pregunta</strong>, no como verdad matemática.</li>
</ul>
<div class="hintbox"><p style="margin:0"><strong>Primera pregunta:</strong> ¿de qué depende? <strong>Segunda:</strong> ¿qué evidencia me permite afirmarlo?</p></div></div>
</div>
<div class="brand"><span>Dependencias</span><span>Semántica primero; patrón después</span></div>
</section>
''')

s8 = replace_slide(s8, 'La libreta', r'''
<section class="slide dense mid" data-title="La libreta">
<div class="ey">8 minutos · el material de hoy</div>
<h2>La libreta vieja mezcla hechos distintos</h2>
<p class="lead">Esta hoja heredada tiene <strong>una fila por pedido</strong> y mete varios platos dentro de una sola celda. No es nuestro modelo final: es el material desordenado que vamos a separar.</p>
<div class="tabla-envuelta"><table class="optbl" style="font-size:.86em">
<thead><tr><th>fecha</th><th>hora</th><th>mesa</th><th>puestos</th><th>mesero</th><th>doc</th><th>cliente</th><th>teléfono</th><th>platos</th><th>total</th><th>pago</th></tr></thead>
<tbody>
<tr><td>2026-09-01</td><td>12:30</td><td>1</td><td>4</td><td>Luis</td><td>CC1</td><td>Ana Restrepo</td><td>3001111111</td><td><b>Ajiaco x2; Bandeja paisa x1</b></td><td>102000</td><td>tarjeta</td></tr>
<tr><td>2026-09-01</td><td>13:00</td><td>2</td><td>2</td><td>Marta</td><td>CC2</td><td>Carlos Mejía</td><td>—</td><td>Sancocho x1</td><td>28000</td><td>efectivo</td></tr>
<tr><td>2026-09-01</td><td>20:15</td><td>1</td><td><b>4</b></td><td>Luis</td><td>CC1</td><td>Ana Restrepo</td><td>3001111111</td><td>Sancocho x2</td><td>56000</td><td>efectivo</td></tr>
</tbody></table></div>
<div class="g3" style="margin-top:.5em">
<div class="card"><h3>Lista dentro de una celda</h3><p><code>Ajiaco x2; Bandeja x1</code> obliga a partir texto antes de contar, relacionar o validar.</p></div>
<div class="card"><h3>Propiedades repetidas</h3><p><code>puestos</code> aparece una y otra vez aunque pertenece a la mesa.</p></div>
<div class="card"><h3>Hay columnas fuera del recorte</h3><p><code>pago</code> no se “pierde”: S6 y S7 ya lo trataron como otro subproblema. Hoy lo dejamos fuera de la lupa.</p></div>
</div>
<div class="ctx" style="margin-top:.55em"><p style="margin:0"><strong>También mantenemos <code>pedido_mesa</code> en el modelo completo.</strong> Para esta muestra elegimos pedidos de una sola mesa; seleccionar una muestra simple no cambia la regla descubierta en S7.</p></div>
<div class="brand"><span>La libreta</span><span>Fuente heredada, no modelo final</span></div>
</section>
''')

s8 = replace_slide(s8, 'El taller', r'''
<section class="slide yellow dense mid" data-title="El taller">
<div class="ey">Taller · 32 minutos en salas</div>
<h2>De la hoja a 2FN y 3FN sin convertirlo en receta</h2>
<p class="lead">La hoja ya está en 1FN. Ahora usen dependencias para mover atributos, pero mantengan el filtro de S6: <strong>no conviertan un patrón de esta muestra en una regla eterna</strong>.</p>
<div class="g2">
<div><h3>Mapa mínimo de las formas normales</h3>
<table class="optbl"><tbody>
<tr><td><b>1FN</b></td><td>un valor atómico por celda; no listas embebidas</td></tr>
<tr><td><b>2FN</b></td><td>si una clave tiene varias partes, un atributo no debe depender solo de una parte</td></tr>
<tr><td><b>3FN</b></td><td>un atributo que no es clave no debería depender de otro atributo que tampoco es clave</td></tr>
</tbody></table>
<p class="small" style="margin-top:.45em">Nuestro modelo conserva <code>linea_id</code> como PK. No vamos a inventar una clave compuesta solo para “forzar” el ejemplo de 2FN.</p>
<div class="ctx"><p style="margin:0"><strong>Las dos preguntas operativas:</strong><br>1) ¿de qué depende esta columna?<br>2) si la separo o la quito, ¿puedo reconstruir la información sin perder significado?</p></div></div>
<div><h3>Lo que entregan</h3>
<ul class="checks">
<li>Las tablas del <strong>recorte</strong>, cada una con su PK.</li>
<li>Para cada atributo movido: <strong>dependencia + evidencia</strong> que la sostiene.</li>
<li>Las relaciones necesarias para reconstruir el recorte.</li>
<li>Una observación que sea solo <strong>patrón</strong> y no se atrevan a convertir en regla.</li>
<li>Una pregunta que todavía requiera negocio.</li>
</ul>
<div class="hintbox"><p style="margin:0"><strong>Total vs precio histórico:</strong> en este caso didáctico <code>pedido.total</code> es exactamente reconstruible desde las líneas; <code>precio_unitario</code> conserva lo cobrado en ese momento y no se reconstruye desde el precio actual del plato.</p></div></div>
</div>
<div class="brand"><span>Taller · 2FN y 3FN</span><span>Dependencia + evidencia + reconstrucción</span></div>
</section>
''')

s8 = replace_slide(s8, 'A donde llegaron', r'''
<section class="slide dense mid" data-title="A donde llegaron">
<div class="ey">Debrief · 10 minutos</div>
<h2>Llegaron a una parte del modelo de ayer</h2>
<p class="lead">La normalización del recorte vuelve a producir varias de las estructuras que S7 ya había defendido. Eso es buena señal, pero <strong>no significa que el modelo completo tenga solo seis tablas</strong>.</p>
<div class="g2">
<div><h3>Lo que reaparece en este ejercicio</h3>
<table class="optbl"><tbody>
<tr><td><code>mesa</code></td><td>capacidad en un solo lugar</td></tr>
<tr><td><code>mesero</code></td><td>identidad separada del pedido</td></tr>
<tr><td><code>cliente</code></td><td>datos del cliente separados del evento</td></tr>
<tr><td><code>plato</code></td><td>catálogo separado de la venta</td></tr>
<tr><td><code>pedido</code></td><td>cabecera de la transacción</td></tr>
<tr><td><code>linea_pedido</code></td><td>cada elemento vendido y sus hechos propios</td></tr>
</tbody></table></div>
<div><h3>Lo que deliberadamente no estamos normalizando hoy</h3>
<ul class="checks">
<li><code>reserva</code> y sus reglas de fecha/hora/capacidad.</li>
<li><code>pago</code> y la cuenta dividida.</li>
<li><code>ingrediente</code>/<code>receta</code> e inventario.</li>
<li><code>pedido_mesa</code>, que sigue siendo la decisión vigente tras la llamada de S7.</li>
<li>cualquier decisión abierta como <code>turno</code>.</li>
</ul>
<div class="warn"><p style="margin:0"><strong>Y el total:</strong> en <em>este caso</em>, mientras sea exactamente la suma de las líneas y no tenga semántica legal propia, preferimos calcularlo. No es una ley universal.</p></div></div>
</div>
<div class="brand"><span>Debrief</span><span>Coincide el razonamiento, no el número de tablas</span></div>
</section>
''')

s8 = replace_slide(s8, 'Cierre', r'''
<section class="slide yellow xdense mid" data-title="Cierre">
<div class="ey">Cierre · 5 minutos</div>
<h2>El modelo está listo para DDL, pero conserva sus niveles de certeza</h2>
<div class="g2">
<div><h3>Lo que te llevas</h3>
<ul class="checks">
<li>S6 sigue vigente: <strong>patrón observado ≠ regla confirmada</strong>.</li>
<li>Una dependencia se pregunta como «si sé X, ¿debería saber Y?» y se justifica con <strong>semántica/evidencia</strong>.</li>
<li>1FN evita listas dentro de una celda; no decide sola la PK.</li>
<li>2FN y 3FN ayudan a colocar atributos donde realmente dependen.</li>
<li>No basta «¿está repetido?»: pregunta <strong>de qué depende</strong> y si puedes <strong>reconstruir sin perder significado</strong>.</li>
<li><code>precio_unitario</code> demuestra que <strong>mismo número ≠ mismo dato</strong>.</li>
<li>El ejercicio usó un <strong>recorte</strong>; el modelo completo conserva reservas, pagos, inventario y <code>pedido_mesa</code>.</li>
</ul></div>
<div><h3>Sesión 9</h3>
<div class="hintbox"><p style="margin:0"><strong>DDL + Supabase/PostgreSQL.</strong> Traduciremos un recorte del modelo a tablas reales. Pero DDL <strong>no convierte una candidata en confirmada</strong>: solo haremos restricciones duras cuando la evidencia o una decisión explícita del modelo las justifique.</p></div>
<p style="margin-top:.75em"><strong>La prueba final:</strong> distinguir qué está protegido por el motor, qué solo está representado y qué todavía debe permanecer como pregunta.</p></div>
</div>
<div class="brand"><span>Cierre</span><span>Certeza + dependencia + reconstrucción</span></div>
</section>
''')

p8.write_text(s8, encoding='utf-8')


# ============================================================
# S9 · DDL sin borrar la certeza levantada en S6
# ============================================================
p9 = Path('Presentaciones/M3/sesion-9-ddl-supabase.html')
s9 = p9.read_text(encoding='utf-8')

if 'data-title="Antes del DDL"' not in s9:
    s9 = insert_after(s9, 'La pregunta', r'''
<section class="slide dense" data-title="Antes del DDL">
<div class="ey">8–13 min · El filtro heredado de S6</div>
<h2>DDL no convierte una suposición en verdad</h2>
<p class="lead">Antes de escribir una restricción, preguntamos <strong>qué clase de evidencia estamos convirtiendo en código</strong>.</p>
<table class="tbl"><thead><tr><th>Lo que traemos</th><th>Qué hacemos en S9</th><th>Ejemplo ABC</th></tr></thead><tbody>
<tr><td><b>Regla confirmada</b></td><td>intentamos protegerla en la capa más baja que tenga información suficiente</td><td>la capacidad de una mesa importa para la reserva, pero comparar otra tabla no cabe en un <code>CHECK</code> simple</td></tr>
<tr><td><b>Regla candidata</b></td><td>la representamos, pero no la endurecemos como si ya estuviera confirmada</td><td>la reserva “confirmada” con fecha/hora/personas/cliente</td></tr>
<tr><td><b>Hipótesis</b></td><td>no se implementa todavía</td><td>bloquear un plato por ingrediente agotado</td></tr>
<tr><td><b>Decisión de modelo</b></td><td>se documenta como decisión, no se atribuye al cliente</td><td><code>linea_id</code>, nombres de restricciones, códigos internos</td></tr>
</tbody></table>
<div class="warn"><p style="margin:0"><strong>Regla de oro:</strong> una restricción de base puede ser muy fuerte. Precisamente por eso debe tener una fuente clara.</p></div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>La certeza también se modela</span></div>
</section>
''')

s9 = replace_slide(s9, 'Anatomía de una columna', r'''
<section class="slide " data-title="Anatomía de una columna">
<div class="ey">18–33 min · Leer antes de escribir</div>
<h2>Una columna se lee de izquierda a derecha</h2>
<pre><code>puestos INTEGER NOT NULL</code></pre>
<div class="steps" style="margin-top:1.2em">
<article><b>1</b><h3><code>puestos</code></h3><p>Nombre de la columna.</p></article>
<article><b>2</b><h3><code>INTEGER</code></h3><p>Tipo de dato.</p></article>
<article><b>3</b><h3><code>NOT NULL</code></h3><p>No acepta <code>NULL</code>.</p></article>
<article><b>4</b><h3><code>,</code></h3><p>Continúa otra definición.</p></article>
</div>
<div class="hintbox"><p style="margin:0"><strong>Microactividad · 60 segundos:</strong> lean esa línea sin palabras SQL: “cada mesa debe tener un número de puestos”. Después digan qué parte es sintaxis y qué parte es una decisión del modelo.</p></div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>Nombre → tipo → regla</span></div>
</section>
''')

s9 = replace_slide(s9, 'Sintaxis de restricciones', r'''
<section class="slide dense" data-title="Sintaxis de restricciones">
<div class="ey">18–33 min · Reglas declarativas</div>
<h2>La sintaxis no decide si la regla es verdadera</h2>
<table class="tbl"><thead><tr><th>Pieza</th><th>Sintaxis</th><th>Qué hace</th><th>Qué debes justificar</th></tr></thead><tbody>
<tr><td><code>NOT NULL</code></td><td><code>puestos INTEGER NOT NULL</code></td><td>no acepta <code>NULL</code></td><td>por qué ese dato debe existir siempre</td></tr>
<tr><td><code>UNIQUE</code></td><td><code>codigo TEXT UNIQUE</code></td><td>no repite valores</td><td>que la unicidad sea regla o decisión explícita</td></tr>
<tr><td><code>DEFAULT</code></td><td><code>estado TEXT DEFAULT 'abierto'</code></td><td>rellena si se omite</td><td>es conveniencia, no validación</td></tr>
<tr><td><code>PRIMARY KEY</code></td><td><code>PRIMARY KEY (cliente_id)</code></td><td>identifica una fila</td><td>la identidad elegida para la entidad</td></tr>
<tr><td><code>FOREIGN KEY</code></td><td><code>FOREIGN KEY (...) REFERENCES ...</code></td><td>evita referencias huérfanas</td><td>que la relación exista en el modelo</td></tr>
<tr><td><code>CHECK</code></td><td><code>CHECK (cantidad &gt; 0)</code></td><td>valida una condición de la fila</td><td>que la condición tenga sentido y alcance suficiente</td></tr>
</tbody></table>
<p class="warn"><strong>S6 sigue mandando:</strong> saber escribir <code>NOT NULL</code> no autoriza a convertir una regla candidata en una restricción implementada.</p>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>Sintaxis + trazabilidad</span></div>
</section>
''')

s9 = replace_slide(s9, 'Primer CREATE', r'''
<section class="slide " data-title="Primer CREATE">
<div class="ey">18–33 min · Anatomía</div>
<h2>Primera tabla: <code>cliente</code></h2>
<pre><code>CREATE TABLE cliente (
    cliente_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT,
    telefono TEXT,

    CONSTRAINT pk_cliente PRIMARY KEY (cliente_id)
);</code></pre>
<p class="hintbox"><strong>Lectura natural:</strong> la tabla tiene una identidad técnica y puede guardar nombre y teléfono.</p>
<p class="warn"><strong>¿Por qué no <code>NOT NULL</code> todavía?</strong> S6 dejó como <em>candidata</em> la regla de qué datos hacen falta para confirmar una reserva. No vamos a convertir esa incertidumbre en una prohibición global sobre todo cliente.</p>
<p class="small">Tampoco usamos <code>UNIQUE (telefono)</code>: dos personas podrían compartir un número y nadie confirmó lo contrario.</p>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>Primer CREATE · no endurecer de más</span></div>
</section>
''')

s9 = replace_slide(s9, 'Relación real', r'''
<section class="slide dense" data-title="Relación real">
<div class="ey">33–48 min · FK</div>
<h2>Segunda tabla: <code>reserva</code></h2>
<pre class="smallcode"><code>CREATE TABLE reserva (
    reserva_id BIGINT GENERATED ALWAYS AS IDENTITY,
    cliente_id BIGINT,
    mesa_id BIGINT,
    fecha DATE,
    hora TIME,
    personas INTEGER,
    estado TEXT NOT NULL DEFAULT 'pendiente',

    CONSTRAINT pk_reserva PRIMARY KEY (reserva_id),
    CONSTRAINT fk_reserva_cliente
        FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id),
    CONSTRAINT fk_reserva_mesa
        FOREIGN KEY (mesa_id) REFERENCES mesa(mesa_id),
    CONSTRAINT ck_reserva_personas
        CHECK (personas IS NULL OR personas &gt; 0)
);</code></pre>
<div class="g2" style="margin-top:.55em"><div class="hintbox"><p style="margin:0"><strong>Representamos</strong> cliente, mesa, fecha, hora y personas porque las reglas de S6 los nombran. Pero la regla 1 sigue candidata: por eso esos datos no se vuelven <code>NOT NULL</code> globalmente.</p></div><div class="ctx"><p style="margin:0"><strong>Microactividad:</strong> un <code>cliente_id</code> inexistente sí debe fallar si se informa. En cambio <code>cliente_id = NULL</code> todavía puede existir en una reserva pendiente. <strong>Representar una relación no obliga a hacerla obligatoria.</strong></p></div></div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>FK ≠ obligatoriedad</span></div>
</section>
''')

s9 = replace_slide(s9, 'CHECK tiene límites', r'''
<section class="slide dense" data-title="CHECK tiene límites">
<div class="ey">33–48 min · Volvemos a las diez reglas de S6</div>
<h2>Que una regla esté confirmada no significa que quepa en un <code>CHECK</code></h2>
<div class="proscons">
<section class="pro"><h3>Condición de una fila</h3><ul><li><code>cantidad &gt; 0</code> como invariante de diseño</li><li><code>precio_unitario &gt;= 0</code> si decidimos no admitir negativos</li><li><code>personas IS NULL OR personas &gt; 0</code></li></ul></section>
<section class="con"><h3>Necesita más contexto</h3><ul><li><b>Regla 3 confirmada:</b> comparar <code>personas</code> con <code>mesa.puestos</code></li><li><b>Regla 2 candidata:</b> detectar intervalos que se solapan</li><li><b>Regla 9 candidata:</b> sumar pagos de varias filas</li><li><b>Regla 10 confirmada:</b> saber quién está ejecutando</li></ul></section>
</div>
<div class="hintbox"><p style="margin:0"><strong>La lección:</strong> certeza y capa son ejes distintos. Una regla puede estar confirmadísima y aun así requerir transacción, lógica de base o aplicación.</p></div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>Confirmada no significa “CHECK”</span></div>
</section>
''')

s9 = replace_slide(s9, 'Antes de Supabase', r'''
<section class="slide dense" data-title="Antes de Supabase">
<div class="ey">60–75 min · Recorte de implementación</div>
<h2>Implementamos una parte del modelo, no reemplazamos S7</h2>
<p class="lead">Para aprender DDL necesitamos suficientes relaciones y restricciones para probar el motor. No hace falta desplegar hoy todo el restaurante.</p>
<div class="g2">
<div><h3>Recorte que sí construiremos</h3>
<table class="tbl"><tbody>
<tr><td><code>cliente</code></td><td>identidad/contacto sin imponer campos candidatos</td></tr>
<tr><td><code>mesa</code></td><td>capacidad y código interno</td></tr>
<tr><td><code>reserva</code></td><td>relaciones y datos que S6 dejó sobre la mesa</td></tr>
<tr><td><code>pedido</code></td><td>transacción operativa, <b>sin inventar vínculo obligatorio con reserva</b></td></tr>
<tr><td><code>pedido_mesa</code></td><td>conserva la llamada de S7: un pedido puede usar varias mesas</td></tr>
<tr><td><code>plato</code></td><td>catálogo</td></tr>
<tr><td><code>linea_pedido</code></td><td>cantidad + precio histórico de S8</td></tr>
</tbody></table></div>
<div><h3>Siguen fuera del laboratorio</h3>
<ul class="checks">
<li><code>mesero</code> y permisos de la regla 10.</li>
<li><code>pago</code> y suma dividida de la regla 9.</li>
<li><code>ingrediente</code>/<code>receta</code> y regla 7.</li>
<li>la hipótesis 6 sobre agotados: <strong>no se implementa</strong>.</li>
</ul>
<div class="ctx"><p style="margin:0"><strong>Recorte ≠ olvido.</strong> Estas partes siguen en el modelo de S7; simplemente no son necesarias para demostrar el objetivo DDL de hoy.</p></div></div>
</div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>Continuidad sin fingir un modelo más pequeño</span></div>
</section>
''')

s9 = replace_slide(s9, 'Taller principal', r'''
<section class="slide dense" data-title="Taller principal">
<div class="ey">90–115 min · Producto</div>
<h2>Construir, justificar y etiquetar</h2>
<div class="vs-grid">
<section><h3>Núcleo obligatorio</h3><ul>
<li><strong>3 tablas</strong> que sí se relacionen.</li>
<li>PK en las 3 y al menos <strong>2 FK</strong>.</li>
<li>Al menos un <code>NOT NULL</code> y un <code>CHECK</code>.</li>
<li><strong>1 INSERT válido + 2 inválidos</strong>.</li>
<li>Para cada restricción: escribir al lado <b>fuente</b>: “regla confirmada”, “regla candidata simulada” o “decisión de modelo”.</li>
</ul></section>
<section><h3>Extensión si terminan</h3><ul>
<li>Llegar a 5–7 tablas.</li>
<li>Agregar <code>pedido_mesa</code>.</li>
<li>Probar un <code>UNIQUE</code> justificado.</li>
<li>Simular qué cambiaría si una regla candidata fuese confirmada.</li>
</ul><p class="small">Una <strong>hipótesis de S6 no se convierte en constraint</strong> para completar el ejercicio.</p></section>
</div>
<p class="warn">El producto no es “mucho SQL”. Es poder señalar una línea y responder: <strong>¿qué evidencia me autorizó a escribirla?</strong></p>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>DDL con trazabilidad</span></div>
</section>
''')

s9 = replace_slide(s9, 'Romper la base', r'''
<section class="slide dense" data-title="Romper la base">
<div class="ey">115–135 min · Pruebas</div>
<h2>Cuatro fallos distintos, cuatro fuentes distintas</h2>
<div class="steps">
<article><b>1</b><h3>NOT NULL</h3><p><code>mesa.puestos = NULL</code><br><span class="small">invariante del modelo</span></p></article>
<article><b>2</b><h3>FK</h3><p>cliente inexistente en reserva<br><span class="small">relación representada</span></p></article>
<article><b>3</b><h3>CHECK</h3><p><code>cantidad = 0</code><br><span class="small">decisión de dominio</span></p></article>
<article><b>4</b><h3>UNIQUE</h3><p><code>mesa.codigo</code> repetido<br><span class="small">decisión explícita del laboratorio</span></p></article>
</div>
<div class="g2" style="margin-top:.7em"><div class="warn"><p style="margin:0"><strong>Y una prueba que debe pasar:</strong> una reserva <code>pendiente</code> con campos todavía nulos. Eso demuestra que no convertimos la regla 1 candidata en <code>NOT NULL</code> global.</p></div><div class="hintbox"><p style="margin:0"><strong>Resultado correcto ≠ siempre “error”.</strong> A veces la evidencia buscada es que PostgreSQL permita algo porque el negocio todavía no lo prohibió.</p></div></div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>Probar también lo que debe permitirse</span></div>
</section>
''')

s9 = replace_slide(s9, 'ALTER TABLE', r'''
<section class="slide dense" data-title="ALTER TABLE">
<div class="ey">135–145 min · Cuando cambia la certeza</div>
<h2>¿Qué pasaría si la candidata 1 fuese confirmada?</h2>
<p class="lead">No afirmamos que haya ocurrido. <strong>Simulamos una nueva entrevista</strong> para ver cómo una regla pasa de documento a estructura sin rehacer la tabla.</p>
<pre class="smallcode"><code>ALTER TABLE reserva
ADD CONSTRAINT ck_reserva_confirmada_completa
CHECK (
    estado &lt;&gt; 'confirmada'
    OR (
        fecha IS NOT NULL
        AND hora IS NOT NULL
        AND personas IS NOT NULL
        AND cliente_id IS NOT NULL
    )
);</code></pre>
<div class="g2" style="margin-top:.5em"><div class="hintbox"><p style="margin:0"><strong>Por qué no pusimos cuatro <code>NOT NULL</code> desde el comienzo:</strong> la frase de S6 hablaba de <em>confirmar</em> una reserva, no necesariamente de crear un borrador.</p></div><div class="warn"><p style="margin:0"><strong>En el script queda comentado.</strong> Solo se ejecuta si el docente declara la simulación: “la dueña acaba de confirmar la regla 1”.</p></div></div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>ALTER = la estructura también evoluciona</span></div>
</section>
''')

s9 = replace_slide(s9, 'DROP TABLE', r'''
<section class="slide dense" data-title="DROP TABLE" data-opcional="1">
<div class="ey">Opcional · 3 minutos · si hay tiempo</div>
<h2>Para borrar también importan las dependencias</h2>
<pre><code>DROP TABLE linea_pedido;
DROP TABLE pedido_mesa;
DROP TABLE pedido;</code></pre>
<p class="warn">Para crear: primero aquello que será referenciado. Para borrar: normalmente primero los objetos que dependen de otros.</p>
<p class="small">No es el objetivo central de hoy. Si el laboratorio va justo de tiempo, esta diapositiva se salta.</p>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>DROP TABLE · extensión</span></div>
</section>
''')

s9 = replace_slide(s9, 'Cierre', r'''
<section class="slide dark" data-title="Cierre">
<div class="ey">160–165 min · Frase final</div>
<h2>DDL hace ejecutable una decisión; no fabrica evidencia</h2>
<p class="quote">Una conversación con el negocio terminó convertida en estructura, pero cada constraint conserva la pregunta: “¿quién dijo que esto debía ser verdad?”</p>
<div class="steps">
<article><b>S6</b><p>certeza de la regla</p></article>
<article><b>S7</b><p>decisión de modelo</p></article>
<article><b>S8</b><p>dependencia y coherencia</p></article>
<article><b>S9</b><p>DDL + prueba real</p></article>
</div>
<div class="g2" style="margin-top:.7em"><div class="ctx"><p style="margin:0"><strong>Confirmada:</strong> intentamos protegerla donde haya información suficiente.</p></div><div class="warn"><p style="margin:0"><strong>Candidata o hipótesis:</strong> se documenta, se representa si hace falta, pero no se endurece silenciosamente.</p></div></div>
<div class="brand"><span>ANDESDB · Sesión 9</span><span>Cierre · trazabilidad</span></div>
</section>
''')

p9.write_text(s9, encoding='utf-8')


# ============================================================
# Script S9 alineado con S6/S7/S8
# ============================================================
ps = Path('Scripts/S9.sql')
ps.write_text(r'''-- ============================================================
-- ANDESDB · Sesión 9 · DDL + Supabase/PostgreSQL
-- Convención: palabras SQL en MAYÚSCULA; objetos en minúscula.
--
-- PRINCIPIO HEREDADO DE S6:
--   * regla confirmada != regla candidata != hipótesis
--   * una decisión de modelo debe declararse como tal
--   * DDL no aumenta la certeza de una afirmación
--
-- Este archivo implementa un RECORTE del modelo de S7–S8.
-- No elimina pago, mesero, inventario/ingredientes ni otras partes
-- que hoy quedan fuera del objetivo DDL.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS abc_e01;
SET search_path TO abc_e01;

DROP TABLE IF EXISTS linea_pedido CASCADE;
DROP TABLE IF EXISTS pedido_mesa CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS reserva CASCADE;
DROP TABLE IF EXISTS plato CASCADE;
DROP TABLE IF EXISTS mesa CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;

-- DECISIÓN DE MODELO: identidad técnica del cliente.
-- S6 NO confirmó que nombre o teléfono sean obligatorios al crear el cliente.
CREATE TABLE cliente (
    cliente_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT,
    telefono TEXT,
    CONSTRAINT pk_cliente PRIMARY KEY (cliente_id)
);

-- La capacidad de la mesa es necesaria para la regla 3 confirmada.
-- codigo UNIQUE es una DECISIÓN EXPLÍCITA DEL LABORATORIO, no una frase de S6.
CREATE TABLE mesa (
    mesa_id BIGINT GENERATED ALWAYS AS IDENTITY,
    codigo TEXT NOT NULL,
    puestos INTEGER NOT NULL,
    CONSTRAINT pk_mesa PRIMARY KEY (mesa_id),
    CONSTRAINT uq_mesa_codigo UNIQUE (codigo),
    CONSTRAINT ck_mesa_puestos CHECK (puestos > 0)
);

-- Catálogo del recorte. precio_actual representa el precio vigente,
-- distinto del precio histórico cobrado que guardaremos en linea_pedido.
CREATE TABLE plato (
    plato_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    precio_actual NUMERIC(10,2),
    CONSTRAINT pk_plato PRIMARY KEY (plato_id),
    CONSTRAINT ck_plato_precio
        CHECK (precio_actual IS NULL OR precio_actual >= 0)
);

-- REGLA 1 DE S6: candidata.
-- Por eso cliente/fecha/hora/personas NO son NOT NULL globalmente.
-- Una reserva pendiente puede estar incompleta.
-- REGLA 3: confirmada, pero comparar personas con mesa.puestos
-- requiere información de otra fila/tabla: no cabe en un CHECK simple.
CREATE TABLE reserva (
    reserva_id BIGINT GENERATED ALWAYS AS IDENTITY,
    cliente_id BIGINT,
    mesa_id BIGINT,
    fecha DATE,
    hora TIME,
    personas INTEGER,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    CONSTRAINT pk_reserva PRIMARY KEY (reserva_id),
    CONSTRAINT fk_reserva_cliente
        FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id),
    CONSTRAINT fk_reserva_mesa
        FOREIGN KEY (mesa_id) REFERENCES mesa(mesa_id),
    CONSTRAINT ck_reserva_personas
        CHECK (personas IS NULL OR personas > 0)
);

-- No inventamos pedido.reserva_id: S6 no confirmó esa relación.
CREATE TABLE pedido (
    pedido_id BIGINT GENERATED ALWAYS AS IDENTITY,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    estado TEXT NOT NULL DEFAULT 'abierto',
    CONSTRAINT pk_pedido PRIMARY KEY (pedido_id)
);

-- NUEVA EVIDENCIA DE S7: un pedido puede atender varias mesas.
CREATE TABLE pedido_mesa (
    pedido_id BIGINT NOT NULL,
    mesa_id BIGINT NOT NULL,
    CONSTRAINT pk_pedido_mesa PRIMARY KEY (pedido_id, mesa_id),
    CONSTRAINT fk_pedido_mesa_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedido(pedido_id),
    CONSTRAINT fk_pedido_mesa_mesa
        FOREIGN KEY (mesa_id) REFERENCES mesa(mesa_id)
);

-- DECISIÓN DE MODELO DE S8: linea_id como PK.
-- No imponemos UNIQUE(pedido_id, plato_id) porque nadie confirmó
-- que un plato solo pueda aparecer una vez por pedido.
CREATE TABLE linea_pedido (
    linea_id BIGINT GENERATED ALWAYS AS IDENTITY,
    pedido_id BIGINT NOT NULL,
    plato_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    CONSTRAINT pk_linea_pedido PRIMARY KEY (linea_id),
    CONSTRAINT fk_linea_pedido_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedido(pedido_id),
    CONSTRAINT fk_linea_pedido_plato
        FOREIGN KEY (plato_id) REFERENCES plato(plato_id),
    CONSTRAINT ck_linea_cantidad CHECK (cantidad > 0),
    CONSTRAINT ck_linea_precio CHECK (precio_unitario >= 0)
);

-- ------------------------------------------------------------
-- DATOS VÁLIDOS
-- ------------------------------------------------------------
INSERT INTO cliente (nombre, telefono) VALUES
('Ana Pérez', '3001234567'),
('Luis Gómez', '3102223344');

INSERT INTO mesa (codigo, puestos) VALUES
('M1', 4), ('M2', 4), ('M3', 8);

INSERT INTO plato (nombre, precio_actual) VALUES
('Ajiaco', 28000), ('Bandeja paisa', 32000), ('Limonada', 7000);

INSERT INTO reserva (cliente_id, mesa_id, fecha, hora, personas, estado)
VALUES (1, 1, '2026-09-04', '20:00', 4, 'pendiente');

-- Esta fila DEBE poder existir: demuestra que la regla 1 sigue candidata
-- y que no convertimos “confirmar” en NOT NULL para todo estado.
INSERT INTO reserva (estado)
VALUES ('pendiente');

INSERT INTO pedido (estado)
VALUES ('abierto');

INSERT INTO pedido_mesa (pedido_id, mesa_id) VALUES
(1, 1), (1, 2);

INSERT INTO linea_pedido (pedido_id, plato_id, cantidad, precio_unitario) VALUES
(1, 1, 2, 28000),
(1, 3, 4, 7000);

-- Reconstrucción del total: reutiliza WITH + GROUP BY + JOIN.
WITH totales AS (
    SELECT pedido_id,
           SUM(cantidad * precio_unitario) AS total
    FROM linea_pedido
    GROUP BY pedido_id
)
SELECT p.pedido_id, t.total
FROM pedido p
JOIN totales t ON t.pedido_id = p.pedido_id;

-- ------------------------------------------------------------
-- PRUEBAS QUE DEBEN FALLAR: ejecutar UNA POR UNA.
-- ------------------------------------------------------------

-- A. NOT NULL · invariante del modelo: una mesa necesita capacidad.
-- INSERT INTO mesa (codigo, puestos)
-- VALUES ('M4', NULL);

-- B. UNIQUE · decisión explícita del laboratorio sobre mesa.codigo.
-- INSERT INTO mesa (codigo, puestos)
-- VALUES ('M1', 6);

-- C. FK · si informamos un cliente, debe existir.
-- INSERT INTO reserva (cliente_id, estado)
-- VALUES (999999, 'pendiente');

-- D. CHECK · decisión de dominio: no aceptamos cantidad cero.
-- INSERT INTO linea_pedido (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES (1, 2, 0, 32000);

-- E. CHECK · personas, si se informa, debe ser positiva.
-- INSERT INTO reserva (personas, estado)
-- VALUES (0, 'pendiente');

-- ------------------------------------------------------------
-- SIMULACIÓN DIDÁCTICA · NO EJECUTAR HASTA QUE EL DOCENTE DIGA:
-- “La dueña acaba de confirmar la regla 1”.
--
-- La regla habla de CONFIRMAR una reserva, no de crear un borrador.
-- Por eso una condición por estado es más fiel que cuatro NOT NULL globales.
-- ------------------------------------------------------------
-- ALTER TABLE reserva
-- ADD CONSTRAINT ck_reserva_confirmada_completa
-- CHECK (
--     estado <> 'confirmada'
--     OR (
--         fecha IS NOT NULL
--         AND hora IS NOT NULL
--         AND personas IS NOT NULL
--         AND cliente_id IS NOT NULL
--     )
-- );
--
-- Después de agregarla, esto debería fallar:
-- INSERT INTO reserva (estado)
-- VALUES ('confirmada');

-- Nota Supabase: hoy usamos SQL Editor y un schema de clase.
-- No exponemos estas tablas a una app ni configuramos Data API/RLS.
''', encoding='utf-8')


# Validaciones específicas del parche
assert 'Una fila por cada\nplato de cada pedido' not in s8
assert 'Son las mismas seis que hicieron ayer' not in s8
assert 'data-title="Qué heredamos"' in s8
assert 'patrón observado ≠ regla confirmada' in s8
assert 'pedido.reserva_id' not in s9
assert 'data-title="Antes del DDL"' in s9
assert 'regla candidata' in s9.lower()
assert 'pedido_mesa' in s9
assert 'ck_reserva_confirmada_completa' in s9
assert 'personas <= 20' not in s9
print('Parche S8/S9 desde S6 aplicado y validaciones locales OK')
