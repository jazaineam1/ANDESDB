# -*- coding: utf-8 -*-
"""Integra la experiencia común de ANDESDB.

- index.html: metadatos PWA + instalador visible.
- Todas las sesiones públicas: analítica GA4 agregada y sin PII.
- S11, S12, S13, S14 y S15: capa de práctica técnica no persistente.
- S12-S14: enlace contextual al laboratorio analítico local.
- S13: temporizador flexible y lenguaje de laboratorio centrado en aprendizaje.
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
TECHNICAL_DIFFERENTIATION = {11, 12, 13, 14, 15}


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
    """Retira cualquier carga antigua de learning-core.js."""
    pattern = re.compile(
        r"\s*<script\s+[^>]*src=[\"'][^\"']*learning-core\.js(?:\?[^\"']*)?[\"'][^>]*>\s*</script>\s*",
        re.I,
    )
    new = pattern.sub("\n", text)
    return new, new != text


def soften_s13_copy(text: str) -> tuple[str, bool]:
    """Hace que el ritmo de S13 sea orientativo y no punitivo.

    Las actividades conservan objetivos y evidencia, pero explicitan que los
    tiempos se ajustan al grupo y que un problema de acceso no se interpreta
    como falta de aprendizaje.
    """
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
            "<h2>Lab 1 · partición: ejecuta, mide y explica</h2>",
            "<h2>Lab 1 · partición: explora, mide y explica a tu ritmo</h2>",
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

    # La portada instala la PWA y pwa-install.js carga la analítica pública.
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

    # Mantener la diferenciación técnica previa únicamente para S6+.
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

    # GA4 público se instala en todas las presentaciones S1-S16.
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
