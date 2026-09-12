from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []

DECKS = {
    1: 'Presentaciones/M1/sesion-1-diagnostico.html',
    2: 'Presentaciones/M2/sesion-2-bases-de-datos-y-primeras-consultas.html',
    3: 'Presentaciones/M2/sesion-3-filtros-y-agregaciones.html',
    4: 'Presentaciones/M2/sesion-4-uniones-de-tablas.html',
    5: 'Presentaciones/M2/sesion-5-algoritmica-de-tablas.html',
    6: 'Presentaciones/M3/sesion-6-reglas-de-negocio.html',
    7: 'Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html',
    8: 'Presentaciones/M3/sesion-8-modelado-y-normalizacion.html',
    9: 'Presentaciones/M3/sesion-9-ddl-supabase.html',
    10: 'Presentaciones/M4/sesion-10-sql-o-nosql.html',
    11: 'Presentaciones/M4/sesion-11-documentos-de-verdad.html',
    12: 'Presentaciones/M5/sesion-12-fundamentos-data-warehouse.html',
    13: 'Presentaciones/M5/sesion-13-laboratorio-bigquery.html',
    14: 'Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html',
    15: 'Presentaciones/M6/sesion-15-desafio-final.html',
    16: 'Presentaciones/M6/sesion-16-cierre-dp900.html',
}
OFFICIAL_DP900 = {
    'Core data concepts',
    'Relational data on Azure',
    'Non-relational data on Azure',
    'Analytics workload on Azure',
}


def err(msg: str) -> None:
    ERRORS.append(msg)


def read(rel: str) -> str:
    p = ROOT / rel
    if not p.exists():
        err(f'Falta {rel}')
        return ''
    return p.read_text(encoding='utf-8', errors='replace')


def main() -> int:
    course = json.loads(read('tools/curso.json') or '{}')
    hilo = course.get('hiloConductor', {})
    if not hilo.get('preguntaMadre'):
        err('curso.json: falta pregunta madre del hilo conductor')
    acts = hilo.get('actos', [])
    if len(acts) != 6:
        err(f'curso.json: se esperaban 6 actos narrativos y hay {len(acts)}')
    sessions = hilo.get('sesiones', {})
    if len(sessions) != 16:
        err(f'curso.json: el hilo debe cubrir 16 sesiones y cubre {len(sessions)}')
    for n in range(1, 17):
        node = sessions.get(str(n), {})
        for k in ('hereda', 'pregunta', 'evidencia', 'puente'):
            if not str(node.get(k, '')).strip():
                err(f'S{n:02d}: falta {k} en el hilo')

    # S12 explica analítica; S14 concentra el mapa explícito de productos Azure.
    s12_manifest = None
    for mod in course.get('modulos', []):
        for s in mod.get('sesiones', []):
            if s.get('n') == 12:
                s12_manifest = s
    if s12_manifest:
        tags = set(s12_manifest.get('tags', []))
        if {'Fabric', 'Databricks'} & tags:
            err('S12: Fabric/Databricks volvieron al núcleo; la transferencia explícita corresponde a S14')
        if 'transferencia de servicios Azure se concentra en S14' not in s12_manifest.get('desc', ''):
            err('S12: falta declarar que el mapa de servicios se concentra en S14')

    learning = json.loads(read('assets/learning/learning-plan.json') or '{}')
    if not learning.get('hilo_conductor', {}).get('pregunta_madre'):
        err('learning-plan: falta hilo_conductor')
    for n in range(6, 17):
        s = learning.get('sesiones', {}).get(str(n), {})
        h = s.get('hilo', {})
        for k in ('hereda', 'pregunta', 'evidencia', 'puente'):
            if not str(h.get(k, '')).strip():
                err(f'learning-plan S{n:02d}: falta hilo.{k}')
        for q in s.get('dp900', []):
            if q.get('dominio') not in OFFICIAL_DP900:
                err(f'S{n:02d}: dominio DP-900 no oficial: {q.get("dominio")!r}')
    s11_text = json.dumps(learning.get('sesiones', {}).get('11', {}).get('dp900', []), ensure_ascii=False)
    if 'Blob Storage' in s11_text:
        err('S11: Blob Storage interrumpe el hilo documental; debe concentrarse en S14/S16')
    s13_text = json.dumps(learning.get('sesiones', {}).get('13', {}).get('dp900', []), ensure_ascii=False)
    if 'Databricks' in s13_text:
        err('S13: Databricks reapareció antes de la transferencia Azure de S14')

    for n, rel in DECKS.items():
        text = read(rel)
        count = len(re.findall(r'data-title=["\']Hilo conductor["\']', text, flags=re.I))
        if count != 1:
            err(f'S{n:02d}: debe existir exactamente una lámina Hilo conductor; hay {count}')
        if f'data-hilo="s{n:02d}"' not in text:
            err(f'S{n:02d}: la lámina de hilo no tiene identificador correcto')
        for token in ('Venimos de', 'Pregunta de hoy', 'Debe quedar evidencia', 'Esto obliga a abrir la siguiente'):
            if token not in text:
                err(f'S{n:02d}: falta bloque narrativo {token!r}')

    for n in range(1, 17):
        guide = read(f'docs/instructor/S{n:02d}.md')
        for token in ('## Hilo conductor', '**Hereda:**', '**Pregunta de hoy:**', '**Evidencia de salida:**', '**Puente:**'):
            if token not in guide:
                err(f'Guía S{n:02d}: falta {token}')

    thread_doc = read('docs/HILO-CONDUCTOR.md')
    for token in ('Pregunta madre', 'Seis actos', 'Cadena sesión a sesión', 'S16'):
        if token not in thread_doc:
            err(f'HILO-CONDUCTOR.md: falta {token}')

    if ERRORS:
        print('\n=== Hilo conductor: FALLÓ ===')
        for e in ERRORS:
            print('  ✗', e)
        return 1
    print('\n=== Hilo conductor: OK ===')
    print('  ✓ 16 sesiones conectadas por herencia, pregunta, evidencia y puente')
    print('  ✓ S12 conceptual → S13 cloud real → S14 transferencia Azure')
    print('  ✓ DP-900 usa solo dominios oficiales en learning-plan')
    return 0


if __name__ == '__main__':
    sys.exit(main())
