# -*- coding: utf-8 -*-
"""Compatibilidad del antiguo generador de portada de ``revision/``.

Desde la arquitectura LMS, ``revision/index.html`` es un punto de entrada
mínimo que redirige a ``portal.html``. El recorrido del curso se pinta desde
``tools/curso.json`` mediante ``course-data.js``; regenerar una segunda portada
larga volvería a duplicar navegación, estados y enlaces.

Uso normal (QA, no escribe archivos):
    python tools/construir-index.py

Catálogo estático opcional para inspección humana:
    python tools/construir-index.py --catalog
"""
from __future__ import annotations

import html
import json
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parent.parent
MAN=ROOT/'tools'/'curso.json'
CATALOG=ROOT/'catalog.html'


def esc(x):return html.escape(str(x),quote=True)


def semantic_status(session:dict,course:dict)->str:
    today=datetime.now(ZoneInfo('America/Bogota')).date().isoformat()
    if session.get('fecha')==today:return'hoy'
    if session.get('n')==course.get('sesionActual'):return'actual'
    raw=session.get('estado','pendiente')
    if raw=='hoy':
        date=session.get('fecha')
        if date and date<today:return'completado'
        if date and date>today:return'pendiente'
        return'actual'
    return raw


def sessions(course):
    return [s for m in course.get('modulos',[]) for s in m.get('sesiones',[])]


def validate(course):
    ss=sessions(course);nums=[s.get('n') for s in ss]
    errors=[]
    if course.get('totalSesiones')!=16:errors.append('totalSesiones debe ser 16')
    if course.get('sesionActual') not in nums:errors.append('sesionActual no existe')
    if len(set(nums))!=len(nums):errors.append('hay números de sesión repetidos')
    if errors:
        for x in errors:print('ERROR:',x)
        return 1
    current=next(s for s in ss if s.get('n')==course.get('sesionActual'))
    print('revision/index.html: gestionado por Portal; no se regenera')
    print(f"sesiones: {len(ss)} · actual: S{current['n']} · estado UI: {semantic_status(current,course)}")
    return 0


def write_catalog(course):
    rows=[]
    for s in sessions(course):
        status=semantic_status(s,course)
        href=s.get('href') or '#'
        rows.append(f'<tr><td>S{s.get("n")}</td><td>{esc(s.get("titulo",""))}</td><td>{esc(status)}</td><td><a href="{esc(href)}">Abrir</a></td></tr>')
    CATALOG.write_text(f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ANDESDB · Catálogo</title><style>body{{font-family:system-ui;max-width:980px;margin:30px auto;padding:0 16px;color:#17202a}}table{{border-collapse:collapse;width:100%}}th,td{{padding:9px;border-bottom:1px solid #ddd;text-align:left}}a{{color:#175cd3}}.note{{background:#fff8cc;padding:12px;border-radius:10px}}</style></head><body><h1>ANDESDB · catálogo técnico</h1><p class="note">La experiencia del estudiante comienza en <a href="portal.html">Portal</a>. Este archivo es solo una vista estática opcional del manifiesto.</p><table><thead><tr><th>Sesión</th><th>Título</th><th>Estado semántico</th><th></th></tr></thead><tbody>{''.join(rows)}</tbody></table></body></html>''',encoding='utf-8')
    print('catalog.html generado')


def main():
    try:course=json.loads(MAN.read_text(encoding='utf-8'))
    except Exception as exc:print('ERROR:',exc);return 1
    rc=validate(course)
    if rc:return rc
    if '--catalog' in sys.argv:write_catalog(course)
    return 0


if __name__=='__main__':raise SystemExit(main())
