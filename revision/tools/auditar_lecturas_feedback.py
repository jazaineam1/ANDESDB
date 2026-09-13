from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
reading = (ROOT / 'reading.html').read_text(encoding='utf-8')
alignment = (ROOT / 'assets/learning/readings-v7-alignment.js').read_text(encoding='utf-8')
runtime = (ROOT / 'assets/learning/lab-runtime-v7.js').read_text(encoding='utf-8')
worker = (ROOT / 'assets/learning/lab-sql-worker-v1.js').read_text(encoding='utf-8')

errors = []

def need(text, token, where):
    if token not in text:
        errors.append(f'{where}: falta {token!r}')

for token in ['1 · Contexto','2 · Lo visto en diapositivas','3 · Definiciones','4 · Explicación y razonamiento','5 · Lo adicional','6 · Transferencia','NUEVO / AMPLIACIÓN','Cobertura conceptual de la presentación']:
    need(reading, token, 'reading.html')

need(reading, 'readings-v7-alignment.js', 'reading.html')
for n in range(1, 17):
    need(alignment, f'\n{n}:[', 'readings-v7-alignment.js')

# S2: conceptos que realmente aparecen en la presentación y no deben volver a desaparecer de la lectura.
for token in ['Tres formas del dato','Base de datos, SGBD y cliente','Excel y bases de datos','Relacional y NoSQL','SQL y su arquitectura mínima','Explorar antes de consultar','SELECT/FROM, DISTINCT, COUNT, WHERE, AND/OR/NOT, ORDER BY y LIMIT']:
    need(alignment, token, 'alineación S2')

# S3: cobertura mínima de la presentación real.
for token in ['Tipos, literales y NULL','BETWEEN, IN y LIKE','Diferencias de dialecto','Funciones de agregación','GROUP BY y la regla de oro','WHERE frente a HAVING','Orden lógico de ejecución']:
    need(alignment, token, 'alineación S3')

# El feedback de laboratorio debe diagnosticar, no devolver el antiguo mensaje genérico.
if 'Aún no coincide. Revisa columnas, filtros, orden y número de filas.' in runtime:
    errors.append('lab-runtime-v7.js: regresó el feedback genérico anterior')
for token in ['Lo que ya está bien:','Qué debes revisar ahora:','Tu consulta se conserva','friendlySQLError','mismatchFeedback']:
    need(runtime, token, 'lab-runtime-v7.js')
for token in ['gotRows','expectedRows','gotColumns','expectedColumns','SELECT *','ORDER BY','LIMIT','GROUP BY','HAVING']:
    need(worker, token, 'lab-sql-worker-v1.js')

if errors:
    print('AUDITORÍA DE LECTURAS / FEEDBACK: ERROR')
    for e in errors:
        print(' -', e)
    raise SystemExit(1)

print('AUDITORÍA DE LECTURAS / FEEDBACK: OK')
print(' - Ruta de lectura contextualizada y separada en clase vs ampliación.')
print(' - 16 sesiones con recapitulación explícita de diapositivas.')
print(' - S2 y S3 protegidas contra pérdida de conceptos auditados.')
print(' - Feedback SQL protegido contra regresión al mensaje genérico.')
