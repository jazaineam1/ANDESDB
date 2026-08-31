from pathlib import Path

p = Path('Presentaciones/M3/constructor-abc.html')
s = p.read_text(encoding='utf-8')
old = "'<b>se puede calcular siempre</b>. Guardarlo además es guardar el mismo dato dos '+"
new = "'<b>en este modelo se puede reconstruir exactamente</b> con <code>cantidad</code> y <code>precio_unitario</code>. Guardarlo además es guardar el mismo dato dos '+"
if s.count(old) != 1:
    raise SystemExit(f'Esperaba una ocurrencia y encontré {s.count(old)}')
p.write_text(s.replace(old, new), encoding='utf-8')
print('OK · lente S8 alineada')
