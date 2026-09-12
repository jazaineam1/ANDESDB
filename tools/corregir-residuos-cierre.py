from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

# S6: eliminar la última mención visible del hilo analítico reservado para S12.
p = ROOT / 'Presentaciones/M3/sesion-6-reglas-de-negocio.html'
text = p.read_text(encoding='utf-8')
text = text.replace('OLAP', 'analítica').replace('olap', 'analítica')
text = text.replace('OLTP', 'operación').replace('oltp', 'operación')
p.write_text(text, encoding='utf-8')

# S10: continuidad correcta hacia Firestore + MongoDB Atlas; Cosmos queda conceptual.
p = ROOT / 'Presentaciones/M4/sesion-10-sql-o-nosql.html'
text = p.read_text(encoding='utf-8')
text = re.sub(
    r'en\s+Firestore\s+y\s+en\s+Cosmos\s+DB\.?',
    'en Firestore y MongoDB Atlas. Cosmos DB queda como reconocimiento conceptual para DP-900.',
    text,
    flags=re.I | re.S,
)
p.write_text(text, encoding='utf-8')

# El caso numérico de S9 se eliminó junto con el reteaching; validar que no sobreviva la cifra incorrecta.
p = ROOT / 'tools/validar-cierre-benchmark.py'
text = p.read_text(encoding='utf-8')
old = "    if '14 en vez de 11' not in s9:\n        err('S9: falta la corrección numérica 14 en vez de 11')\n"
new = "    if '14 en vez de 6' in s9:\n        err('S9: reapareció la cifra incorrecta 14 en vez de 6')\n"
if old in text:
    text = text.replace(old, new)
p.write_text(text, encoding='utf-8')
