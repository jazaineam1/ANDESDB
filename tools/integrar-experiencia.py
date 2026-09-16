# -*- coding: utf-8 -*-
"""Integra la experiencia común de ANDESDB.

- index.html: metadatos PWA + instalador visible.
- Todas las sesiones públicas: analítica GA4 agregada y sin PII.
- S11, S12, S13 y S14: capa de práctica técnica no persistente.
- S12-S14: enlace contextual al laboratorio analítico local.
- S13: temporizador flexible, lenguaje centrado en aprendizaje y comparación visual
  entre partición y clustering.
- S6 conserva únicamente su laboratorio SQL específico.
- S7, S8, S10 y S16 no reciben una capa artificial Núcleo/Reto.
- S2-S5 se dejan intactas pedagógicamente; solo reciben analítica pública.

Es idempotente: puede ejecutarse en cada build.
"""
from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEARNING = ROOT / "assets" / "learning" / "learning-core.js"
PRESENTATION_TIMER = ROOT / "assets" / "learning" / "presentation-timer.js"
PRESENTATION_TIMER_VERSION = "20260915b"
PWA_INSTALL = ROOT / "assets" / "pwa-install.js"
ANALYTICS_FALLBACK = ROOT / "assets" / "learning" / "analytics-fallback-link.js"
PUBLIC_ANALYTICS_CONFIG = ROOT / "assets" / "analytics-config.js"
PUBLIC_ANALYTICS = ROOT / "assets" / "analytics.js"
TECHNICAL_DIFFERENTIATION = {11, 12, 13, 14}


def relative_url(from_file: Path, target: Path) -> str:
    return Path(os.path.relpath(target, from_file.parent)).as_posix()


def inject_before(text: str, marker: str, fragment: str) -> tuple[str, bool]:
    if fragment in text:
        return text, False
    pos = text.lower().rfind(marker.lower())
    if pos < 0:
        return text, False
    return text[:pos] + fragment + "\n" + text[pos:], True


def remove_learning_script(text: str) -> tuple[str, bool]:
    pattern = re.compile(
        r"\s*<script\s+[^>]*src=[\"'][^\"']*learning-core\.js(?:\?[^\"']*)?[\"'][^>]*>\s*</script>\s*",
        re.I,
    )
    new = pattern.sub("\n", text)
    return new, new != text


def soften_s13_copy(text: str) -> tuple[str, bool]:
    """Hace que el ritmo de S13 sea orientativo y no punitivo."""
    replacements = (
        (
            "<h2>Criterio de salida: no basta con que la consulta funcione</h2>",
            "<h2>Meta de aprendizaje: que funcione y que podamos explicar cómo lee BigQuery</h2>",
        ),
        (
            "<h3>Al terminar debes poder</h3>",
            "<h3>Al finalizar, la idea es que puedas</h3>",
        ),
        (
            '<div class="checkpoint"><b>Regla:</b> resultado correcto + lectura defendible.</div>',
            '<div class="checkpoint"><b>Idea guía:</b> resultado correcto + evidencia de lectura. Si algo no sale a la primera, lo usamos para aprender.</div>',
        ),
        (
            "<h2>Prueba el entorno antes de empezar a aprender</h2>",
            "<h2>Aseguremos el entorno antes de entrar al laboratorio</h2>",
        ),
        (
            '<div class="warn">Si el lab no arranca, usa el enlace al curso padre. Si Google Skills sigue bloqueado, pasa a <b>BigQuery Sandbox</b>; DuckDB-Wasm queda solo como contingencia conceptual.</div>',
            '<div class="warn">Si el lab no arranca, cambia de ruta: curso padre → <b>BigQuery Sandbox</b> → apoyo del docente. Un problema de acceso no debe dejar a nadie atrás ni convertirse en una carrera contra el reloj.</div>',
        ),
        (
            '<div class="brand"><span>Preflight</span><span>No avances con un entorno roto</span></div>',
            '<div class="brand"><span>Preflight</span><span>Si algo falla, cambiamos de ruta</span></div>',
        ),
        (
            "<h2>Lab 1 · partición: ejecuta, mide y explica</h2>",
            "<h2>Lab 1 · partición: explora, mide y explica a tu ritmo</h2>",
        ),
        (
            "<li>Completa la actividad oficial.</li>",
            "<li>Avanza en la actividad oficial hasta donde el tiempo y el acceso lo permitan.</li>",
        ),
        (
            '<li>Registra <b>bytes estimados o procesados</b> en una comparación.</li>',
            '<li>Cuando la interfaz lo muestre, registra <b>bytes estimados o procesados</b> para comparar.</li>',
        ),
        (
            '<div class="checkpoint"><b>Entrega mínima:</b> consulta + evidencia de bytes + explicación. Una captura sola no demuestra comprensión.</div>',
            '<div class="checkpoint"><b>Evidencia sugerida:</b> intenta conservar consulta + evidencia de bytes + una explicación breve. Si no alcanzas a terminar, guarda lo logrado y explica hasta dónde llegaste.</div><div class="mini"><b>Ritmo flexible:</b> el temporizador es una referencia docente. Si el grupo necesita más tiempo, se amplía; el objetivo es comprender, no correr.</div>',
        ),
        (
            "<h2>Lab 2 · clustering: observa qué consultas se benefician</h2>",
            "<h2>Lab 2 · clustering: explora qué consultas se benefician</h2>",
        ),
        (
            "<li>Compara evidencia de lectura/ejecución.</li>",
            "<li>Cuando tengas resultados, compara la evidencia de lectura/ejecución disponible.</li>",
        ),
        (
            '<div class="checkpoint"><b>Pregunta de salida:</b> ¿por qué el mismo clustering no optimiza por igual cualquier filtro?</div>',
            '<div class="checkpoint"><b>Pregunta para conversar:</b> ¿por qué el mismo clustering no ayuda por igual a cualquier filtro? Si todavía estás probando, comparte tu hipótesis.</div><div class="mini"><b>Ritmo flexible:</b> puedes usar más tiempo o trabajar acompañado. Llegar al razonamiento importa más que terminar primero.</div>',
        ),
        (
            '<div class="ey">Solo si terminaste los dos labs</div>',
            '<div class="ey">Extensión opcional · solo si el grupo va cómodo</div>',
        ),
        (
            "Es extensión. No sacrifiques la evidencia de los dos laboratorios núcleo por completar una tercera actividad.",
            "Es una extensión. Si el grupo necesita más tiempo, priorizamos consolidar los dos laboratorios principales y dejamos esta práctica para después.",
        ),
        (
            "<h2>¿Qué debes poder explicar sin mirar la presentación?</h2>",
            "<h2>¿Qué ideas nos llevamos y podemos seguir practicando?</h2>",
        ),
        (
            '<div class="ey">Cierre · antes de salir</div>',
            '<div class="ey">Cierre · conectemos las ideas</div>',
        ),
    )
    changed = False
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
            changed = True
    return text, changed


def replace_s13_slide(text: str, title: str, replacement: str) -> tuple[str, bool]:
    pattern = re.compile(
        rf'<section\b[^>]*data-title="{re.escape(title)}"[^>]*>.*?</section>',
        re.I | re.S,
    )
    new_text, count = pattern.subn(replacement, text, count=1)
    return new_text, count > 0 and new_text != text


def improve_s13_storage_concepts(text: str) -> tuple[str, bool]:
    """Refuerza la diferencia conceptual y visual entre partition y clustering."""
    changed = False

    css = """
.storage-compare{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin:.75rem 0}
.storage-card{border:1px solid #d9e2e9;border-radius:16px;padding:.85rem 1rem;background:#fff}
.storage-card.partition{border-top:5px solid #124e78}.storage-card.cluster{border-top:5px solid #7b4bb7}
.storage-card h3{margin:.05rem 0 .4rem}.storage-q{font-weight:900;font-size:1.02em;margin:.45rem 0;color:#17202a}
.storage-chain{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin:.8rem 0}
.storage-step{border:1px solid #dce5ec;border-radius:15px;padding:.75rem;background:#f8fafb;min-height:155px}
.storage-step strong{display:block;margin-bottom:.35rem}.storage-step .big{font-size:1.2em;font-weight:900;color:#124e78}
.mini-partitions{display:grid;grid-template-columns:repeat(6,1fr);gap:.22rem;margin:.55rem 0}.mini-partitions span{height:28px;border-radius:5px;background:#dfe5ea}.mini-partitions .keep{background:#9fd0f5;border:1px solid #124e78}
.mini-blocks{display:grid;grid-template-columns:repeat(8,1fr);gap:.18rem;margin:.55rem 0}.mini-blocks span{height:24px;border-radius:4px;background:#e6e0ef}.mini-blocks .keep{background:#bca3df;border:1px solid #68409b}
.myth{border-left:5px solid #e0a800;background:#fff9dd;border-radius:10px;padding:.65rem .85rem;margin:.65rem 0}
@media(max-width:760px){.storage-compare,.storage-chain{grid-template-columns:1fr}.storage-step{min-height:auto}}
""".strip()
    if ".storage-compare{" not in text and "</style>" in text:
        text = text.replace("</style>", css + "\n</style>", 1)
        changed = True

    partition = '''<section class="slide dense" data-title="Partición"><div class="ey">Concepto 1 · segmentar a gran escala</div><h2>Partition crea fronteras grandes que BigQuery puede descartar completas</h2><p class="lead">Una tabla particionada se divide en <b>segmentos independientes llamados particiones</b>. Si el filtro usa la columna de partición de forma aprovechable, BigQuery puede omitir particiones enteras: <b>partition pruning</b>.</p><div class="mini-partitions" aria-label="Ejemplo visual de particiones"><span></span><span></span><span></span><span></span><span></span><span class="keep"></span><span class="keep"></span><span class="keep"></span><span class="keep"></span><span></span><span></span><span></span></div><div class="checkpoint"><b>Pregunta mental:</b> “¿qué pedazos grandes de la tabla puedo ignorar por completo?”. Si consultas julio, el objetivo es no revisar meses que no pueden aportar filas.</div><div class="myth"><b>No memorices “partition = fecha”.</b> La fecha es muy común porque muchos análisis filtran periodos, pero la decisión nace del patrón de consulta y de las estrategias de partición que admite BigQuery.</div><div class="brand"><span>Partición</span><span>Pruning de particiones completas</span></div></section>'''
    text, ok = replace_s13_slide(text, "Partición", partition)
    changed |= ok

    clustering = '''<section class="slide dense" data-title="Clusterización"><div class="ey">Concepto 2 · organizar a escala más fina</div><h2>Clustering no crea otra tabla por partes: organiza los datos en bloques</h2><p class="lead">BigQuery ordena y agrupa físicamente los datos en <b>bloques de almacenamiento</b> usando las columnas de <code>CLUSTER BY</code>. Cuando una consulta filtra esas columnas, puede evitar bloques que no contienen valores relevantes: <b>block pruning</b>.</p><div class="storage-compare"><div class="storage-card partition"><h3>🧱 PARTITION</h3><div class="storage-q">¿Qué segmentos completos puedo excluir?</div><p>Divide la tabla en particiones. Actúa a una escala grande y ayuda a limitar el conjunto inicial de datos.</p></div><div class="storage-card cluster"><h3>🧩 CLUSTERING</h3><div class="storage-q">Dentro de lo que quedó, ¿qué bloques puedo excluir?</div><p>Organiza bloques por columnas de acceso frecuente. Actúa a una escala más fina.</p></div></div><div class="myth"><b>Mito a evitar:</b> “partition es para fechas y clustering para texto”. No. La diferencia central es <b>segmentación vs. organización de bloques</b>; el diseño depende de cómo consultas los datos.</div><div class="brand"><span>Clustering</span><span>Block pruning dentro de la tabla o partición</span></div></section>'''
    text, ok = replace_s13_slide(text, "Clusterización", clustering)
    changed |= ok

    together = '''<section class="slide dense" data-title="Cómo trabajan juntos"><div class="ey">La imagen que debes recordar</div><h2>Partition reduce el territorio; clustering reduce los bloques dentro de ese territorio</h2><p class="lead">Supón ventas de 2024–2026, particionadas por <code>fecha</code> y clusterizadas por <code>categoria, cliente_id</code>. Preguntamos por <b>julio de 2026 + Bebidas + cliente 942</b>.</p><div class="storage-chain"><div class="storage-step"><strong>1 · Tabla completa</strong><div class="big">Todo el histórico</div><div class="mini-partitions"><span></span><span></span><span></span><span></span><span></span><span></span></div><p>Sin ayuda del diseño, una gran cantidad de datos puede ser candidata a lectura.</p></div><div class="storage-step"><strong>2 · PARTITION BY fecha</strong><div class="big">Queda julio de 2026</div><div class="mini-partitions"><span></span><span></span><span class="keep"></span><span></span><span></span><span></span></div><p><b>Partition pruning:</b> se descartan las demás particiones.</p></div><div class="storage-step"><strong>3 · CLUSTER BY categoria, cliente_id</strong><div class="big">Quedan bloques relevantes</div><div class="mini-blocks"><span></span><span class="keep"></span><span></span><span></span><span class="keep"></span><span></span><span></span><span></span></div><p><b>Block pruning:</b> dentro de julio se evitan bloques que no ayudan al filtro.</p></div></div><div class="quote"><b>En una frase:</b> partition decide qué compartimentos abrir; clustering ayuda a decidir qué cajas revisar dentro del compartimento.</div><div class="brand"><span>Juntos</span><span>Partición → bloques → menos lectura innecesaria</span></div></section>'''
    if 'data-title="Cómo trabajan juntos"' not in text:
        pattern = re.compile(r'(<section\b[^>]*data-title="Clusterización"[^>]*>.*?</section>)', re.I | re.S)
        new_text, count = pattern.subn(r'\1\n' + together, text, count=1)
        if count:
            text = new_text
            changed = True

    order = '''<section class="slide dense" data-title="Orden del clustering"><div class="ey">El orden de CLUSTER BY sí importa</div><h2>La primera columna del clustering debe reflejar un patrón de acceso muy frecuente</h2><pre><code>CREATE OR REPLACE TABLE curso.ventas_optimizadas
PARTITION BY fecha
CLUSTER BY categoria, cliente_id
AS
SELECT * FROM curso.ventas;</code></pre><div class="g3"><div class="card blue"><h3>Filtro A</h3><p><code>categoria='Bebidas'</code></p><p>Empieza por la primera columna: buen candidato para aprovechar el clustering.</p></div><div class="card"><h3>Filtro B</h3><p><code>categoria='Bebidas' AND cliente_id=942</code></p><p>Puede aprovechar ambas columnas siguiendo el orden del clustering.</p></div><div class="card"><h3>Filtro C</h3><p><code>cliente_id=942</code></p><p>Puede beneficiarse, pero normalmente menos: se saltó la primera columna del clustering.</p></div></div><div class="checkpoint"><b>Ojo:</b> importa el orden de columnas en <code>CLUSTER BY</code>; no necesitas escribir las condiciones del <code>WHERE</code> en ese mismo orden textual.</div><div class="brand"><span>Clustering</span><span>Orden de diseño ≠ orden textual del WHERE</span></div></section>'''
    text, ok = replace_s13_slide(text, "Orden del clustering", order)
    changed |= ok

    decision = '''<section class="slide dense" data-title="Partición, clustering o ambos"><div class="ey">Síntesis de decisión</div><h2>Elige por la pregunta que quieres evitar que BigQuery tenga que leer</h2><table class="decision"><thead><tr><th>Patrón de consulta</th><th>Primero investigaría</th><th>Por qué</th></tr></thead><tbody><tr><td>Consultas repetidas por periodos de fecha</td><td><b>Partición</b></td><td>Permite excluir periodos completos.</td></tr><tr><td>Filtros frecuentes por cliente, categoría, región u otras columnas</td><td><b>Clustering</b></td><td>Permite reducir bloques según esas columnas.</td></tr><tr><td>Primero periodo; luego cliente/categoría</td><td><b>Partición + clustering</b></td><td>Primero elimina particiones y luego bloques dentro de ellas.</td></tr><tr><td>Tabla pequeña o sin patrón estable</td><td><b>Medir primero</b></td><td>La optimización debe responder a un problema real.</td></tr></tbody></table><div class="storage-compare"><div class="storage-card partition"><h3>Partition</h3><p><b>Escala:</b> grande.</p><p><b>Unidad que evita leer:</b> particiones.</p><p><b>Estimación previa:</b> suele ser más predecible después del pruning.</p></div><div class="storage-card cluster"><h3>Clustering</h3><p><b>Escala:</b> fina.</p><p><b>Unidad que evita leer:</b> bloques.</p><p><b>Lectura final:</b> depende de los bloques que realmente se escanean.</p></div></div><div class="quote">No preguntes “¿cuál es mejor?”. Pregunta: <b>¿qué patrón de consulta quiero ayudar y a qué escala puedo descartar datos?</b></div><div class="brand"><span>Decisión</span><span>Segmentar · organizar · medir</span></div></section>'''
    text, ok = replace_s13_slide(text, "Partición, clustering o ambos", decision)
    changed |= ok

    return text, changed


def ensure_public_analytics(text: str, path: Path) -> tuple[str, bool]:
    changed = False
    cfg_src = relative_url(path, PUBLIC_ANALYTICS_CONFIG)
    js_src = relative_url(path, PUBLIC_ANALYTICS)
    cfg_tag = f'<script src="{cfg_src}?v=20260912a"></script>'
    js_tag = f'<script src="{js_src}?v=20260912a"></script>'
    if "assets/analytics-config.js" not in text:
        text, ok = inject_before(text, "</body>", cfg_tag)
        changed |= ok
    if "assets/analytics.js" not in text:
        text, ok = inject_before(text, "</body>", js_tag)
        changed |= ok
    return text, changed


def process_index() -> bool:
    path = ROOT / "index.html"
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    changed = False

    head_fragments = [
        '<link rel="manifest" href="manifest.webmanifest">',
        '<meta name="theme-color" content="#171717">',
        '<meta name="mobile-web-app-capable" content="yes">',
        '<link rel="icon" type="image/png" sizes="192x192" href="assets/icons/andesdb-192.png">',
        '<link rel="apple-touch-icon" sizes="192x192" href="assets/icons/andesdb-192.png">',
    ]
    for fragment in head_fragments:
        if fragment not in text:
            text, ok = inject_before(text, "</head>", fragment)
            changed |= ok

    text, removed = remove_learning_script(text)
    changed |= removed

    installer = '<script src="assets/pwa-install.js"></script>'
    if installer not in text:
        text, ok = inject_before(text, "</body>", installer)
        changed |= ok

    if changed:
        path.write_text(text, encoding="utf-8")
    return changed


def process_session(path: Path) -> bool:
    m = re.search(r"sesion-(\d+)", path.name, re.I)
    if not m:
        return False
    n = int(m.group(1))

    text = path.read_text(encoding="utf-8")
    changed = False

    if n == 13:
        text, softened = soften_s13_copy(text)
        changed |= softened
        text, concepts_changed = improve_s13_storage_concepts(text)
        changed |= concepts_changed

    if n >= 6:
        if n in TECHNICAL_DIFFERENTIATION:
            if "learning-core.js" not in text:
                src = relative_url(path, LEARNING)
                text, ok = inject_before(text, "</body>", f'<script src="{src}"></script>')
                changed |= ok
        else:
            text, removed = remove_learning_script(text)
            changed |= removed

        if 12 <= n <= 14:
            if "analytics-fallback-link.js" not in text:
                src = relative_url(path, ANALYTICS_FALLBACK)
                text, ok = inject_before(text, "</body>", f'<script src="{src}"></script>')
                changed |= ok

        if n == 13:
            src = relative_url(path, PRESENTATION_TIMER)
            timer_tag = f'<script src="{src}?v={PRESENTATION_TIMER_VERSION}"></script>'
            timer_pattern = re.compile(
                r'<script\s+src=["\'][^"\']*presentation-timer\.js(?:\?[^"\']*)?["\']\s*></script>',
                re.I,
            )
            if timer_pattern.search(text):
                new_text = timer_pattern.sub(timer_tag, text)
                changed |= new_text != text
                text = new_text
            else:
                text, ok = inject_before(text, "</body>", timer_tag)
                changed |= ok

    text, analytics_changed = ensure_public_analytics(text, path)
    changed |= analytics_changed

    if changed:
        path.write_text(text, encoding="utf-8")
    return changed


def main() -> int:
    changed = []
    if process_index():
        changed.append("index.html")
    for path in sorted(ROOT.glob("Presentaciones/M*/sesion-*.html")):
        if process_session(path):
            changed.append(str(path.relative_to(ROOT)))
    print("Experiencia común integrada:")
    if changed:
        for item in changed:
            print("  +", item)
    else:
        print("  sin cambios")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
