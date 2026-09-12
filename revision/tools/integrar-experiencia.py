# -*- coding: utf-8 -*-
"""Integra la experiencia común de ANDESDB.

- index.html: metadatos PWA + instalador visible.
- S11, S12, S13, S14 y S15: capa de práctica técnica no persistente.
- S12-S14: enlace contextual al laboratorio analítico local.
- S6 conserva únicamente su laboratorio SQL específico.
- S7, S8, S10 y S16 no reciben una capa artificial Núcleo/Reto.
- S2-S5 se dejan intactas deliberadamente.

Es idempotente: puede ejecutarse en cada build.
"""
from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEARNING = ROOT / "assets" / "learning" / "learning-core.js"
PWA_INSTALL = ROOT / "assets" / "pwa-install.js"
ANALYTICS_FALLBACK = ROOT / "assets" / "learning" / "analytics-fallback-link.js"
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

    # La portada instala la PWA, pero ya no mantiene progreso personal ni carga
    # la capa de práctica técnica.
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
    if n < 6:
        return False

    text = path.read_text(encoding="utf-8")
    changed = False

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
