from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def read(rel: str) -> str:
    p = ROOT / rel
    if not p.exists():
        err(f'Falta {rel}')
        return ''
    return p.read_text(encoding='utf-8', errors='replace')


def visible(text: str) -> str:
    text = re.sub(r'<style\b.*?</style>|<script\b.*?</script>', ' ', text, flags=re.I | re.S)
    text = re.sub(r'<[^>]+>', ' ', text)
    return re.sub(r'\s+', ' ', html.unescape(text)).strip()


def require(text: str, tokens: list[str], label: str) -> None:
    low = text.casefold()
    for token in tokens:
        if token.casefold() not in low:
            err(f'{label}: falta {token!r}')


def forbid(text: str, tokens: list[str], label: str) -> None:
    low = text.casefold()
    for token in tokens:
        if token.casefold() in low:
            err(f'{label}: todavía contiene {token!r}')


def max_timing(text: str) -> int:
    vals = []
    for a, b in re.findall(r'(\d+)\s*(?:–|&ndash;|-)\s*(\d+)\s*(?:min|minutos)', text, flags=re.I):
        vals.append(int(html.unescape(b)))
    return max(vals, default=0)


def main() -> int:
    # S1: un único material público canónico.
    course = json.loads(read('tools/curso.json') or '{}')
    m1 = next((m for m in course.get('modulos', []) if m.get('n') == 1), {})
    hrefs = [str(r.get('href', '')) for r in m1.get('recursos', [])]
    if 'Presentaciones/M1/sesion-1-diagnostico.html' not in hrefs:
        err('S1: el HTML canónico no está publicado')
    if any(h.lower().endswith('.pptx') for h in hrefs):
        err('S1: el PPTX histórico sigue publicado como source of truth')

    s4 = read('Presentaciones/M2/sesion-4-uniones-de-tablas.html')
    require(s4, ['Checkpoint · elige el JOIN', 'Mapa relacional en texto'], 'S4')

    s6 = read('Presentaciones/M3/sesion-6-reglas-de-negocio.html')
    forbid(visible(s6), ['OLTP', 'OLAP', 'laguna de datos', 'bodega de datos', 'ETL', 'ELT'], 'S6 visible')
    require(s6, ['Reasoning Check · DEFAULT'], 'S6')

    s8 = read('Presentaciones/M3/sesion-8-modelado-y-normalizacion.html')
    if max_timing(s8) > 150:
        err(f'S8: el núcleo todavía muestra tiempos mayores a 150 min ({max_timing(s8)})')
    require(s8, ['Supuesto mesero–mesa', 'data-opcional="true"'], 'S8')

    s9 = read('Presentaciones/M3/sesion-9-ddl-supabase.html')
    require(s9, ['Ruta real · 165 minutos', 'Preflight Supabase', 'schema.sql', 'tests.sql', 'Cierre · DDL'], 'S9')
    forbid(s9, ['239–244 min', '216–226 min', '170–178 min', '151–155 min'], 'S9')
    if max_timing(s9) > 165:
        err(f'S9: quedan tiempos mayores a 165 min ({max_timing(s9)})')
    if '14 en vez de 6' in s9:
        err('S9: reapareció la cifra incorrecta 14 en vez de 6')
    for stale in ['Antes de las formas normales', 'La pregunta central', 'Resumen visual']:
        if f'data-title="{stale}"' in s9:
            err(f'S9: sigue el reteaching {stale!r}')

    s10 = read('Presentaciones/M4/sesion-10-sql-o-nosql.html')
    forbid(s10, ['Firestore y en\n                Cosmos DB', 'Firestore y Cosmos DB'], 'S10 continuidad')
    require(s10, ['MongoDB Atlas', 'Rúbrica de decisión'], 'S10')

    s11 = read('Presentaciones/M4/sesion-11-documentos-de-verdad.html')
    require(s11, ['persistimos temporalmente en Firestore', 'Contingencia explícita', 'no sustituye la evidencia'], 'S11')

    s12 = read('Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html')
    require(s12, ['Cuatro tablas del miniwarehouse + una tabla operacional defectuosa', 'Reasoning Check · 368.000'], 'S12')

    s13 = read('Presentaciones/M5/sesion-13-laboratorio-bigquery.html')
    require(s13, ['BigQuery Sandbox', 'fact_venta.csv', '44 filas', '1.455.000', 'bytes procesados', 'TU_PROYECTO'], 'S13')

    s14 = read('Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html')
    require(s14, ['Relacional vs anidado', 'STRUCT', 'ARRAY', 'UNNEST', 'Parquet', 'Azure Blob Storage', 'Power BI'], 'S14')

    for f in ['README.md', 'decisiones.md', 'schema.sql', 'queries.sql', 'validaciones.sql', 'arquitectura.md']:
        if not (ROOT / 'Plantillas/proyecto-final' / f).exists():
            err(f'S15: falta Plantillas/proyecto-final/{f}')
    s15 = read('Presentaciones/M6/sesion-15-desafio-final.html')
    require(s15, ['Plantilla lista', 'Code ownership', '90 segundos por equipo'], 'S15')

    s16 = read('Presentaciones/M6/sesion-16-cierre-dp900.html')
    require(s16, ['Pre/Post', 'Mapa curso → DP-900', 'Diagnóstico personal', 'Salida individual'], 'S16')

    dp = json.loads(read('assets/learning/dp900-map.json') or '{}')
    if len(dp.get('dominios', [])) != 4:
        err('DP-900: el mapa debe tener cuatro dominios')

    for n in range(1, 17):
        g = read(f'docs/instructor/S{n:02d}.md')
        require(g, ['Pregunta central', 'Error esperable principal', 'Dónde probablemente se atascan', 'No avanzar hasta que', 'Si vas 15 minutos atrasado', 'Si vas 15 minutos adelantado', 'Evidencia mínima'], f'Guía S{n:02d}')

    if ERRORS:
        print('\n=== Cierre benchmark: FALLÓ ===')
        for e in ERRORS:
            print('  ✗', e)
        return 1
    print('\n=== Cierre benchmark: OK ===')
    print('  ✓ coherencia semántica, tiempos, continuidad, evidencias e Instructor View')
    return 0


if __name__ == '__main__':
    sys.exit(main())
