from pathlib import Path

p = Path(__file__).with_name("ajustar_orquestacion_s7_s9.py")
src = p.read_text(encoding="utf-8")

# Quita una comprobación no-op que era demasiado genérica y podía aparecer
# varias veces en el HTML. No cambia ningún contenido del curso.
noop = '''rep(
    c,
    "      '</div></div>');\\n    var cu = $('.cuerpo', card);",
    "      '</div></div>');\\n    var cu = $('.cuerpo', card);",
    count=1
)
'''
if noop not in src:
    raise RuntimeError("No se encontró la comprobación no-op esperada")
src = src.replace(noop, "")

exec(compile(src, str(p), "exec"), {"__file__": str(p), "__name__": "__main__"})
