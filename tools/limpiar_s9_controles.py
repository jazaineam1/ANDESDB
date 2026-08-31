from pathlib import Path
import re

p = Path('Presentaciones/M3/sesion-9-ddl-supabase.html')
text = p.read_text(encoding='utf-8')

# 1) Una sola barra de progreso, como en S5.
dup = '<div class="progress"><div class="bar" id="bar"></div></div><div class="progress"><div class="bar" id="bar"></div></div>'
text = text.replace(dup, '<div class="progress"><div class="bar" id="bar"></div></div>')

# 2) Retira el bloque de controles simplificado original. La capa estándar
#    ANDESDB que sigue debajo queda como única fuente de estilo.
text = re.sub(
    r'\.toolbar\{position:fixed;left:50%;bottom:1\.1vh;.*?\.timer\.on\{display:block\}\n',
    '', text, count=1, flags=re.S
)
# Resto móvil de aquella barra inferior; la barra estándar vive arriba-derecha.
text = text.replace('.toolbar{bottom:.5rem}', '')

p.write_text(text, encoding='utf-8')

# Auditoría estructural mínima: IDs críticos deben aparecer una vez.
critical = ['bar','count','prev','next','timeBtn','dlBtn','fullBtn','timeOv','timer','mini','miniPP']
for ident in critical:
    n = text.count(f'id="{ident}"')
    print(f'{ident}: {n}')
    if n != 1:
        raise SystemExit(f'id={ident} aparece {n} veces')
if 'learning-core.js' in text or 'andes-practice-btn' in text:
    raise SystemExit('S9 todavía carga la capa Práctica')
if 'CONTROLES ESTÁNDAR ANDESDB' not in text:
    raise SystemExit('Falta la capa estándar de controles')
print('S9: controles limpios, únicos y sin capa Práctica')
