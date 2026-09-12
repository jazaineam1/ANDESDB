"""Aplica el tema v2 a las presentaciones docentes y retira el horario de reloj.

    py tools\\aplicar-tema.py

Hace tres cosas sobre cada version DOCENTE:
  1. Sustituye el bloque <style> por tools/tema-v2.css.
  2. Cambia el reloj del pie ("6:08 - 6:12") por el nombre del bloque.
  3. Cambia "Minuto: 6:08 - 6:12 (4 min)" por "Duracion: ~4 min" en las notas.

Las versiones de estudiante se regeneran despues con
tools/derivar-version-estudiante.ps1
"""
import re, os, sys, io

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = os.path.join(ROOT, 'tools', 'tema-v2.css')

DECKS = {
    'Presentaciones/M2/sesion-2-bases-de-datos-y-primeras-consultas.html': {
        'Portada': 'Sesión 2 · Módulo 1 → Módulo 2',
        'Agenda': 'Apertura',
        'Recap S1': 'Apertura',
        'Del clic al dato': 'Bloque 1 · ¿Dónde vive el dato?',
        'Tres formas del dato': 'Bloque 1 · ¿Dónde vive el dato?',
        'Qué es una BD': 'Bloque 2 · Base de datos y SGBD',
        'BD y SGBD': 'Bloque 2 · Base de datos y SGBD',
        'Aclaración': 'Bloque 2 · Base de datos y SGBD',
        'Excel: lo bueno': 'Bloque 2 · Excel y bases de datos',
        'Donde brillan las BD': 'Bloque 2 · Excel y bases de datos',
        'Dos familias': 'Bloque 3 · Relacional y NoSQL',
        'Cuándo cada una': 'Bloque 3 · Relacional y NoSQL',
        'Qué es SQL': 'Bloque 3 · Relacional y NoSQL',
        'Los motores': 'Bloque 3 · Relacional y NoSQL',
        'Por qué SQLite': 'Bloque 3 · Relacional y NoSQL',
        'Arquitectura': 'Bloque 3 · Arquitectura',
        'Pausa': 'Pausa',
        'Abrir la base': 'Bloque 4 · Conectarnos',
        'Si algo falla': 'Bloque 4 · Conectarnos',
        'La interfaz': 'Bloque 4 · Conectarnos',
        'La base de hoy': 'Bloque 4 · Explorar la base',
        'Cómo se conectan': 'Bloque 4 · Explorar la base',
        'Diccionario': 'Bloque 4 · Explorar la base',
        'Las relaciones': 'Bloque 4 · Explorar la base',
        'SELECT FROM': 'Bloque 5 · Primeras consultas',
        'Desafío 1': 'Bloque 5 · Primeras consultas',
        'DISTINCT y COUNT': 'Bloque 5 · Primeras consultas',
        'Desafío 2': 'Bloque 5 · Primeras consultas',
        'WHERE': 'Bloque 5 · Primeras consultas',
        'WHERE compuesto': 'Bloque 5 · Primeras consultas',
        'Desafío 3': 'Bloque 5 · Primeras consultas',
        'ORDER BY y LIMIT': 'Bloque 5 · Primeras consultas',
        'Desafío 4': 'Bloque 5 · Primeras consultas',
        'Cierre': 'Cierre',
    },
    'Presentaciones/M2/sesion-3-filtros-y-agregaciones.html': {
        'Portada': 'Sesión 3 · Módulo 2',
        'Agenda': 'Apertura',
        'Calentamiento': 'Apertura',
        'Tipos de dato': 'Apertura',
        'Tu Excel en SQL': 'Apertura',
        'BETWEEN': 'Bloque 1 · Filtros finos',
        'IN': 'Bloque 1 · Filtros finos',
        'Desafío rápido': 'Bloque 1 · Filtros finos',
        'LIKE': 'Bloque 1 · Filtros finos',
        'LIKE combinado': 'Bloque 1 · Filtros finos',
        'Práctica combinada': 'Bloque 1 · Filtros finos',
        'Pausa': 'Pausa',
        'De filas a resúmenes': 'Bloque 2 · Agregar',
        'Funciones de agregación': 'Bloque 2 · Agregar',
        'Las canicas': 'Bloque 3 · Agrupar',
        'GROUP BY paso a paso': 'Bloque 3 · Agrupar',
        'Escríbelo tú': 'Bloque 3 · Agrupar',
        'La regla de oro': 'Bloque 3 · Agrupar',
        'Desafíos GROUP BY': 'Bloque 3 · Agrupar',
        'HAVING': 'Bloque 4 · Filtrar lo agrupado',
        'Orden de ejecución': 'Bloque 4 · Filtrar lo agrupado',
        'Desafío integrador': 'Bloque 4 · Filtrar lo agrupado',
        'Cierre': 'Cierre',
    },
    'Presentaciones/M2/sesion-4-uniones-de-tablas.html': {
        'Portada': 'Sesión 4 · Módulo 2',
        'Agenda': 'Apertura',
        'Calentamiento': 'Apertura',
        'Las llaves': 'Bloque 1 · Cómo se apuntan',
        'Cardinalidades': 'Bloque 1 · Cómo se apuntan',
        'La cardinalidad en el mapa': 'Bloque 1 · Cómo se apuntan',
        'UNION': 'Bloque 2 · Apilar',
        'Las reglas del UNION': 'Bloque 2 · Apilar',
        'UNION ALL': 'Bloque 2 · Apilar',
        'Desafío 1': 'Bloque 2 · Apilar',
        'Las cinco preguntas': 'Bloque 3 · Enganchar',
        'INNER JOIN': 'Bloque 3 · Enganchar',
        'Alias': 'Bloque 3 · Enganchar',
        'Desafío 2': 'Bloque 3 · Enganchar',
        'Desafío 3': 'Bloque 3 · Enganchar',
        'Pausa': 'Pausa',
        'Tu Excel en SQL': 'Bloque 4 · Conservar',
        'LEFT JOIN': 'Bloque 4 · Conservar',
        'RIGHT JOIN': 'Bloque 4 · Conservar',
        'FULL OUTER JOIN': 'Bloque 4 · Conservar',
        'Desafío 4': 'Bloque 4 · Conservar',
        'Encadenar': 'Bloque 5 · Encadenar',
        'Desafío 5': 'Bloque 5 · Encadenar',
        'Filas que se multiplican': 'Bloque 5 · Encadenar',
        'Quiz': 'Bloque 5 · Encadenar',
        'Desafío integrador': 'Bloque 5 · Encadenar',
        'Los cuatro de un vistazo': 'Resumen',
        'Cierre': 'Cierre',
    },
    'Presentaciones/M2/sesion-5-algoritmica-de-tablas.html': {
        'Portada': 'Sesión 5 · Módulo 2',
        'Agenda': 'Apertura',
        'Tus cuatro armas': 'Apertura',
        'La tabla de hoy': 'Apertura',
        'Peras con manzanas': 'Bloque 1 · El nivel de agregación',
        'La trampa, en vivo': 'Bloque 1 · El nivel de agregación',
        'La servilleta': 'Bloque 2 · La servilleta',
        'El marco de cinco pasos': 'Bloque 2 · La servilleta',
        'Taller 1': 'Bloque 2 · La servilleta',
        'De dónde viene cada campo': 'Bloque 3 · Tejer',
        'El primer pedazo': 'Bloque 3 · Tejer',
        'WITH': 'Bloque 3 · Tejer',
        'Taller 2': 'Bloque 3 · Tejer',
        'Pausa': 'Pausa',
        'El segundo pedazo': 'Bloque 4 · Juntar',
        'Las dos trampas': 'Bloque 4 · Juntar',
        'Taller 3': 'Bloque 4 · Juntar',
        'Juntar los pedazos': 'Bloque 4 · Juntar',
        'Taller 4': 'Bloque 4 · Juntar',
        'La comprobación cruzada': 'Bloque 4 · Juntar',
        'CASE': 'Bloque 5 · CASE',
        'Taller 5': 'Bloque 5 · CASE',
        'El promedio, ahora bien': 'Bloque 5 · CASE',
        'Tres certificados gratis': 'Cierre',
        'Cierre': 'Cierre',
    },
}

TIME = re.compile(r'\d{1,2}\s*:\s*\d{2}')


def transform_notes(m):
    """<strong>Minuto</strong>6:08 - 6:12 (4 min)  ->  <strong>Duracion</strong>~4 min"""
    body = m.group(1)
    dur = re.search(r'\((\d+)\s*min([^)]*)\)', body)
    if dur:
        extra = dur.group(2).strip(' ,')
        txt = '~%s min' % dur.group(1)
        if extra:
            txt += ' · ' + extra
        return '<strong>Duración</strong>' + txt
    if 'Dentro del bloque' in body:
        return '<strong>Duración</strong>Dentro del bloque de conexión'
    if TIME.search(body):
        return '<strong>Duración</strong>según el ritmo del grupo'
    return '<strong>Duración</strong>' + body


def process(path, blocks):
    full = os.path.join(ROOT, path)
    d = open(full, encoding='utf-8').read()
    css = open(CSS, encoding='utf-8').read()
    report = {}

    # 1. tema
    before = len(d)
    d, n = re.subn(r'(?s)<style>.*?</style>', lambda _: '<style>\n' + css + '\n</style>', d, count=1)
    if n != 1:
        raise SystemExit('%s: se esperaba exactamente 1 bloque <style>, hubo %d' % (path, n))
    report['tema'] = 'sustituido (%d -> %d KB)' % (before / 1024, len(d) / 1024)

    # 2. pie: reloj -> nombre del bloque
    #    OJO: no se puede usar ".*?</section>" porque .vs-grid y .proscons
    #    llevan <section> anidados. Se segmenta por inicio de diapositiva.
    starts = [(m.start(), m.group(1)) for m in
              re.finditer(r'<section class="slide[^"]*" data-title="([^"]+)"', d)]
    missing = [t for _, t in starts if t not in blocks]
    if missing:
        raise SystemExit('%s: diapositivas sin bloque asignado: %s' % (path, missing))

    changed = 0
    out, prev = [], 0
    for idx, (pos, title) in enumerate(starts):
        end = starts[idx + 1][0] if idx + 1 < len(starts) else len(d)
        out.append(d[prev:pos])
        seg, k = re.subn(r'(<div class="brand"><span>)[^<]*(</span>)',
                         lambda mm: mm.group(1) + blocks[title] + mm.group(2),
                         d[pos:end], count=1)
        changed += k
        out.append(seg)
        prev = end
    out.append(d[prev:])
    d = ''.join(out)
    if changed != len(starts):
        raise SystemExit('%s: %d pies actualizados de %d diapositivas' % (path, changed, len(starts)))
    report['pies'] = '%d de %d' % (changed, len(starts))

    # 3. notas: Minuto -> Duracion
    d, n = re.subn(r'<strong>Minuto</strong>([^<]*)', transform_notes, d)
    report['notas'] = '%d duraciones' % n

    # 4. relojes sueltos en el cuerpo de las diapositivas
    fixes = [
        ('Nos vemos a las 7:30', 'Volvemos en 15 minutos'),
        ('<span>6:00 – 9:00 p.m.</span>', '<span>3 horas · con pausa intermedia</span>'),
    ]
    for a, b in fixes:
        if a in d:
            d = d.replace(a, b)

    open(full, 'w', encoding='utf-8').write(d)

    left = TIME.findall(d)
    # el cronómetro (15:00, 00:00) y los presets no son horario de clase
    left = [t for t in left if not re.match(r'^\s*(0?0|1?[0-9]|2[0-9])\s*:\s*00\s*$', t)]
    report['relojes restantes'] = left if left else 'ninguno'
    report['peso'] = '%.0f KB' % (os.path.getsize(full) / 1024)
    return report


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    for path, blocks in DECKS.items():
        print('=' * 70)
        print(os.path.basename(path))
        print('=' * 70)
        for k, v in process(path, blocks).items():
            print('  %-20s %s' % (k, v))
        print()
