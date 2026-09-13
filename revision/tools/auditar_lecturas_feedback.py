from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
reading = (ROOT / 'reading.html').read_text(encoding='utf-8')
alignment = (ROOT / 'assets/learning/readings-v7-alignment.js').read_text(encoding='utf-8')
readings = (ROOT / 'assets/learning/readings-v6.js').read_text(encoding='utf-8')
runtime = (ROOT / 'assets/learning/lab-runtime-v7.js').read_text(encoding='utf-8')
worker = (ROOT / 'assets/learning/lab-sql-worker-v1.js').read_text(encoding='utf-8')
course_data = (ROOT / 'assets/learning/course-data.js').read_text(encoding='utf-8')
theme = (ROOT / 'assets/learning/theme-v1.js').read_text(encoding='utf-8')
reading_nav = (ROOT / 'assets/learning/reading-nav-v1.js').read_text(encoding='utf-8')
service_worker = (ROOT / 'service-worker.js').read_text(encoding='utf-8')

errors = []

def need(text, token, where):
    if token not in text:
        errors.append(f'{where}: falta {token!r}')

# La arquitectura visual y pedagógica se aplica a TODAS las lecturas porque existe
# una sola superficie reading.html alimentada por datos de las 16 sesiones.
for token in ['1 · Contexto','2 · Lo visto en diapositivas','3 · Definiciones','4 · Explicación y razonamiento','5 · Lo adicional','6 · Transferencia','NUEVO / AMPLIACIÓN','Cobertura conceptual de la presentación']:
    need(reading, token, 'reading.html')
need(reading, 'readings-v7-alignment.js', 'reading.html')

# Cada sesión debe tener contenido base en readings-v6 y una recapitulación explícita
# de la presentación con al menos cinco bloques en readings-v7.
for n in range(1, 17):
    need(readings, f'{n}:{{', 'readings-v6.js')
    need(alignment, f'\n{n}:[', 'readings-v7-alignment.js')
    m = re.search(rf'\n{n}:\[(.*?)(?=\n\d+:\[|\n\}};)', alignment, flags=re.S)
    if not m:
        errors.append(f'readings-v7-alignment.js: no se pudo aislar la sesión {n}')
        continue
    topic_count = len(re.findall(r"\n\s*\['", m.group(1)))
    if topic_count < 5:
        errors.append(f'readings-v7-alignment.js: S{n} solo tiene {topic_count} bloques de recuperación; mínimo 5')

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

# Tema claro/oscuro: debe cargarse desde el runtime común del LMS, persistir solo
# una preferencia de interfaz y quedar disponible offline. No se aplica a las presentaciones.
for token in ['theme-v1.js','reading-nav-v1.js']:
    need(course_data, token, 'course-data.js')
    need(service_worker, token, 'service-worker.js')
for token in ['andesdb.ui.theme.v1','data-andes-theme','Cambiar a tema claro','Cambiar a tema oscuro','/\\/Presentaciones\\//i']:
    need(theme, token, 'theme-v1.js')
for token in ['reading-pager','footer-nav','reading-jump','Anterior','Siguiente','16']:
    need(reading_nav, token, 'reading-nav-v1.js')

if errors:
    print('AUDITORÍA DE LECTURAS / FEEDBACK: ERROR')
    for e in errors:
        print(' -', e)
    raise SystemExit(1)

print('AUDITORÍA DE LECTURAS / FEEDBACK: OK')
print(' - Las 16 lecturas comparten contexto → clase → definiciones → explicación → ampliación → transferencia.')
print(' - Cada sesión conserva al menos cinco bloques explícitos recuperados de sus diapositivas.')
print(' - S2 y S3 tienen además cobertura conceptual detallada protegida contra regresiones.')
print(' - Feedback SQL protegido contra regreso al mensaje genérico.')
print(' - Tema claro/oscuro y nueva navegación de lecturas forman parte del runtime y del caché PWA.')
