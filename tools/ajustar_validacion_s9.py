from pathlib import Path
import json

VALIDADOR = Path('tools/validar_curso.py')
CURSO = Path('tools/curso.json')

text = VALIDADOR.read_text(encoding='utf-8')
text = text.replace('TECHNICAL_DIFFERENTIATION = {9, 11, 12, 13, 14, 15}', 'TECHNICAL_DIFFERENTIATION = {11, 12, 13, 14, 15}')
VALIDADOR.write_text(text, encoding='utf-8')

data = json.loads(CURSO.read_text(encoding='utf-8'))
met = data.setdefault('metodologia', {})
met['diferenciacionTecnicaSesiones'] = [n for n in met.get('diferenciacionTecnicaSesiones', []) if n != 9]
CURSO.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('Validador y manifiesto alineados: S9 sin capa externa de Práctica')
