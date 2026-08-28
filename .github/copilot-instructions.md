# GitHub Copilot · reglas de trabajo para ANDESDB

Antes de proponer o publicar cambios, sigue el contrato canónico:

`docs/VALIDACION-IA-PRE-PUSH.md`

Antes de push ejecuta:

```bash
python tools/pre_push_check.py
```

El resultado obligatorio es `PRE-PUSH ANDESDB: OK`.

Puntos críticos:

- `tools/curso.json` gobierna el recorrido; no edites `index.html` como fuente de verdad.
- `assets/learning/learning-plan.json` gobierna la experiencia S6–S16.
- No publiques datos personales, secretos, respuestas privadas ni soluciones programadas antes de las 20:00.
- No reintroduzcas progreso persistente por dispositivo.
- S6 no lleva Ruta/Núcleo/Reto; la diferenciación técnica se reserva para prácticas donde aporta.
- Los servicios cloud reales no se sustituyen por fallbacks locales.
- No muestres sugerencias propias para instalar la PWA.
- El material heredado permanece en el repo, pero no se enlaza como material vigente hasta reconstruirlo.

Después del push verifica `Course QA`, cualquier Action que haya escrito en `main`, el HEAD final y GitHub Pages cuando aplique.
