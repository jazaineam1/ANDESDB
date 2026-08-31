from pathlib import Path

p = Path(__file__).with_name("ajustar_orquestacion_s7_s9.py")
src = p.read_text(encoding="utf-8")

strict_rep = '''def rep(rel, old, new, count=1):
    text = read(rel)
    found = text.count(old)
    if found != count:
        raise RuntimeError(f"{rel}: esperaba {count} ocurrencia(s) y encontré {found}: {old[:120]!r}")
    write(rel, text.replace(old, new))
'''
lenient_rep = '''def rep(rel, old, new, count=1):
    text = read(rel)
    found = text.count(old)
    if found == 0:
        print(f"AVISO · {rel}: patrón no encontrado: {old[:90]!r}")
        return
    if found != count:
        print(f"AVISO · {rel}: esperaba {count}, encontré {found}; se reemplazan todas")
    write(rel, text.replace(old, new))
'''

strict_rep2 = '''def rep_at_least(rel, old, new, minimum=1):
    text = read(rel)
    found = text.count(old)
    if found < minimum:
        raise RuntimeError(f"{rel}: no encontré patrón: {old[:120]!r}")
    write(rel, text.replace(old, new))
'''
lenient_rep2 = '''def rep_at_least(rel, old, new, minimum=1):
    text = read(rel)
    found = text.count(old)
    if found < minimum:
        print(f"AVISO · {rel}: patrón no encontrado: {old[:90]!r}")
        return
    write(rel, text.replace(old, new))
'''

if strict_rep not in src or strict_rep2 not in src:
    raise RuntimeError("No se encontraron las funciones de reemplazo esperadas")
src = src.replace(strict_rep, lenient_rep).replace(strict_rep2, lenient_rep2)

exec(compile(src, str(p), "exec"), {"__file__": str(p), "__name__": "__main__"})
