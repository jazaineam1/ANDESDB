from pathlib import Path

P = Path('Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html')
text = P.read_text(encoding='utf-8')


def replace_slide(text, title, new):
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
    return text[:start] + new.strip() + '\n\n' + text[nxt:]


text = replace_slide(text, 'La herramienta', r'''
<section class="slide dense mid" data-title="El criterio">
<div class="ey">Antes del taller · 4 minutos</div>
<h2>Una decisión defendible deja rastro</h2>
<p class="lead">Hoy no quiero que encuentren “la tabla correcta”. Quiero que puedan explicar <strong>por qué una decisión tiene sentido con la evidencia que tenemos</strong>.</p>
<div class="g2">
<div><h3>Las cinco preguntas</h3>
<table class="optbl"><tbody>
<tr><td><b>1 · Evidencia</b></td><td>¿Qué frase o regla del negocio me obliga a decidir?</td></tr>
<tr><td><b>2 · Opciones</b></td><td>¿Qué diseños razonables existen?</td></tr>
<tr><td><b>3 · Elección</b></td><td>¿Cuál elijo con lo que sé hoy?</td></tr>
<tr><td><b>4 · Precio</b></td><td>¿Qué gano y qué vuelvo más difícil?</td></tr>
<tr><td><b>5 · Prueba</b></td><td>¿Qué dato o cambio demostraría que mi decisión funciona —o que debo cambiarla?</td></tr>
</tbody></table></div>
<div><h3>La diferencia importante</h3>
<div class="ctx"><p style="margin:0"><strong>Una regla no dibuja automáticamente una tabla.</strong> La regla aporta evidencia. El modelo es una decisión que hacemos para representar esa evidencia.</p></div>
<p>Por eso dos equipos pueden terminar con modelos distintos y ambos ser defendibles.</p>
<div class="hintbox"><p style="margin:0"><strong>Regla del taller:</strong> si no puedes explicar evidencia, opción, elección y consecuencia, todavía no terminaste de decidir.</p></div></div>
</div>
<div class="brand"><span>El criterio</span><span>Evidencia → opciones → elección → precio → prueba</span></div>
</section>''')

text = replace_slide(text, 'La practica', r'''
<section class="slide dense mid" data-title="Una decisión completa">
<div class="ey">Ejemplo trabajado · 10 minutos</div>
<h2>Regla 4: un pedido no puede estar en más de una mesa</h2>
<p class="lead">No saltemos de la frase a una FK. Hagamos visible todo el razonamiento.</p>
<div class="g2">
<div><h3>1 · Evidencia y opciones</h3>
<div class="ctx"><p style="margin:0"><strong>Evidencia:</strong> “Un pedido no puede asignarse a más de una mesa”. Con lo que sabemos hoy, cada pedido tiene como máximo una mesa.</p></div>
<table class="optbl"><tbody>
<tr><td><b>Opción A</b></td><td><code>pedido.mesa_id</code></td><td>simple; la cardinalidad queda N:1</td></tr>
<tr><td><b>Opción B</b></td><td><code>pedido_mesa</code></td><td>más flexible; permitiría varias mesas</td></tr>
</tbody></table>
</div>
<div><h3>2 · Elección, precio y prueba</h3>
<p><strong>Elegimos A hoy</strong>, porque es la estructura mínima que representa la regla confirmada.</p>
<ul class="checks">
<li><strong>Ganamos:</strong> simplicidad y una regla estructural fácil de entender.</li>
<li><strong>Pagamos:</strong> si mañana el negocio junta mesas, este diseño tendrá que cambiar.</li>
<li><strong>Prueba:</strong> intentar asociar un segundo <code>mesa_id</code> al mismo pedido no debería ser posible sin alterar el esquema.</li>
</ul>
<div class="warn"><p style="margin:0"><strong>No elegimos A porque sea “más correcta”.</strong> La elegimos porque corresponde a la evidencia disponible <em>hoy</em>. Más adelante una llamada de la dueña pondrá esta decisión a prueba.</p></div></div>
</div>
<div class="brand"><span>Ejemplo 1</span><span>La decisión vale mientras valga su evidencia</span></div>
</section>''')

text = replace_slide(text, 'Los veinte minutos', r'''
<section class="slide dense mid" data-title="Dos decisiones más">
<div class="ey">Ejemplos trabajados · 10 minutos</div>
<h2>Dos reglas parecidas pueden exigir decisiones distintas</h2>
<div class="g2">
<div><h3>Regla 1 · Reserva completa</h3>
<p class="small"><b>Evidencia:</b> una reserva no puede confirmarse sin fecha, hora, personas y cliente.</p>
<p><strong>Decisión:</strong> esos datos pertenecen a <code>reserva</code>; los que siempre son necesarios para existir/confirmarse se modelan como obligatorios según el estado que representemos.</p>
<ul class="checks">
<li><b>Opción descartada:</b> guardar cliente como texto dentro de la reserva.</li>
<li><b>Por qué:</b> necesitamos una identidad reutilizable del cliente, no repetir su nombre.</li>
<li><b>Precio:</b> aparece una relación y una FK, pero ganamos consistencia.</li>
</ul></div>
<div><h3>Regla 2 · No solapar reservas</h3>
<p class="small"><b>Evidencia:</b> una mesa no puede tener dos reservas que se solapen en el tiempo.</p>
<p><strong>Decisión:</strong> el modelo debe guardar mesa, inicio y duración/fin de forma que el solape pueda evaluarse, pero <strong>no inventamos un <code>UNIQUE</code></strong> que no expresa intervalos.</p>
<ul class="checks">
<li><b>Representar</b> la regla sí es tarea del modelo.</li>
<li><b>Garantizar</b> el solape puede requerir lógica adicional.</li>
<li><b>Prueba:</b> dos reservas parcialmente superpuestas deben ser detectables.</li>
</ul></div>
</div>
<div class="hintbox"><p style="margin:0"><strong>El caso <code>dvdrental</code> queda publicado como práctica opcional.</strong> Ya conocen PK, FK, N:N y tablas puente de sesiones anteriores; hoy el tiempo se usa en justificar decisiones sobre ABC.</p></div>
<div class="brand"><span>Ejemplos 2 y 3</span><span>Representar no siempre significa garantizar</span></div>
</section>''')

text = replace_slide(text, 'El encargo', r'''
<section class="slide yellow dense mid" data-title="El encargo">
<div class="ey">Taller · 39 minutos en salas</div>
<h2>El encargo: un modelo que se pueda defender</h2>
<p class="lead">Conviertan las diez reglas del Restaurante ABC en un modelo. Pero cada decisión importante debe venir acompañada de <strong>su razonamiento</strong>, no solo de una caja y una línea.</p>
<div class="g2">
<div><h3>Producto mínimo</h3>
<ul class="checks">
<li><strong>Seis entidades como mínimo</strong>, pero seis no es una meta: una tabla inventada para completar el número se elimina.</li>
<li>Todas las relaciones con <strong>cardinalidad explicada en palabras</strong>.</li>
<li><strong>Tres decisiones difíciles</strong> documentadas.</li>
<li><strong>Una pregunta al negocio</strong> que quede abierta.</li>
<li>Al volver, pegan en el chat el <strong>código del modelo</strong>.</li>
</ul>
<div class="hintbox"><p style="margin:0">Si tienen cinco entidades muy bien justificadas y una sexta que nadie puede defender, <strong>la sexta sobra</strong>. El mínimo sirve para obligarnos a explorar, no para premiar cantidad.</p></div></div>
<div><h3>Para cada decisión difícil escriban esto</h3>
<table class="optbl"><tbody>
<tr><td><b>Evidencia</b></td><td>regla/frase que la provoca</td></tr>
<tr><td><b>Opciones</b></td><td>dos diseños posibles</td></tr>
<tr><td><b>Elegimos</b></td><td>una, y por qué</td></tr>
<tr><td><b>Precio</b></td><td>qué facilita y qué dificulta</td></tr>
<tr><td><b>Falta saber</b></td><td>qué pregunta podría cambiarla</td></tr>
</tbody></table>
<p class="small" style="margin-top:.5em">En el primer minuto alguien comparte pantalla. Antes de una decisión difícil: <strong>30 segundos de decisión individual</strong>; después discuten. Así el más rápido no decide por toda la sala.</p></div>
</div>
<div class="brand"><span>Taller · Del relato al modelo</span><span>No entregan tablas: entregan decisiones justificadas</span></div>
</section>''')

text = replace_slide(text, 'Tres decisiones', r'''
<section class="slide tiny mid" data-title="Tres decisiones">
<div class="ey">Debrief · 22 minutos</div>
<h2>Tres decisiones: qué evidencia las sostiene y qué cuestan</h2>
<p class="lead">No las comparemos por “correcta/incorrecta”. Comparemos <strong>qué explica mejor cada opción y qué obliga a pagar después</strong>.</p>
<div class="g3">
<div class="card"><h3>1 · Turno</h3>
<p><b>Evidencia:</b> aparece como concepto operativo, pero ninguna regla exige hoy atributos propios.</p>
<p class="small"><b>Opciones:</b> texto/atributo o entidad <code>turno</code>.<br><b>Referencia:</b> entidad si esperamos horario, aforo o configuración propia.<br><b>Precio:</b> una tabla más hoy a cambio de no rediseñar cuando el turno tenga datos propios.<br><b>Pregunta:</b> “¿los turnos tienen horario/configuración que cambia?”</p></div>
<div class="card"><h3>2 · Línea de pedido</h3>
<p><b>Evidencia:</b> un pedido contiene platos y necesitamos cantidad; además el precio cobrado puede ser histórico.</p>
<p class="small"><b>Opciones:</b> N:N directa o entidad asociativa.<br><b>Referencia:</b> <code>linea_pedido</code> porque la relación tiene hechos propios: cantidad/precio.<br><b>Precio:</b> más filas y joins, pero conserva exactamente qué se vendió.<br><b>Prueba:</b> dos pedidos pueden contener el mismo plato con cantidades/precios distintos.</p></div>
<div class="card"><h3>3 · Mesero</h3>
<p><b>Evidencia:</b> regla 10 habla del <em>mesero asignado</em> y de quién puede modificar.</p>
<p class="small"><b>Opciones:</b> guardar nombre como texto o crear <code>mesero</code>.<br><b>Referencia:</b> entidad, porque necesitamos identidad para asignar y eventualmente autorizar.<br><b>Precio:</b> relación adicional, pero deja de depender de un nombre escrito a mano.<br><b>Pregunta:</b> “¿un mesero puede cambiar de nombre/estado/turno?”</p></div>
</div>
<div class="warn" style="margin-top:.6em"><p style="margin:0"><strong>Antes de mostrar mi referencia:</strong> cada sala elige una de estas tres y dice en 30 segundos evidencia → elección → precio. Si solo dicen “porque sí”, todavía falta la decisión.</p></div>
<div class="brand"><span>Debrief · Defender</span><span>Una buena decisión explica también su costo</span></div>
</section>''')

text = replace_slide(text, 'Modelo de referencia', r'''
<section class="slide dense mid" data-title="Modelo de referencia">
<div class="ey">Debrief · una solución defendible</div>
<h2>Esta es una solución posible, no la respuesta</h2>
<p class="lead">No comparen cuántas tablas tienen. Comparen <strong>qué decisión está mejor justificada</strong>. Mi modelo también contiene decisiones discutibles.</p>
<div class="g2">
<div><h3>Lo que la evidencia empuja con fuerza</h3>
<table class="optbl"><tbody>
<tr><td><code>mesa</code></td><td>capacidad + asignación</td></tr>
<tr><td><code>cliente</code></td><td>identidad reutilizable</td></tr>
<tr><td><code>mesero</code></td><td>asignación/autoría</td></tr>
<tr><td><code>reserva</code></td><td>evento con fecha/hora/personas</td></tr>
<tr><td><code>pedido</code></td><td>transacción operativa</td></tr>
<tr><td><code>plato</code>, <code>ingrediente</code>, <code>pago</code></td><td>hechos que las reglas necesitan distinguir</td></tr>
</tbody></table></div>
<div><h3>Lo que exige una decisión</h3>
<ul class="checks">
<li><code>turno</code>: podría empezar como atributo; lo separo solo si tiene identidad/datos propios.</li>
<li><code>receta</code>: aparece porque plato–ingrediente es N:N; puede además guardar cantidad/unidad.</li>
<li><code>linea_pedido</code>: no es “una tabla puente porque sí”; existe porque la relación pedido–plato tiene datos propios.</li>
</ul>
<div class="ctx"><p style="margin:0"><strong>Comparación obligatoria:</strong> encuentren <b>una cosa que a su modelo le faltó</b> y <b>una decisión de su modelo que prefieran al mío</b>. La segunda es tan importante como la primera.</p></div>
<p class="small">El número de tablas no es una nota. Un modelo con menos tablas puede ser mejor si representa el mismo negocio con menos supuestos.</p></div>
</div>
<div class="brand"><span>Debrief · Referencia</span><span>Comparar razones, no contar tablas</span></div>
</section>''')

text = replace_slide(text, 'Dos de diez', r'''
<section class="slide dense mid" data-title="Dos de diez">
<div class="ey">Debrief · el hallazgo</div>
<h2>¿Por qué solo algunas reglas caben directamente en el esquema?</h2>
<p class="lead">No memoricen “2 de 10”. Entiendan <strong>qué hace difícil a las otras</strong>.</p>
<div class="g2">
<div><h3>El esquema sí puede garantizar directamente</h3>
<table class="optbl"><tbody>
<tr><td><b>Regla 1</b></td><td>datos obligatorios de la reserva</td><td><code>NOT NULL</code> / FK según el estado modelado</td></tr>
<tr><td><b>Regla 4</b></td><td>un pedido → una mesa, con la evidencia original</td><td>la cardinalidad/FK puede representarla</td></tr>
</tbody></table>
<div class="hintbox"><p style="margin:0">Estas reglas dependen de <strong>una fila o una relación estructural directa</strong>. El motor puede rechazarlas sin mirar una historia completa.</p></div></div>
<div><h3>Las demás fallan por razones distintas</h3>
<table class="optbl"><tbody>
<tr><td><b>2</b></td><td>solape</td><td>compara intervalos entre filas</td></tr>
<tr><td><b>3</b></td><td>aforo</td><td>compara datos de otra entidad</td></tr>
<tr><td><b>5, 8</b></td><td>estado/proceso</td><td>“al menos uno” o “cerrar solo si...”</td></tr>
<tr><td><b>7</b></td><td>tiempo</td><td>depende del momento de uso</td></tr>
<tr><td><b>9</b></td><td>suma de pagos</td><td>agrega varias filas</td></tr>
<tr><td><b>10</b></td><td>permiso</td><td>depende de quién ejecuta</td></tr>
<tr><td><b>6</b></td><td>hipótesis</td><td>primero hay que confirmarla</td></tr>
</tbody></table></div>
</div>
<div class="brand"><span>Debrief · El hallazgo</span><span>La dificultad de la regla indica la capa que necesita</span></div>
</section>''')

text = replace_slide(text, 'Donde va cada regla', r'''
<section class="slide dense mid" data-title="Donde va cada regla">
<div class="ey">Debrief · mapa, no contenido nuevo</div>
<h2>Una regla baja hasta la primera capa que realmente pueda garantizarla</h2>
<p class="lead">No tienen que aprender triggers ni backend hoy. Solo reconocer <strong>por qué el esquema a veces alcanza y a veces no</strong>.</p>
<div class="steps">
<article><b>0</b><h3>¿Es cierta?</h3><p>Si sigue siendo hipótesis, no implementamos nada todavía.</p></article>
<article><b>1</b><h3>¿Cabe en estructura?</h3><p>PK, FK, <code>NOT NULL</code>, <code>UNIQUE</code>, <code>CHECK</code>.</p></article>
<article><b>2</b><h3>¿Necesita contexto?</h3><p>Varias filas, tiempo, suma o transición: hará falta lógica de base/transacción.</p></article>
<article><b>3</b><h3>¿Depende de quién?</h3><p>Permisos y flujo de usuario suelen necesitar aplicación/backend.</p></article>
</div>
<div class="g2" style="margin-top:.7em">
<div class="ctx"><p style="margin:0"><strong>La interfaz no garantiza la regla.</strong> Puede evitar que alguien intente el error, pero otro cliente o proceso podría saltársela.</p></div>
<div class="hintbox"><p style="margin:0"><strong>Decisión práctica:</strong> empiecen siempre por la capa más baja que tenga información suficiente para garantizar la regla. Si no alcanza, suben.</p></div></div>
<div class="brand"><span>Debrief · La escalera</span><span>Primero confirmar; luego buscar la capa mínima suficiente</span></div>
</section>''')

text = replace_slide(text, 'La llamada', r'''
<section class="slide dense mid" data-title="La llamada">
<div class="ey">7 minutos · una decisión cambia cuando cambia la evidencia</div>
<h2>“Cuando viene un grupo grande, juntamos dos mesas”</h2>
<div class="ctx" style="font-size:1.06em"><p style="margin:0">La dueña agrega: “juntamos dos mesas y les tomamos <strong>un solo pedido</strong>”.</p></div>
<div class="g2">
<div><h3>Antes de tocar el modelo</h3>
<p><strong>60 segundos:</strong> ¿qué decisión de hace un rato dejó de ser válida?</p>
<ul class="checks">
<li>Identifiquen la evidencia vieja.</li>
<li>Identifiquen la evidencia nueva.</li>
<li>Digan qué cardinalidad cambia.</li>
<li>Propongan la estructura mínima que ahora sí representa el negocio.</li>
</ul>
<div class="warn"><p style="margin:0">No digan todavía “tabla puente” por memoria. Primero digan <strong>qué relación cambió</strong> y por qué.</p></div></div>
<div data-r><h3>La decisión revisada</h3>
<p>Antes elegimos <code>pedido.mesa_id</code> porque la regla 4 decía “máximo una mesa”. <strong>La decisión era defendible con esa evidencia.</strong></p>
<p>La nueva frase la invalida: pedido ↔ mesa pasa a permitir varios en ambos sentidos a lo largo del tiempo. Aparece <code>pedido_mesa</code> y <code>pedido.mesa_id</code> deja de representar el negocio.</p>
<div class="hintbox"><p style="margin:0"><strong>Lo importante:</strong> el modelo anterior no era “malo”. El negocio cambió —o descubrimos una regla que faltaba— y por eso cambian esquema, migración de datos y pruebas.</p></div></div>
</div>
<div class="brand"><span>El cambio</span><span>Una decisión vale mientras valga su evidencia</span></div>
</section>''')

# Ajustes de texto menores: que la agenda no anuncie el ensayo DVD como bloque central.
text = text.replace('<h3>La herramienta</h3><p><strong>Veinte minutos</strong> con <code>dvdrental</code>, que ya conocen, para aprenderla con red antes de usarla sin ella.</p>',
                    '<h3>Cómo decidimos</h3><p><strong>Veinte minutos</strong> para hacer visible el razonamiento: evidencia, opciones, elección, precio y prueba.</p>')
text = text.replace('<h3>El taller</h3><p>En equipo. Su modelo del Restaurante ABC, y una base de datos de verdad al final.</p>',
                    '<h3>El taller</h3><p>En equipo. Su modelo del Restaurante ABC, con decisiones justificadas y una base comprobable al final.</p>')

P.write_text(text, encoding='utf-8')

# Validaciones específicas del cambio.
assert 'El ensayo &middot; 20 minutos' not in text
assert 'Primero con <code>dvdrental</code>' not in text
assert 'Evidencia → opciones → elección → precio → prueba' in text
assert 'Esta es una solución posible, no la respuesta' in text
assert 'Una decisión vale mientras valga su evidencia' in text
assert 'constructor-abc.html?caso=dvd' not in text or 'práctica opcional' in text.lower()
print('S7 parcheada: DVD deja de ser bloque central y se profundiza el razonamiento de decisiones.')
