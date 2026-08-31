from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def write(rel, text):
    (ROOT / rel).write_text(text, encoding="utf-8")


def rep(rel, old, new, count=1):
    text = read(rel)
    found = text.count(old)
    if found != count:
        raise RuntimeError(f"{rel}: esperaba {count} ocurrencia(s) y encontré {found}: {old[:120]!r}")
    write(rel, text.replace(old, new))


def rep_at_least(rel, old, new, minimum=1):
    text = read(rel)
    found = text.count(old)
    if found < minimum:
        raise RuntimeError(f"{rel}: no encontré patrón: {old[:120]!r}")
    write(rel, text.replace(old, new))


# ------------------------------------------------------------------
# S7 · dvdrental queda como apoyo DENTRO de la sesión, no tarea.
# ------------------------------------------------------------------
s7 = "Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html"
rep(
    s7,
    '<a href="constructor-abc.html?caso=dvd&amp;sesion=7">&#127916; La pr&aacute;ctica<small>dvdrental &middot; para aprender la herramienta</small></a>',
    '<a href="constructor-abc.html?caso=dvd&amp;sesion=7">&#127916; Apoyo con dvdrental<small>solo si el equipo necesita orientarse con la herramienta</small></a>'
)
rep(
    s7,
    '<strong>El caso <code>dvdrental</code> queda publicado como práctica opcional.</strong> Ya conocen PK, FK, N:N y tablas puente de sesiones anteriores; hoy el tiempo se usa en justificar decisiones sobre ABC.',
    '<strong>El caso <code>dvdrental</code> queda disponible como apoyo dentro del taller.</strong> No es una tarea aparte ni para casa: se usa solo si un equipo necesita orientarse con la herramienta. El trabajo central sigue siendo justificar decisiones sobre ABC.'
)


# ------------------------------------------------------------------
# Constructor · mismo artefacto, revelación controlada por sesión.
# ------------------------------------------------------------------
c = "Presentaciones/M3/constructor-abc.html"

rep(
    c,
    "var SESION = 7;\nvar SESIONES = {\n  7: {paso8:false, ddl:false},\n  8: {paso8:true,  ddl:false},\n  9: {paso8:true,  ddl:true}\n};\nfunction hoy(){ return SESIONES[SESION] || SESIONES[7]; }\n\n/* El Restaurante ABC tiene ocho pasos y dvdrental siete: el 8 es `solo:'abc'`.\n   La banda no puede prometer un paso que esta puerta no tiene. */\nfunction tieneP8(){\n  return PASOS.some(function(p){ return p.n === 8 && (!p.solo || p.solo === CASO); });\n}\nfunction textoHoy(){\n  var elSQL = ' El SQL de tus tablas se abre <b>el viernes</b>, en la sesi&oacute;n 9.';\n  if (SESION >= 9)\n    return '<b>Sesi&oacute;n 9.</b> Hoy se abre <b>el SQL de tus tablas</b>, en la ' +\n           'pesta&ntilde;a del paso 5.';\n  if (SESION === 8)\n    return tieneP8()\n      ? '<b>Sesi&oacute;n 8.</b> Hoy se abre el <b>paso 8</b>, con tu modelo de ayer.' + elSQL\n      : '<b>Sesi&oacute;n 8.</b> El paso 8 es del <b>Restaurante ABC</b>: c&aacute;mbiate de caso ' +\n        'aqu&iacute; arriba.' + elSQL;\n  return '<b>Sesi&oacute;n 7.</b> Hoy se recorren los <b>siete pasos</b>' +\n         (tieneP8() ? ', y el paso 8 se abre ma&ntilde;ana' : '') + '.' + elSQL;\n}",
    "var SESION = 7;\nvar LENTE_ABIERTA = false;\nvar SESIONES = {\n  7: {paso8:false, ddl:false},\n  8: {paso8:true,  ddl:false},\n  9: {paso8:true,  ddl:true}\n};\nfunction hoy(){\n  var base = SESIONES[SESION] || SESIONES[7];\n  return {\n    paso8: base.paso8 && (SESION !== 8 || LENTE_ABIERTA),\n    ddl: base.ddl\n  };\n}\n\n/* El Restaurante ABC tiene ocho pasos y dvdrental siete. En S8 la lente\n   aparece solamente cuando la presentación llega a ese momento. */\nfunction tieneP8(){\n  return hoy().paso8 && PASOS.some(function(p){\n    return p.n === 8 && (!p.solo || p.solo === CASO);\n  });\n}\nfunction textoHoy(){\n  var elDDL = ' El DDL local se abre <b>en la sesi&oacute;n 9</b>, despu&eacute;s de explicar la sintaxis.';\n  if (SESION >= 9)\n    return '<b>Sesi&oacute;n 9.</b> En el paso 5 puedes ver el <b>DDL local &middot; SQLite</b> de tu modelo. ' +\n           'Se usa para comparar dialectos; el laboratorio real de Supabase usa <b>Scripts/S9.sql</b>.';\n  if (SESION === 8) {\n    if (CASO !== 'abc')\n      return '<b>Sesi&oacute;n 8.</b> La lente trabaja sobre el <b>Restaurante ABC</b>. ' +\n             'C&aacute;mbiate de caso cuando el docente abra ese momento.' + elDDL;\n    if (hoy().paso8)\n      return '<b>Sesi&oacute;n 8.</b> <b>Ahora s&iacute;</b> se abre el paso 8: la lente de normalizaci&oacute;n sobre tu modelo.' + elDDL;\n    return '<b>Sesi&oacute;n 8.</b> Recupera tu modelo de S7. La <b>lente</b> se abrir&aacute; cuando la presentaci&oacute;n llegue a ese momento.' + elDDL;\n  }\n  return '<b>Sesi&oacute;n 7.</b> Hoy se recorren los <b>siete pasos</b>. La normalizaci&oacute;n y el DDL todav&iacute;a no se muestran.';\n}"
)

# Nombres canónicos compartidos S7-S9.
rep(c, "function pk(k){ return k + '_id'; }", "function pk(k){ return k === 'linea_pedido' ? 'linea_id' : k + '_id'; }")
rep(c, "{k:'abierto_en', t:'TEXTO',  sug:{obl:1}, regla:null,", "{k:'creado_en',  t:'TEXTO',  sug:{obl:1}, regla:null,")
rep(c, "{k:'precio',    t:'DECIMAL',sug:{obl:1}, regla:9,", "{k:'precio_actual', t:'DECIMAL',sug:{obl:1}, regla:9,")
rep_at_least(c, "pl.precio", "pl.precio_actual")
rep_at_least(c, "plato.precio", "plato.precio_actual")

# El paso 8 no aparece antes de su momento en S8.
rep(
    c,
    "PASOS.filter(function(p){ return !p.solo || p.solo === CASO; }).forEach(function(p){",
    "PASOS.filter(function(p){\n    return (!p.solo || p.solo === CASO) && (p.n !== 8 || hoy().paso8);\n  }).forEach(function(p){"
)
rep(
    c,
    "function pintar(){\n  var bd = $('#btDDL'); if (bd) bd.style.display = hoy().ddl ? '' : 'none';",
    "function pintar(){\n  if (S.paso === 8 && !hoy().paso8) S.paso = 7;\n  var bd = $('#btDDL'); if (bd) bd.style.display = hoy().ddl ? '' : 'none';"
)

# Paso 5: diferenciar explícitamente SQLite local de PostgreSQL/Supabase.
rep(
    c,
    "(hoy().ddl ? 'Debajo está el SQL que le corresponde, y detrás una base '\n               : 'Y detrás hay una base ')+",
    "(hoy().ddl ? 'Debajo está el <strong>DDL local &middot; SQLite</strong> que corresponde a tus decisiones, y detrás una base '\n               : 'Y detrás hay una base ')+"
)
rep(
    c,
    "['ddl', hoy().ddl ? 'El SQL' : 'El SQL · viernes'],",
    "['ddl', hoy().ddl ? 'DDL local · SQLite' : 'DDL · sesión 9'],"
)
rep(
    c,
    "'<p><strong>Tu SQL ya est&aacute; escrito, y es tuyo.</strong> Lo acaba de generar la '+\n      'herramienta con las decisiones que tomaste en los pasos 1 a 4.</p>'+\n      '<p>Se abre <strong>el viernes, en la sesi&oacute;n 9</strong>, que es donde se aprende a '+\n      'escribirlo y donde vas a llevarlo a un servicio de verdad. No lo necesitas hoy para nada: '+\n      'tu base ya est&aacute; construida y el banco de pruebas corre igual.</p>'+",
    "'<p><strong>El DDL local de tu modelo ya est&aacute; generado.</strong> La herramienta lo construye '+\n      'a partir de las decisiones que tomaste en los pasos 1 a 4.</p>'+\n      '<p>Se abre <strong>en la sesi&oacute;n 9</strong>, despu&eacute;s de aprender la sintaxis y comparar '+\n      'SQLite con PostgreSQL. <strong>No es el script que se pega en Supabase.</strong> El laboratorio '+\n      'real usa <code>Scripts/S9.sql</code>.</p>'+"
)
rep(
    c,
    "var ddl = generarDDL();\n    var bt = el('<button class=\"copiar\">Copiar el SQL entero</button>');",
    "var ddl = generarDDL();\n    c.appendChild(el('<div class=\"nota\"><p><strong>DDL local &middot; SQLite.</strong> Úsalo para '+\n      'comparar cómo tu modelo se traduce a otro dialecto. <strong>No lo pegues en Supabase</strong>: '+\n      'allí usamos el script PostgreSQL de la sesión 9.</p></div>'));\n    var bt = el('<button class=\"copiar\">Copiar DDL SQLite</button>');"
)
rep(
    c,
    "var b = el('<button class=\"copiar\">Copiar el SQL entero</button>');",
    "var b = el('<button class=\"copiar\">Copiar DDL SQLite</button>');"
)
rep(c, "dialogo('El SQL que llevas', c);", "dialogo('DDL local · SQLite', c);")

# Aclaración dvdrental convertido vs SQLite construida por el alumno.
rep(
    c,
    "'<div id=\"cuerpoPaso5\"></div></div>'));",
    "'<div id=\"cuerpoPaso5\"></div>'+\n    (CASO === 'dvd' ? '<div class=\"nota o\" style=\"margin-top:.7em\"><p><strong>No es la misma base SQLite de S6.</strong> '+\n      'El archivo <code>dvdrental.db</code> de S6 era una conversión en la que se perdieron claves foráneas; '+\n      'aquí la herramienta construye una SQLite nueva desde las decisiones del modelo. Por eso aquí sí pueden existir FK.</p></div>' : '')+\n    '</div>'));"
)

# Paso 7: una sola llamada en el flujo; no adelantar correcciones adicionales.
rep(
    c,
    "  LLAMADAS.forEach(function(ll){",
    "  [LLAMADAS[0]].forEach(function(ll){"
)
rep(
    c,
    "      '</div></div>');\n    var cu = $('.cuerpo', card);",
    "      '</div></div>');\n    var cu = $('.cuerpo', card);",
    count=1
)

# Paso 8: lenguaje menos absoluto y coherente con la presentación.
rep(
    c,
    "'<b>se puede calcular siempre</b>. Guardarlo además es guardar el mismo dato dos '+",
    "'<b>en este modelo se puede reconstruir exactamente</b> con cantidad y precio_unitario. Guardarlo además es guardar el mismo dato dos '+"
)
rep(
    c,
    "q:'<code>linea_pedido.precio_unitario</code> duplica <code>plato.precio_actual</code>… ' +\n        'y <b>debe duplicarlo</b>',",
    "q:'<code>linea_pedido.precio_unitario</code> se parece a <code>plato.precio_actual</code>, ' +\n        'pero <b>representa otro hecho</b>',"
)
rep(
    c,
    "d:'Tiene exactamente la misma forma que el anterior: un dato guardado dos veces. Pero ' +\n        '<b>no se puede recalcular</b>: si mañana sube el ajiaco, el precio de ayer ya no ' +\n        'existe en ninguna parte. La cuenta de la semana pasada no puede cambiar sola.'",
    "d:'Puede tener hoy el mismo valor que el precio vigente, pero <b>no significa lo mismo</b>. ' +\n        'Si mañana sube el ajiaco, <code>plato.precio_actual</code> cambia; ' +\n        '<code>linea_pedido.precio_unitario</code> conserva lo cobrado en aquel pedido. ' +\n        'Si el negocio necesita historia, quitarlo perdería significado.'"
)
rep(
    c,
    "'<p>Un dato que se puede reconstruir <b>no se pierde al quitarlo</b>. Ese es el criterio ' +\n      'entero de la normalización, dicho sin jerga.</p></div>'));",
    "'<p>Si un dato puede reconstruirse exactamente, quitar esa copia puede evitar inconsistencias. '+\n      '<strong>Es una prueba útil de normalización, no la única:</strong> todavía hay que preguntar '+\n      'de qué depende el dato y qué significado perderíamos al quitarlo.</p></div>'));"
)

# Compatibilidad con códigos S7 creados antes del cambio de nombres.
rep(
    c,
    "    var NIV = {c:'confirmada', a:'candidata', h:'hipotesis'};",
    "    /* Compatibilidad con códigos creados antes de unificar nombres S7-S9. */\n    if (min.e && min.e.pedido && min.e.pedido.abierto_en && !min.e.pedido.creado_en) {\n      min.e.pedido.creado_en = min.e.pedido.abierto_en;\n      delete min.e.pedido.abierto_en;\n    }\n    if (min.e && min.e.plato && min.e.plato.precio && !min.e.plato.precio_actual) {\n      min.e.plato.precio_actual = min.e.plato.precio;\n      delete min.e.plato.precio;\n    }\n    var NIV = {c:'confirmada', a:'candidata', h:'hipotesis'};"
)

# Enlaces con ?sesion=N quedan congelados en esa sesión. Sin ?sesion se usa
# la versión más avanzada disponible. La lente de S8 requiere ?lente=1.
rep(
    c,
    "/* La sesion la trae el enlace del mazo. Se recuerda la mas alta que se haya\n   abierto para que un marcador viejo no vuelva a cerrar lo que ya se dio. */\nvar ses = +((location.search.match(/[?&]sesion=(\\d)/) || [])[1] || 0);\nvar vista = 0;\ntry { vista = +(localStorage.getItem('constructor7-sesion') || 0); } catch(e){}\nSESION = Math.max(SESIONES[ses] ? ses : 7, SESIONES[vista] ? vista : 7);\n\n/* Y si ya lleg&oacute; el d&iacute;a de la sesi&oacute;n, se abre sola: un marcador viejo no\n   puede dejar el SQL con candado justo el d&iacute;a que toca abrirlo. Fecha local\n   del estudiante, no UTC. */\nvar FECHAS = {8:'2026-09-02', 9:'2026-09-04'};\nvar _d = new Date();\nvar _y = _d.getFullYear() + '-' + ('0'+(_d.getMonth()+1)).slice(-2) + '-' + ('0'+_d.getDate()).slice(-2);\nObject.keys(FECHAS).forEach(function(k){ if (_y >= FECHAS[k]) SESION = Math.max(SESION, +k); });\ntry { localStorage.setItem('constructor7-sesion', SESION); } catch(e){}\n$('#hoy').innerHTML = textoHoy();",
    "/* Si el enlace trae ?sesion=N, esa vista queda congelada: repasar S7 semanas después\n   no revela automáticamente S8/S9. Sin ?sesion se abre la versión más avanzada disponible. */\nvar sesMatch = location.search.match(/[?&]sesion=(\\d)/);\nvar ses = +(sesMatch ? sesMatch[1] : 0);\nvar sesionExplicita = !!(sesMatch && SESIONES[ses]);\nvar vista = 0;\ntry { vista = +(localStorage.getItem('constructor7-sesion') || 0); } catch(e){}\n\nif (sesionExplicita) {\n  SESION = ses;\n} else {\n  SESION = SESIONES[vista] ? vista : 7;\n  var FECHAS = {8:'2026-09-02', 9:'2026-09-04'};\n  var _d = new Date();\n  var _y = _d.getFullYear() + '-' + ('0'+(_d.getMonth()+1)).slice(-2) + '-' + ('0'+_d.getDate()).slice(-2);\n  Object.keys(FECHAS).forEach(function(k){ if (_y >= FECHAS[k]) SESION = Math.max(SESION, +k); });\n  try { localStorage.setItem('constructor7-sesion', SESION); } catch(e){}\n}\n\nLENTE_ABIERTA = SESION >= 9 || /[?&]lente=1(?:&|$)/.test(location.search);\nvar pasoPedido = +((location.search.match(/[?&]paso=(\\d)/) || [])[1] || 0);\nif (pasoPedido >= 1 && pasoPedido <= 8 && (pasoPedido !== 8 || hoy().paso8)) S.paso = pasoPedido;\n$('#hoy').innerHTML = textoHoy();"
)


# ------------------------------------------------------------------
# S8 · el enlace inicial recupera el modelo; la lente se abre SOLO
# en la diapositiva que la necesita.
# ------------------------------------------------------------------
s8 = "Presentaciones/M3/sesion-8-modelado-y-normalizacion.html"
rep(
    s8,
    '<a href="constructor-abc.html?sesion=8">&#129521; El constructor<small>trae tu c&oacute;digo de ayer &middot; paso 8</small></a>',
    '<a href="constructor-abc.html?sesion=8">&#129521; El constructor<small>recupera tu modelo de S7 &middot; la lente se abre en clase</small></a>'
)
rep(
    s8,
    '<a href="../../Scripts/S7-solucion.sql" download>&#128196; El modelo de referencia<small>publicado ayer a las 20:15</small></a>',
    '<a href="../../Scripts/S7-solucion.sql" download>&#128196; &iquest;Perdiste tu c&oacute;digo?<small>modelo de referencia &middot; solo para poder continuar</small></a>'
)
rep(
    s8,
    '<p class="lead">Abran el constructor y carguen el código del modelo. El paso 8 sirve para <strong>examinar redundancias concretas del caso</strong>; no certifica que todo el modelo esté “en 3FN”.</p>',
    '<p class="lead"><strong>Ahora sí</strong> abran el constructor y carguen el código del modelo. El paso 8 sirve para <strong>examinar redundancias concretas del caso</strong>; no certifica que todo el modelo esté “en 3FN”.</p>\n<div class="dlrow"><a href="constructor-abc.html?sesion=8&amp;lente=1&amp;paso=8">&#128269; Abrir ahora la lente<small>paso 8 &middot; este es el momento de usarla</small></a></div>'
)


# ------------------------------------------------------------------
# S9 · el DDL del constructor se abre después de explicar dialecto y
# se rotula como SQLite. Supabase usa S9.sql.
# ------------------------------------------------------------------
s9 = "Presentaciones/M3/sesion-9-ddl-supabase.html"
rep(
    s9,
    '<p class="warn"><strong>No memoricen la tabla.</strong> Hoy solo deben reconocer tres traducciones: quitar <code>PRAGMA</code>, usar tipos PostgreSQL y generar IDs con <code>IDENTITY</code>. Las reglas PK/FK/NOT NULL siguen significando lo mismo.</p>',
    '<div class="g2" style="margin-top:.7em"><div class="warn"><p style="margin:0"><strong>No memoricen la tabla.</strong> Hoy solo deben reconocer tres traducciones: quitar <code>PRAGMA</code>, usar tipos PostgreSQL y generar IDs con <code>IDENTITY</code>. Las reglas PK/FK/NOT NULL siguen significando lo mismo.</p></div><div class="hintbox"><p style="margin:0"><strong>Ahora sí abran su modelo:</strong> <a href="constructor-abc.html?sesion=9&amp;paso=5">DDL local &middot; SQLite</a>. Úsenlo únicamente para comparar el dialecto. <strong>No se pega en Supabase:</strong> allí la fuente del laboratorio es <code>Scripts/S9.sql</code>.</p></div></div>'
)


# ------------------------------------------------------------------
# Manifiesto público: todos los recursos se usan dentro de la sesión.
# ------------------------------------------------------------------
curso_path = ROOT / "tools/curso.json"
curso = json.loads(curso_path.read_text(encoding="utf-8"))
for modulo in curso["modulos"]:
    for sesion in modulo.get("sesiones", []):
        if sesion.get("n") == 7:
            for r in sesion.get("recursos", []):
                if "dvdrental" in r.get("txt", ""):
                    r["txt"] = "🎬 Apoyo con dvdrental durante la sesión"
        elif sesion.get("n") == 8:
            for r in sesion.get("recursos", []):
                if "constructor" in r.get("txt", "").lower():
                    r["txt"] = "🧱 El constructor · recupera tu modelo de S7"
                    r["href"] = "Presentaciones/M3/constructor-abc.html?sesion=8"
        elif sesion.get("n") == 9:
            for r in sesion.get("recursos", []):
                if "constructor" in r.get("txt", "").lower():
                    r["txt"] = "🧱 DDL local de tu modelo · SQLite"
                    r["href"] = "Presentaciones/M3/constructor-abc.html?sesion=9&paso=5"
curso_path.write_text(json.dumps(curso, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# ------------------------------------------------------------------
# Plan pedagógico: alinear las preguntas DP-900 que realmente muestra S9.
# ------------------------------------------------------------------
plan_path = ROOT / "assets/learning/learning-plan.json"
plan = json.loads(plan_path.read_text(encoding="utf-8"))
plan["sesiones"]["9"]["dp900"] = [
    {
        "dominio": "Relational data on Azure",
        "pregunta": "¿Qué comando define una tabla nueva?",
        "opciones": ["SELECT", "CREATE TABLE", "UPDATE", "DELETE"],
        "correcta": 1,
        "explicacion": "DDL define estructura: CREATE TABLE crea una tabla nueva."
    },
    {
        "dominio": "Relational data on Azure",
        "pregunta": "¿Qué restricción evita una clave foránea huérfana?",
        "opciones": ["CHECK", "DEFAULT", "FOREIGN KEY", "ORDER BY"],
        "correcta": 2,
        "explicacion": "FOREIGN KEY exige que el valor referenciado exista en la tabla objetivo."
    }
]
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# ------------------------------------------------------------------
# Documento metodológico: plataforma y diferenciación deben reflejar
# lo que realmente está publicado.
# ------------------------------------------------------------------
met = "docs/METODOLOGIA-S6-S16.md"
rep(met, "Sesiones previstas para diferenciación técnica: **S9, S11, S12, S13, S14 y S15**.",
         "Sesiones previstas para diferenciación técnica: **S11, S12, S13, S14 y S15**.")
rep(met, "- S9: Microsoft Azure SQL;", "- S9: Supabase + PostgreSQL;")

print("OK · orquestación S7-S9 ajustada sin tareas antes ni después de clase")
