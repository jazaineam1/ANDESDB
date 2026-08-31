from pathlib import Path
import json

p = Path('assets/learning/learning-plan.json')
data = json.loads(p.read_text(encoding='utf-8'))

# S9 ya no usa la capa externa Núcleo/Reto: es una sesión guiada con taller
# dentro de la propia presentación, como las sesiones anteriores.
principios = data.setdefault('principios', {})
principios['diferenciacion_tecnica_sesiones'] = [11, 12, 13, 14, 15]

s9 = data['sesiones']['9']
s9['titulo'] = 'DDL + Supabase/PostgreSQL'
s9['objetivo'] = (
    'Convertir el modelo del Restaurante ABC en tablas y restricciones ejecutables '
    'sobre PostgreSQL real con Supabase, y comprobar qué reglas acepta o rechaza el motor.'
)
s9.pop('nucleo', None)
s9.pop('reto', None)
s9['actividad'] = {
    'titulo': 'Del modelo al CREATE TABLE',
    'minutos': 40,
    'instrucciones': (
        'Implementa una parte funcional del Restaurante ABC con CREATE TABLE, PRIMARY KEY, '
        'FOREIGN KEY, NOT NULL, UNIQUE y CHECK. Ejecuta primero datos válidos y luego intenta '
        'romper el diseño con datos inválidos para identificar qué restricción protege cada regla.'
    ),
    'criterios': [
        'DDL ejecutable en PostgreSQL',
        'restricciones justificadas desde reglas o decisiones de diseño',
        'prueba al menos un INSERT válido y varios inválidos',
        'identifica al menos una regla de negocio que no resuelve un CHECK simple'
    ]
}
s9['servicio_real'] = {
    'requerido': True,
    'nombre': 'Supabase + PostgreSQL',
    'fallback': (
        'SQLite local solo para continuar practicando DDL si falla el acceso individual; '
        'no reemplaza la demostración ni la ejecución en PostgreSQL real con Supabase.'
    )
}

p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

assert 9 not in data['principios']['diferenciacion_tecnica_sesiones']
assert s9['titulo'] == 'DDL + Supabase/PostgreSQL'
assert 'Supabase' in s9['servicio_real']['nombre']
assert 'PostgreSQL' in s9['servicio_real']['nombre']
print('learning-plan S9 alineado con Supabase/PostgreSQL')
