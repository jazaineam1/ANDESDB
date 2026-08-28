# -*- coding: utf-8 -*-
"""Inyecta la capa común de aprendizaje en el sitio.

- index.html: manifiesto PWA + learning-core.js
- sesiones HTML S6-S16: learning-core.js con ruta relativa correcta
- S2-S5 se dejan intactas deliberadamente.

Es idempotente: puede ejecutarse en cada build.
"""
from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEARNING = ROOT / "assets" / "learning" / "learning-core.js"
MANIFEST = ROOT / "manifest.webmanifest"


def relative_url(from_file: Path, target: Path) -> str:
    return Path(os.path.relpath(target, from_file.parent)).as_posix()


def inject_before(text: str, marker: str, fragment: str) -> tuple[str, bool]:
    if fragment in text:
        return text, False
    pos = text.lower().rfind(marker.lower())
    if pos < 0:
        return text, False
    return text[:pos] + fragment + "\n" + text[pos:], True


def process_index() -> bool:
    path = ROOT / "index.html"
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    changed = False
    manifest = '<link rel="manifest" href="manifest.webmanifest">'
    if manifest not in text:
        text, ok = inject_before(text, "</head>", manifest)
        changed |= ok
    script = '<script src="assets/learning/learning-core.js"></script>'
    if script not in text:
        text, ok = inject_before(text, "</body>", script)
        changed |= ok
    if changed:
        path.write_text(text, encoding="utf-8")
    return changed


def process_session(path: Path) -> bool:
    m = re.search(r"sesion-(\d+)", path.name, re.I)
    if not m or int(m.group(1)) < 6:
        return False
    text = path.read_text(encoding="utf-8")
    if "learning-core.js" in text:
        return False
    src = relative_url(path, LEARNING)
    fragment = f'<script src="{src}"></script>'
    text, changed = inject_before(text, "</body>", fragment)
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
