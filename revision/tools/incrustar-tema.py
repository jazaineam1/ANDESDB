# -*- coding: utf-8 -*-
"""Vuelve a incrustar tools/tema-v2.css dentro del <style> de cada presentación.

Las presentaciones son autocontenidas: llevan el tema copiado dentro para poder
abrirse desde un USB o desde el disco sin depender de rutas. Eso significa que
editar tema-v2.css no basta — hay que volver a copiarlo. Esto hace eso.

Si una presentación tiene CSS propio pegado al final del tema, se conserva:
se detecta el prefijo común con el tema y solo se sustituye esa parte.

    py tools/incrustar-tema.py            # todas las de Presentaciones/
    py tools/incrustar-tema.py ruta.html  # solo una
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMA = os.path.join(RAIZ, 'tools', 'tema-v2.css')


def prefijo_comun(a, b):
    n = min(len(a), len(b))
    i = 0
    while i < n and a[i] == b[i]:
        i += 1
    return i


def incrustar(ruta, tema):
    d = io.open(ruta, encoding='utf-8').read()
    m = re.search(r'<style>(.*?)</style>', d, re.S)
    if not m:
        return '  %-52s sin <style>' % os.path.basename(ruta)
    viejo = m.group(1)
    # el <style> suele empezar con un salto de línea; no cuenta como diferencia
    cuerpo = viejo.lstrip('\n')
    # lo que la presentación tenga después del tema es suyo y se respeta
    k = prefijo_comun(cuerpo, tema)
    propio = cuerpo[k:] if k >= len(tema) * .5 else ''
    if not propio and k < len(tema) * .5:
        return '  %-52s NO comparte prefijo con el tema, la dejo' % os.path.basename(ruta)
    nuevo = '\n' + tema + propio
    if nuevo == viejo:
        return '  %-52s ya estaba al día' % os.path.basename(ruta)
    d = d[:m.start(1)] + nuevo + d[m.end(1):]
    io.open(ruta, 'w', encoding='utf-8').write(d)
    return '  %-52s %+d chars%s' % (os.path.basename(ruta), len(nuevo) - len(viejo),
                                    '  (+%d propios)' % len(propio) if propio else '')


def main():
    tema = io.open(TEMA, encoding='utf-8').read()
    if len(sys.argv) > 1:
        rutas = [os.path.abspath(x) for x in sys.argv[1:]]
    else:
        rutas = []
        for base, _, files in os.walk(os.path.join(RAIZ, 'Presentaciones')):
            rutas += [os.path.join(base, f) for f in sorted(files)
                      if f.endswith('.html') and f.startswith('sesion-')]
    print('  tema-v2.css: %d chars\n' % len(tema))
    for r in rutas:
        print(incrustar(r, tema))


if __name__ == '__main__':
    main()
