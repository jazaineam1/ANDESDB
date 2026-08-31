from pathlib import Path

p = Path('Presentaciones/M3/sesion-9-ddl-supabase.html')
text = p.read_text(encoding='utf-8')

# Corrige el manejador de las preguntas rápidas sin tocar su texto de explicación.
bad = "document.querySelectorAll('.q').forEach(q=>{q.querySelectorAll('.opts button').forEach((b,idx)=>b.onclick=()=>{q.classList.add('ok');q.querySelectorAll('.opts button').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');const f=q.querySelector('.fb');if(f){const ans=q.dataset.answer;const letras=['a','b','c','d'];const good=ans===letras[idx];f.style.display='block';f.textContent=(good?'✓ Correcto. ':'Revisa: ')+f.dataset.explain||f.textContent}})});"
good = "document.querySelectorAll('.q').forEach(q=>{q.querySelectorAll('.opts button').forEach(b=>b.onclick=()=>{q.classList.add('ok');q.querySelectorAll('.opts button').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')})});"
if bad in text:
    text = text.replace(bad, good)
p.write_text(text, encoding='utf-8')

# Contrato funcional que S9 debe compartir con S5.
checks = {
    'sin botón Práctica externo': 'learning-core.js' not in text and 'andes-practice-btn' not in text,
    'contador': 'id="count"' in text,
    'anterior': 'id="prev"' in text,
    'siguiente': 'id="next"' in text,
    'temporizador': 'id="timeBtn"' in text and 'id="timeOv"' in text,
    'presets temporizador': 'data-min="1"' in text and 'data-min="15"' in text,
    'minutos libres': 'id="minLibre"' in text and 'id="ponLibre"' in text,
    'pausa y reinicio': 'id="pause"' in text and 'id="reset"' in text,
    'mini temporizador': 'id="mini"' in text and 'id="miniPP"' in text,
    'pantalla completa': 'id="fullBtn"' in text,
    'descarga': 'id="dlBtn"' in text,
    'barra de progreso': 'id="bar"' in text,
    'teclado': "e.key.toLowerCase()==='t'" in text and "e.key.toLowerCase()==='f'" in text,
    'swipe táctil': "touchstart" in text and "touchend" in text,
    'botón copiar': 'copybtn' in text,
    'pausa 15 minutos': 'data-break="15"' in text and 'data-start-break' in text,
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(('✓' if ok else '✗'), name)
if failed:
    raise SystemExit('Faltan controles: ' + ', '.join(failed))
print('S9: contrato funcional verificado')
