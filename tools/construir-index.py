"""Genera index.html a partir de tools/curso.json.

    py tools/construir-index.py

Para añadir una sesión, un módulo o un recurso NO se edita index.html:
se edita el manifiesto y se vuelve a ejecutar esto. Así la portada escala
a las 16 sesiones sin volverse una lista escrita a mano.
"""
import json, os, sys, html, urllib.parse
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MAN = RAIZ / 'tools' / 'curso.json'
SAL = RAIZ / 'index.html'

ESTADO = {'completado': ('Completado', 'done'),
          'curso': ('En curso', 'now'),
          'pendiente': ('Por venir', ''),
          'hoy': ('Hoy', 'hoy')}


def e(t):
    return html.escape(str(t), quote=True)


def enlace(r):
    """Un recurso como pastilla compacta."""
    dl = ' download' if r.get('download') else ''
    ext = ' target="_blank" rel="noopener"' if r.get('externo') else ''
    return '<a href="%s"%s%s>%s</a>' % (e(r['href']), dl, ext, e(r['txt']))


def tarjeta_sesion(s):
    est, cls = ESTADO[s.get('estado', 'pendiente')]
    activa = bool(s.get('href'))
    chip = '<span class="chip %s">%s</span>' % (cls, e(est)) if cls else ''
    tags = ''.join('<code>%s</code>' % e(t) for t in s.get('tags', []))
    recs = ''.join(enlace(r) for r in s.get('recursos', []))
    bloque_recs = '<div class="row mini">%s</div>' % recs if recs else ''
    cuerpo = ('%s<span class="num">%s</span><h3>%s</h3><p>%s</p>'
              '<div class="tags">%s</div>' % (chip, s['n'], e(s['titulo']), e(s['desc']), tags))
    if activa:
        return ('<div class="sesion-wrap"><a class="session%s" href="%s">%s'
                '<div class="go">Abrir la sesión →</div></a>%s</div>'
                % (' ' + cls if cls == 'hoy' else '', e(s['href']), cuerpo, bloque_recs))
    return ('<div class="sesion-wrap"><div class="session soon">%s'
            '<div class="go">Próximamente</div></div>%s</div>' % (cuerpo, bloque_recs))


def tarjeta_modulo(m):
    est, cls = ESTADO[m.get('estado', 'pendiente')]
    recs = ''.join(enlace(r) for r in m.get('recursos', []))
    bloque = '<div class="row mini">%s</div>' % recs if recs else ''
    return ('<div class="mod"><div class="mh"><b>Módulo %s</b>'
            '<span class="st %s">%s</span></div><h4>%s</h4><p>%s</p>%s</div>'
            % (m['n'], cls, e(est), e(m['titulo']), e(m['desc']), bloque))


def construir():
    c = json.loads(MAN.read_text(encoding='utf-8'))
    pct = round(c['sesionActual'] / c['totalSesiones'] * 100, 1)

    pips = ''
    for i in range(1, c['totalSesiones'] + 1):
        k = 'done' if i < c['sesionActual'] else ('now' if i == c['sesionActual'] else '')
        pips += '<span class="pip %s" title="Sesión %d">%d</span>' % (k, i, i)

    datos = ''.join('<span>%s</span>' % e(x) for x in c['datos'])

    # el módulo en curso manda sus sesiones a la sección «Sesiones»
    activo = next((m for m in c['modulos'] if m.get('estado') == 'curso'), None)
    sesiones = ''.join(tarjeta_sesion(s) for s in (activo or {}).get('sesiones', []))
    tit_ses = 'Módulo %s · %s' % (activo['n'], e(activo['titulo'])) if activo else 'Sesiones'

    modulos = ''.join(tarjeta_modulo(m) for m in c['modulos'])

    # la sesión marcada como «hoy» manda: es la acción principal de la página
    hoy = next((s for m in c['modulos'] for s in m.get('sesiones', [])
                if s.get('estado') == 'hoy' and s.get('href')), None)
    if hoy:
        cta = ('<a class="btn-main" href="%s">▶ Abrir la sesión de hoy'
               '<small>%s · %s</small></a>'
               '<a class="btn-ghost" href="#sesiones">Ver todas las sesiones</a>'
               % (e(hoy['href']), 'Sesión %s' % hoy['n'], e(hoy['titulo'])))
        cta_nav = '<a class="cta" href="%s">▶ Sesión de hoy</a>' % e(hoy['href'])
    else:
        cta = '<a class="btn-main" href="#sesiones">Ver las sesiones</a>'
        cta_nav = '<a class="cta" href="#sesiones">Sesiones</a>' 

    herr = ''.join(
        '<a class="mat" href="%s"%s%s><span class="ico">%s</span>'
        '<strong>%s</strong><span>%s</span></a>'
        % (e(h['href']),
           ' target="_blank" rel="noopener"' if h.get('externo') else '',
           ' download' if h.get('download') else '',
           e(h['icono']), e(h['titulo']), e(h['desc']))
        for h in c['herramientas'])

    inst = ''.join(enlace(x) for x in c['instalacion'])

    css = (RAIZ / 'tools' / 'estilo-portada.css').read_text(encoding='utf-8')

    doc = f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(c['titulo'])}</title>
<meta name="description" content="Materiales del curso {e(c['titulo'])} · {e(c['institucion'])}">
<link rel="icon" href="assets/favicon.ico">
<!-- GENERADO por tools/construir-index.py desde tools/curso.json · no editar a mano -->
<style>
{css}
</style></head>
<body>

<div class="topbar"><div class="wrap">
  <a class="brandmark" href="#top">Bases de Datos con <span>SQL</span></a>
  <nav class="toc">
    <a href="#recorrido">Recorrido</a>
    <a href="#sesiones">Sesiones</a>
    <a href="#herramientas">Herramientas</a>
    {cta_nav}
  </nav>
</div></div>

<header class="hero" id="top"><div class="wrap hero-grid">
  <div>
    <div class="eyebrow">{e(c['institucion'])}</div>
    <h1>{e(c['titulo'])}</h1>
    <p class="sub">{e(c['subtitulo'])}</p>
    <div class="cta-row">{cta}</div>
    <div class="facts">{datos}</div>
  </div>
  <aside class="progress-card">
    <div class="progress-head">
      <b>Tu avance</b>
      <em>Sesión {c['sesionActual']} de {c['totalSesiones']}</em>
    </div>
    <div class="track"><div class="fill" style="width:{pct}%"></div></div>
    <div class="pips">{pips}</div>
  </aside>
</div></header>

<section class="road-sec" id="recorrido"><div class="wrap">
  <div class="sec-head">
    <div class="kicker">Los seis módulos</div>
    <h2>Recorrido del curso</h2>
    <p>Cada módulo trae sus propios materiales. Los que ya están publicados aparecen como enlaces.</p>
  </div>
  <div class="road">{modulos}</div>
</div></section>

<section id="sesiones"><div class="wrap">
  <div class="sec-head">
    <div class="kicker">{tit_ses}</div>
    <h2>Sesiones</h2>
    <p>Cada sesión es un archivo único que funciona sin conexión, y trae dentro lo que necesitas ese día.
       Navega con las flechas; <b>F</b> pantalla completa, <b>T</b> cronómetro, <b>↓</b> descargar.</p>
  </div>
  <div class="sessions">{sesiones}</div>
</div></section>

<section class="alt" id="herramientas"><div class="wrap">
  <div class="sec-head">
    <div class="kicker">Para todo el curso</div>
    <h2>Herramientas</h2>
    <p>Esto se instala una vez y sirve para las 16 sesiones. Los materiales de cada sesión están en su propia tarjeta, arriba.</p>
  </div>
  <div class="mats">{herr}</div>
  <h3 class="grp">Instalación paso a paso</h3>
  <div class="row">{inst}</div>
</div></section>

<footer><div class="wrap">
  {e(c['titulo'])} · {e(c['institucion'])}
</div></footer>
</body></html>
'''
    SAL.write_text(doc, encoding='utf-8')

    # comprobación de enlaces
    import re
    rotos = [l for l in re.findall(r'(?:href|src)="([^"]+)"', doc)
             if not l.startswith(('http', '#'))
             and not (RAIZ / urllib.parse.unquote(l)).exists()]
    n_ses = sum(len(m.get('sesiones', [])) for m in c['modulos'])
    n_rec = sum(len(m.get('recursos', [])) + sum(len(s.get('recursos', [])) for s in m.get('sesiones', []))
                for m in c['modulos'])
    print('index.html generado')
    print('  módulos           :', len(c['modulos']))
    print('  sesiones           :', n_ses)
    print('  recursos vinculados:', n_rec)
    print('  enlaces rotos      :', rotos if rotos else 'ninguno')
    print('  peso               : %.0f KB' % (SAL.stat().st_size / 1024))
    return 1 if rotos else 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(construir())
