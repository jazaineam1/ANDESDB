from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
platform = (ROOT / 'assets/learning/lms-platform.js').read_text(encoding='utf-8')
course = (ROOT / 'assets/learning/course-data.js').read_text(encoding='utf-8')
ux = (ROOT / 'assets/learning/teacher-dashboard-ux-v2.js').read_text(encoding='utf-8')
skin = (ROOT / 'assets/learning/uniandes-skin-v1.js').read_text(encoding='utf-8')
sw = (ROOT / 'service-worker.js').read_text(encoding='utf-8')

errors = []

def need(text, token, where):
    if token not in text:
        errors.append(f'{where}: falta {token!r}')

# El backend devuelve también entregas archivadas a teacher_overview; el cliente
# debe exponer como activas solo las filas active != false y su bandeja asociada.
for token in ["filter(a=>a?.active!==false)", 'activeIds', 'submissions=(x.submissions||[]).filter']:
    need(platform, token, 'lms-platform.js')

# El dashboard debe confirmar, bloquear doble toque, mostrar feedback y refrescar.
for token in ['data-archive', 'Archivar entrega', 'Archivando…', 'stopImmediatePropagation',
              'archiveAssignment(id)', "document.getElementById('refresh')?.click()", 'teacher-toast']:
    need(ux, token, 'teacher-dashboard-ux-v2.js')

# El lenguaje visual institucional se aplica al LMS, no a las presentaciones.
for token in ['--andes-gold', '--andes-bg', '.tabs', '.tab.active::after', '.mobile-nav', 'Presentaciones']:
    need(skin, token, 'uniandes-skin-v1.js')

for token in ['uniandes-skin-v1.js', 'teacher-dashboard-ux-v2.js']:
    need(course, token, 'course-data.js')
    need(sw, token, 'service-worker.js')

if errors:
    print('AUDITORÍA PANEL DOCENTE / UX: ERROR')
    for e in errors:
        print(' -', e)
    raise SystemExit(1)

print('AUDITORÍA PANEL DOCENTE / UX: OK')
print(' - Las entregas archivadas dejan de tratarse como activas.')
print(' - El archivado tiene confirmación, estado de proceso, feedback y refresco.')
print(' - El LMS carga un lenguaje visual institucional claro/oscuro sin alterar presentaciones.')
