from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

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

THREAD = {
    1: {
        'hereda': 'Partimos de decisiones reales y del diagnóstico del grupo; todavía no asumimos que una herramienta produzca valor por sí sola.',
        'pregunta': '¿Cómo pasa un dato de existir a generar una decisión?',
        'evidencia': 'Cadena evento → dato → almacenamiento → transformación → consumidor → decisión, más un diagnóstico inicial.',
        'puente': 'Una decisión necesita respuestas verificables. En S2 aprendemos a preguntarle a una base de datos sin modificarla.'
    },
    2: {
        'hereda': 'S1 dejó una decisión que necesita evidencia y una cadena para convertir datos en respuestas.',
        'pregunta': '¿Cómo obtenemos una primera respuesta de una base sin alterar los datos?',
        'evidencia': 'SELECT, WHERE, ORDER BY y LIMIT usados para responder una pregunta concreta y validar el resultado.',
        'puente': 'Listar filas ya no basta cuando el negocio pide comparar y resumir. S3 convierte filas en información agregada.'
    },
    3: {
        'hereda': 'S2 ya permite recuperar filas correctas de una tabla.',
        'pregunta': '¿Cómo filtramos con precisión y convertimos muchas filas en un resumen útil?',
        'evidencia': 'Filtros, GROUP BY, agregaciones y HAVING con una salida cuyo significado se puede explicar.',
        'puente': 'Una sola tabla no contiene todas las respuestas. S4 obliga a relacionar fuentes sin perder la semántica de la pregunta.'
    },
    4: {
        'hereda': 'S3 sabe resumir correctamente una tabla, pero muchas preguntas viven repartidas entre varias.',
        'pregunta': '¿Cómo combinamos tablas preservando las filas que la pregunta exige?',
        'evidencia': 'JOIN elegido por semántica, cardinalidad explicada y resultado validado.',
        'puente': 'Un JOIN puede ser correcto y aun así inflar totales si mezcla granos distintos. S5 diseña primero la tabla resultado.'
    },
    5: {
        'hereda': 'S4 permite unir tablas; ahora debemos evitar construir consultas correctas sintácticamente pero equivocadas en su nivel de detalle.',
        'pregunta': '¿Cómo diseño la tabla resultado y su grano antes de escribir SQL?',
        'evidencia': 'Método ANDESDB: pregunta → grano → fuentes → filtros → agregación → validación.',
        'puente': 'Hasta ahora consultamos un esquema que ya existía. En S6 cambiamos de lado: debemos descubrir qué reglas del negocio debería representar una base.'
    },
    6: {
        'hereda': 'S2–S5 enseñaron a leer un esquema y obtener respuestas; ahora usamos esa lectura como evidencia, no como verdad automática del negocio.',
        'pregunta': '¿Qué puedo afirmar del negocio y con qué grado de certeza?',
        'evidencia': 'Observación → certeza → evidencia → regla comprobable → pregunta pendiente.',
        'puente': 'Las reglas siguen escritas en lenguaje natural. S7 las transforma en entidades, relaciones y cardinalidades.'
    },
    7: {
        'hereda': 'S6 dejó reglas defendibles y dudas explícitas del Restaurante ABC.',
        'pregunta': '¿Qué entidades y relaciones necesita el modelo para representar esas reglas?',
        'evidencia': 'Primer modelo conceptual con cardinalidades y decisiones justificadas.',
        'puente': 'Un primer modelo puede repetir hechos o esconder dependencias. S8 lo somete a normalización sin perder el negocio.'
    },
    8: {
        'hereda': 'S7 produjo el modelo conceptual; ahora hay que comprobar que su estructura relacional no introduzca anomalías.',
        'pregunta': '¿Cómo reducimos redundancia problemática conservando las reglas y la reconstrucción de la información?',
        'evidencia': 'Modelo-base normalizado con dependencias, 1FN, 2FN, 3FN y reconstrucción comprobada.',
        'puente': 'Un modelo correcto en papel todavía no impide datos inválidos. S9 convierte decisiones del modelo en restricciones ejecutables.'
    },
    9: {
        'hereda': 'S8 dejó un modelo relacional normalizado y reglas que deben protegerse.',
        'pregunta': '¿Cómo hacemos que PostgreSQL haga cumplir las reglas y cómo demostramos que realmente las cumple?',
        'evidencia': 'schema.sql + tests.sql con PK, FK, NOT NULL, CHECK, DEFAULT y pruebas negativas.',
        'puente': 'Ya sabemos construir bien una solución relacional. S10 formula la pregunta más importante: ¿cuándo una tabla relacional no es la mejor representación?'
    },
    10: {
        'hereda': 'S9 demostró la fortaleza del modelo relacional cuando necesitamos integridad y reglas explícitas.',
        'pregunta': '¿Qué evidencia necesito antes de decidir entre relacional, documentos u otra familia?',
        'evidencia': 'Decisión defendida por patrón de acceso, consistencia, forma/evolución del dato y costo o riesgo.',
        'puente': 'Decidir “documentos” en papel no demuestra el trade-off. S11 lo vive en un servicio real y lo combina con la fuente relacional de verdad.'
    },
    11: {
        'hereda': 'S10 dejó criterios para elegir representación; ahora probamos una arquitectura híbrida con estado mutable y hechos auditables.',
        'pregunta': '¿Qué debe vivir embebido o referenciado y cuál sistema es fuente de verdad en cada momento?',
        'evidencia': 'Documentos consultados + decisión embed/reference + checkout confirmado y localizado en PostgreSQL.',
        'puente': 'Cada checkout confirmado produce un hecho operacional. Cuando esos hechos crecen y queremos historia, tendencias y tableros, consultar la operación directamente deja de ser suficiente: S12.'
    },
    12: {
        'hereda': 'S11 terminó con ventas confirmadas como hechos operacionales; ahora acumulamos esos hechos para responder preguntas históricas sin castigar la operación.',
        'pregunta': '¿Cómo transformamos datos operacionales en una estructura diseñada para analizar?',
        'evidencia': 'Grano declarado + tabla de hechos + dimensiones + medidas + validación del total correcto.',
        'puente': 'El modelo estrella funciona localmente. S13 comprueba que el mismo razonamiento se sostiene en un warehouse cloud real.'
    },
    13: {
        'hereda': 'S12 dejó un miniwarehouse con grano, hechos, dimensiones y medidas ya validados.',
        'pregunta': '¿Qué cambia cuando ese mismo modelo llega a BigQuery y el costo de lectura se vuelve visible?',
        'evidencia': 'Carga validada de 44 filas / 1.455.000 + consultas de negocio + lectura de bytes procesados.',
        'puente': 'Un warehouse real no recibe únicamente tablas planas. S14 trabaja JSON/Parquet y estructuras anidadas y luego transfiere esas decisiones al mapa Azure.'
    },
    14: {
        'hereda': 'S13 probó el modelo analítico en cloud; ahora cambiamos la forma del dato y preguntamos cuándo conviene mantener estructura anidada.',
        'pregunta': '¿Cuándo conviene una representación plana, relacional o anidada y cómo se traduce la necesidad a servicios Azure?',
        'evidencia': 'STRUCT/ARRAY/UNNEST ejecutados + decisión de representación + mapa necesidad → familia/servicio.',
        'puente': 'Ya practicamos las piezas por separado. S15 quita la receta y obliga a elegir modelo, transformación, consultas y arquitectura a partir del problema.'
    },
    15: {
        'hereda': 'S1–S14 construyeron el repertorio: preguntar, modelar, implementar, elegir representación, analizar y transferir a cloud.',
        'pregunta': '¿Puedo resolver un problema completo sin que la herramienta ni el modelo estén decididos de antemano?',
        'evidencia': 'Diagnóstico + modelo + transformación + consultas + validaciones + arquitectura + defensa oral.',
        'puente': 'La defensa final revela qué dominios ya dominamos y dónde todavía dudamos. S16 convierte esa evidencia en diagnóstico y plan DP-900.'
    },
    16: {
        'hereda': 'S15 produjo evidencia auténtica de desempeño, no solo respuestas de opción múltiple.',
        'pregunta': '¿Qué aprendí, qué puedo transferir y qué me falta para demostrarlo en DP-900?',
        'evidencia': 'Pre/post + diagnóstico por dominio + transferencia por escenarios + plan personal de estudio.',
        'puente': 'Se cierra el ciclo: problema → evidencia → consulta → modelo → implementación → elección tecnológica → analítica → validación → decisión.'
    },
}

ACTS = [
    {'acto': 1, 'sesiones': [1], 'nombre': 'Por qué importan los datos', 'pregunta': '¿Qué decisión queremos mejorar y qué papel cumplen los datos?'},
    {'acto': 2, 'sesiones': [2, 3, 4, 5], 'nombre': 'Responder preguntas con confianza', 'pregunta': '¿Cómo obtenemos una respuesta correcta, explicable y validada con SQL?'},
    {'acto': 3, 'sesiones': [6, 7, 8, 9], 'nombre': 'Diseñar y hacer cumplir el modelo', 'pregunta': '¿Cómo pasamos de reglas del negocio a una base que proteja esas reglas?'},
    {'acto': 4, 'sesiones': [10, 11], 'nombre': 'Elegir la representación adecuada', 'pregunta': '¿Cuándo convienen tablas, documentos o una arquitectura híbrida?'},
    {'acto': 5, 'sesiones': [12, 13, 14], 'nombre': 'Separar operación y analítica y llevarla a cloud', 'pregunta': '¿Cómo diseñamos para análisis y transferimos el razonamiento entre nubes?'},
    {'acto': 6, 'sesiones': [15, 16], 'nombre': 'Integrar, demostrar y transferir', 'pregunta': '¿Podemos resolver el problema completo y explicar lo aprendido en un marco externo?'},
]


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')


def slide_spans(text: str):
    opener = re.compile(r'<section\b[^>]*\bclass=["\'][^"\']*\bslide\b[^"\']*["\'][^>]*>', re.I)
    tags = re.compile(r'</?section\b[^>]*>', re.I)
    result = []
    for m in opener.finditer(text):
        depth = 0
        for tag in tags.finditer(text, m.start()):
            if tag.group(0).startswith('</'):
                depth -= 1
                if depth == 0:
                    result.append((m.start(), tag.end()))
                    break
            else:
                depth += 1
    clean = []
    for a, b in result:
        if not any(x <= a and b <= y for x, y in clean):
            clean.append((a, b))
    return clean


def slide_title(fragment: str) -> str:
    m = re.search(r'data-title=["\']([^"\']+)', fragment, re.I)
    return html.unescape(m.group(1)).strip() if m else ''


def hilo_slide(n: int) -> str:
    d = THREAD[n]
    return f'''<section class="slide dense" data-title="Hilo conductor" data-hilo="s{n:02d}">
<div class="ey">Hilo conductor · sesión {n}</div>
<h2>Esta clase existe porque la anterior dejó un problema abierto</h2>
<div class="g2">
  <div class="card"><h3>Venimos de</h3><p>{html.escape(d['hereda'])}</p></div>
  <div class="card blue"><h3>Pregunta de hoy</h3><p><strong>{html.escape(d['pregunta'])}</strong></p></div>
</div>
<div class="g2" style="margin-top:1em">
  <div class="card"><h3>Debe quedar evidencia</h3><p>{html.escape(d['evidencia'])}</p></div>
  <div class="card blue"><h3>Esto obliga a abrir la siguiente</h3><p>{html.escape(d['puente'])}</p></div>
</div>
<div class="brand"><span>ANDESDB · una sola historia de 16 sesiones</span><span>Sesión {n}</span></div>
</section>'''


def upsert_hilo_slide(path: Path, n: int) -> None:
    text = read(path)
    spans = slide_spans(text)
    if not spans:
        raise RuntimeError(f'No se encontraron diapositivas en {path}')
    existing = None
    for a, b in spans:
        if slide_title(text[a:b]).casefold() == 'hilo conductor':
            existing = (a, b)
            break
    fragment = hilo_slide(n)
    if existing:
        a, b = existing
        text = text[:a] + fragment + text[b:]
    else:
        _, first_end = spans[0]
        text = text[:first_end] + '\n' + fragment + '\n' + text[first_end:]
    write(path, text)


def update_course() -> None:
    path = ROOT / 'tools/curso.json'
    data = json.loads(read(path))
    data['hiloConductor'] = {
        'preguntaMadre': '¿Cómo convertimos una necesidad de negocio en una solución de datos defendible, comprobable y transferible?',
        'reglaNarrativa': 'Cada sesión hereda una evidencia, resuelve una pregunta y deja una limitación que hace necesaria la siguiente.',
        'actos': ACTS,
        'sesiones': {str(n): THREAD[n] for n in range(1, 17)},
    }
    data['glosario'] = 'El curso cuenta una sola historia: decisión → consulta → respuesta validada → reglas → modelo → implementación → elección de representación → arquitectura híbrida → analítica → cloud → integración → transferencia. Cada sesión debe explicar qué hereda, qué resuelve, qué evidencia deja y por qué la siguiente es necesaria.'
    # S12 debe ser conceptual y analítica; el mapa de productos Azure se concentra en S14.
    for mod in data.get('modulos', []):
        for s in mod.get('sesiones', []):
            if s.get('n') == 12:
                s['desc'] = 'Partir del dolor de consultar la operación para diseñar un modelo analítico: grano, hechos, dimensiones, medidas y batch/streaming. La transferencia de servicios Azure se concentra en S14.'
                s['tags'] = [t for t in s.get('tags', []) if t not in ('Fabric', 'Databricks')]
            if s.get('n') == 13:
                s['desc'] = 'Llevar el modelo estrella de S12 a Google BigQuery real: cargar, consultar, validar y observar bytes procesados. DuckDB-Wasm es contingencia, no sustituto del servicio cloud.'
            if s.get('n') == 14:
                s['desc'] = 'Cambiar la forma del dato con STRUCT/ARRAY/UNNEST, JSON y Parquet en BigQuery real; después transferir la necesidad a almacenamiento, Cosmos DB, Fabric/Databricks y Power BI.'
    write(path, json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def update_learning_plan() -> None:
    path = ROOT / 'assets/learning/learning-plan.json'
    data = json.loads(read(path))
    data['hilo_conductor'] = {
        'pregunta_madre': '¿Cómo convertimos una necesidad de negocio en una solución de datos defendible, comprobable y transferible?',
        'actos': ACTS,
        'regla': 'hereda → pregunta central → evidencia → limitación/puente siguiente',
    }
    for n in range(6, 17):
        if str(n) in data.get('sesiones', {}):
            data['sesiones'][str(n)]['hilo'] = THREAD[n]

    # Reducir saltos de producto que interrumpen la historia conceptual.
    s11 = data['sesiones']['11']
    if len(s11.get('dp900', [])) >= 2:
        s11['dp900'][1] = {
            'dominio': 'Non-relational data on Azure',
            'pregunta': 'En una base distribuida por particiones, ¿qué decisión afecta directamente cómo se distribuyen y consultan los datos?',
            'opciones': ['Elegir una clave de partición adecuada', 'Cambiar el color del portal', 'Usar siempre una sola colección', 'Eliminar todos los identificadores'],
            'correcta': 0,
            'explicacion': 'La clave de partición condiciona distribución y acceso; el objetivo es transferir el razonamiento documental antes de memorizar servicios.'
        }
    s13 = data['sesiones']['13']
    if len(s13.get('dp900', [])) >= 2:
        s13['dp900'][1] = {
            'dominio': 'Analytics workload on Azure',
            'pregunta': '¿Qué característica distingue a una carga analítica de la operación transaccional que construimos en S9?',
            'opciones': ['Busca explorar y agregar grandes conjuntos históricos sin ser la ruta principal de la transacción', 'Debe usar el mismo esquema y motor que la operación', 'Solo admite datos JSON', 'No necesita validar resultados'],
            'correcta': 0,
            'explicacion': 'S13 transfiere el concepto de almacén analítico; los nombres de productos Azure se concentran en S14 y S16.'
        }
    s15 = data['sesiones']['15']
    if len(s15.get('dp900', [])) >= 2:
        s15['dp900'][0]['dominio'] = 'Analytics workload on Azure'
        s15['dp900'][1]['dominio'] = 'Core data concepts'
    write(path, json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def update_guides() -> None:
    for n in range(1, 17):
        path = ROOT / f'docs/instructor/S{n:02d}.md'
        if not path.exists():
            continue
        text = read(path)
        block = f'''## Hilo conductor\n- **Hereda:** {THREAD[n]['hereda']}\n- **Pregunta de hoy:** {THREAD[n]['pregunta']}\n- **Evidencia de salida:** {THREAD[n]['evidencia']}\n- **Puente:** {THREAD[n]['puente']}\n\n'''
        pattern = re.compile(r'## Hilo conductor\n.*?(?=\n## |\Z)', re.S)
        if pattern.search(text):
            text = pattern.sub(block.rstrip(), text)
        else:
            marker = '## Error esperable principal\n'
            pos = text.find(marker)
            if pos >= 0:
                text = text[:pos] + block + text[pos:]
            else:
                text += '\n' + block
        write(path, text)


def write_thread_doc() -> None:
    lines = [
        '# Hilo conductor del curso', '',
        '**Pregunta madre:** ¿Cómo convertimos una necesidad de negocio en una solución de datos defendible, comprobable y transferible?', '',
        'La regla narrativa es **hereda → pregunta → evidencia → limitación que obliga a la siguiente sesión**. No se añaden temas por catálogo: cada concepto aparece porque resuelve un problema que ya fue visible.', '',
        '## Seis actos', ''
    ]
    for act in ACTS:
        ss = '–'.join(map(str, act['sesiones']))
        lines += [f"### Acto {act['acto']} · S{ss} · {act['nombre']}", act['pregunta'], '']
    lines += ['## Cadena sesión a sesión', '']
    for n in range(1, 17):
        d = THREAD[n]
        lines += [
            f'### S{n:02d}',
            f'- **Hereda:** {d["hereda"]}',
            f'- **Pregunta:** {d["pregunta"]}',
            f'- **Evidencia:** {d["evidencia"]}',
            f'- **Puente:** {d["puente"]}', ''
        ]
    write(ROOT / 'docs/HILO-CONDUCTOR.md', '\n'.join(lines) + '\n')


def main() -> None:
    update_course()
    update_learning_plan()
    update_guides()
    write_thread_doc()
    for n, rel in DECKS.items():
        upsert_hilo_slide(ROOT / rel, n)
    print('OK: hilo conductor explícito en manifiesto, learning plan, guías y 16 presentaciones')


if __name__ == '__main__':
    main()
