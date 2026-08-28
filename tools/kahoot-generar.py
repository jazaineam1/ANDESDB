# -*- coding: utf-8 -*-
"""Saca las preguntas de la sesion 6 al formato de importacion de Kahoot.

Kahoot agrupa por PARTIDA, y cada partida es un PIN nuevo. Con 38 personas cada
entrada cuesta cerca de un minuto, asi que las quince preguntas van repartidas
en CUATRO partidas y no en seis, colocadas donde la clase las necesita.

Limites reales del importador por hoja de calculo (no los de la pagina de
creacion, que son mas anchos): 95 caracteres el enunciado y 60 cada opcion,
espacios incluidos. El guion los comprueba y se niega a escribir si algo se pasa.

    py tools/kahoot-generar.py

Deja cuatro .xlsx en tools/kahoot/. Si Kahoot rechaza el archivo, abre su
plantilla oficial (Create -> Add question -> Import spreadsheet -> Download our
template) y pega ahi las filas: el orden de las columnas es el mismo.
"""
import html
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

MAX_PREGUNTA = 95
MAX_OPCION = 60

# Las cuatro partidas: que rondas lleva cada una y cuando se lanza.
PARTIDAS = [
    dict(letra='A', nombre='Leer sin sobreinterpretar', rondas=[1, 2],
         cuando='minuto ~52, al cerrar el bloque 1'),
    dict(letra='B', nombre='Que es una regla', rondas=[3],
         cuando='minuto ~88, justo antes de la pausa'),
    dict(letra='C', nombre='OLTP u OLAP', rondas=[4],
         cuando='minuto ~148, en lugar del Taller 4'),
    dict(letra='D', nombre='Donde vive el dato', rondas=[5, 6],
         cuando='minuto ~170, en el tramo final'),
]


def plano(s):
    """El HTML de las diapositivas no sirve en una hoja de calculo."""
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def segundos(texto, opciones):
    """Mas texto que leer, mas tiempo. Kahoot solo acepta ciertos valores."""
    largo = len(texto) + max(len(o) for o in opciones)
    return 20 if largo < 90 else 30


def main():
    try:
        import preguntas_s6 as P
    except ImportError:
        sys.exit('Falta preguntas_s6.py con el banco de preguntas.')
    try:
        from openpyxl import Workbook
    except ImportError:
        sys.exit('Falta openpyxl:  py -m pip install openpyxl')

    por_ronda = {r['n']: r for r in P.RONDAS}
    salida = os.path.join(AQUI, 'kahoot')
    os.makedirs(salida, exist_ok=True)
    problemas = []
    total = 0

    for p in PARTIDAS:
        filas = []
        for n in p['rondas']:
            for q in por_ronda[n]['qs']:
                enunciado = plano(q['q'])
                opciones = [plano(o) for o in q['opts']]
                if len(enunciado) > MAX_PREGUNTA:
                    problemas.append('%d car · %s' % (len(enunciado), enunciado))
                for o in opciones:
                    if len(o) > MAX_OPCION:
                        problemas.append('opcion de %d car · %s' % (len(o), o))
                filas.append([enunciado] + opciones
                             + [segundos(enunciado, opciones), q['ok'] + 1])

        if problemas:
            continue

        wb = Workbook()
        h = wb.active
        h.title = 'Sheet1'
        h.append(['Question - max 95 characters',
                  'Answer 1 - max 60 characters', 'Answer 2 - max 60 characters',
                  'Answer 3 - max 60 characters', 'Answer 4 - max 60 characters',
                  'Time limit (sec)', 'Correct answer(s)'])
        for f in filas:
            h.append(f)
        for col, ancho in zip('ABCDEFG', (62, 34, 34, 34, 34, 15, 17)):
            h.column_dimensions[col].width = ancho

        dest = os.path.join(salida, 'sesion6-%s-%s.xlsx'
                            % (p['letra'], p['nombre'].lower().replace(' ', '-')))
        wb.save(dest)
        total += len(filas)
        print('  %s · %-26s %2d preguntas · %s'
              % (p['letra'], p['nombre'], len(filas), p['cuando']))

    if problemas:
        print('\nNADA ESCRITO. Estas se pasan de los limites de Kahoot:')
        for x in problemas:
            print('  · ' + x)
        sys.exit(1)

    print('\n%d preguntas en %d partidas · %s' % (total, len(PARTIDAS), salida))
    print('Recuerda: el apodo tiene que ser EL MISMO en las cuatro,')
    print('o no hay forma de sumar los marcadores despues.')


if __name__ == '__main__':
    main()
