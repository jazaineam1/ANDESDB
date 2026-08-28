# -*- coding: utf-8 -*-
"""Saca las preguntas de la sesion 6 al formato de importacion de Wayground
(antes Quizizz) y de Kahoot. Sirve para las dos: elige la que uses.

    py tools/concurso-generar.py            las dos
    py tools/concurso-generar.py wayground  solo una

Las quince preguntas van repartidas en CUATRO partidas, no en seis: cada
partida es un codigo nuevo y con 38 personas cada entrada cuesta cerca de un
minuto. Van colocadas donde la clase las necesita, no donde salen bonitas.

SOBRE LOS DOS FORMATOS
----------------------
El de Kahoot esta verificado contra su documentacion: siete columnas, 95
caracteres de enunciado y 60 por opcion. Si el archivo se rechaza, su
plantilla se baja desde Create -> Add question -> Import spreadsheet.

El de Wayground NO esta verificado: su articulo de ayuda sobre importacion
por hoja de calculo ya no esta publico y no hay fuente fiable del orden de
sus columnas. Lo que se genera lleva cabeceras que se explican solas y una
copia en .csv. Si el importador lo rechaza, baja su plantilla desde el propio
Wayground y pega las filas: los datos son los mismos y estan en el orden
habitual. Por eso tampoco se recortan aqui los textos a 95/60: esos limites
son de Kahoot y no consta que Wayground los tenga.
"""
import csv
import html
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

MAX_PREGUNTA_KAHOOT = 95
MAX_OPCION_KAHOOT = 60

PARTIDAS = [
    dict(letra='A', nombre='Los cuatro niveles', rondas=[1],
         cuando='minuto ~27, ANTES del Taller 1'),
    dict(letra='B', nombre='El esquema y la regla', rondas=[2, 3],
         cuando='minuto ~88, justo antes de la pausa'),
    dict(letra='C', nombre='OLTP u OLAP', rondas=[4],
         cuando='minuto ~148, en lugar del Taller 4'),
    dict(letra='D', nombre='Donde vive el dato', rondas=[5, 6],
         cuando='minuto ~170, en el tramo final'),
]

CAB_KAHOOT = ['Question - max 95 characters',
              'Answer 1 - max 60 characters', 'Answer 2 - max 60 characters',
              'Answer 3 - max 60 characters', 'Answer 4 - max 60 characters',
              'Time limit (sec)', 'Correct answer(s)']

CAB_WAYGROUND = ['Question Text', 'Question Type',
                 'Option 1', 'Option 2', 'Option 3', 'Option 4',
                 'Correct Answer', 'Time in seconds']


def plano(s):
    """El HTML de las diapositivas no sirve en una hoja de calculo."""
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def segundos(texto, opciones):
    """Mas texto que leer, mas tiempo."""
    return 20 if len(texto) + max(len(o) for o in opciones) < 90 else 30


def preguntas_de(partida, por_ronda):
    for n in partida['rondas']:
        for q in por_ronda[n]['qs']:
            yield plano(q['q']), [plano(o) for o in q['opts']], q['ok']


def escribe_hoja(dest, cabecera, filas, anchos):
    from openpyxl import Workbook
    wb = Workbook()
    h = wb.active
    h.title = 'Sheet1'
    h.append(cabecera)
    for f in filas:
        h.append(f)
    for i, ancho in enumerate(anchos):
        h.column_dimensions[chr(65 + i)].width = ancho
    wb.save(dest)


def main():
    quiere = [a.lower() for a in sys.argv[1:]] or ['wayground', 'kahoot']
    try:
        import preguntas_s6 as P
    except ImportError:
        sys.exit('Falta tools/preguntas_s6.py con el banco de preguntas.')
    try:
        import openpyxl  # noqa: F401
    except ImportError:
        sys.exit('Falta openpyxl:  py -m pip install openpyxl')

    por_ronda = {r['n']: r for r in P.RONDAS}

    # Los limites solo aplican a Kahoot, pero se comprueban siempre: si alguna
    # pregunta se pasa, conviene saberlo antes de estar delante de la clase.
    largas = []
    for p in PARTIDAS:
        for enunciado, opciones, _ in preguntas_de(p, por_ronda):
            if len(enunciado) > MAX_PREGUNTA_KAHOOT:
                largas.append('%d car · %s' % (len(enunciado), enunciado))
            for o in opciones:
                if len(o) > MAX_OPCION_KAHOOT:
                    largas.append('opcion de %d car · %s' % (len(o), o))
    if largas and 'kahoot' in quiere:
        print('NADA ESCRITO PARA KAHOOT. Estas se pasan de sus limites:')
        for x in largas:
            print('  · ' + x)
        quiere = [q for q in quiere if q != 'kahoot']
        if not quiere:
            sys.exit(1)

    for plataforma in quiere:
        salida = os.path.join(AQUI, plataforma)
        os.makedirs(salida, exist_ok=True)
        print('\n%s' % plataforma.upper())
        total = 0
        for p in PARTIDAS:
            filas = []
            for enunciado, opciones, ok in preguntas_de(p, por_ronda):
                seg = segundos(enunciado, opciones)
                if plataforma == 'kahoot':
                    filas.append([enunciado] + opciones + [seg, ok + 1])
                else:
                    filas.append([enunciado, 'Multiple Choice'] + opciones
                                 + [ok + 1, seg])
            base = 'sesion6-%s-%s' % (p['letra'], p['nombre'].lower().replace(' ', '-'))
            if plataforma == 'kahoot':
                escribe_hoja(os.path.join(salida, base + '.xlsx'), CAB_KAHOOT, filas,
                             (62, 34, 34, 34, 34, 15, 17))
            else:
                escribe_hoja(os.path.join(salida, base + '.xlsx'), CAB_WAYGROUND, filas,
                             (62, 17, 34, 34, 34, 34, 15, 15))
                # el .csv es la red: se pega en la plantilla que de la web
                with open(os.path.join(salida, base + '.csv'), 'w',
                          encoding='utf-8-sig', newline='') as fh:
                    w = csv.writer(fh)
                    w.writerow(CAB_WAYGROUND)
                    w.writerows(filas)
            total += len(filas)
            print('  %s · %-26s %2d preguntas · %s'
                  % (p['letra'], p['nombre'], len(filas), p['cuando']))
        print('  %d preguntas en %d partidas · %s' % (total, len(PARTIDAS), salida))

    print('\nEl apodo tiene que ser EL MISMO en las cuatro partidas,')
    print('o no hay forma de sumar los marcadores despues.')


if __name__ == '__main__':
    main()
