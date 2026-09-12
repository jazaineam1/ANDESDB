# Instrucciones para agentes IA · ANDESDB

Antes de modificar o publicar este repositorio, lee y cumple:

- `docs/VALIDACION-IA-PRE-PUSH.md`
- `docs/METODOLOGIA-S6-S16.md`
- `.gitignore`

## Regla obligatoria antes de push

Ejecuta desde la raíz:

```bash
python tools/pre_push_check.py
```

No hagas push si el resultado no es:

```text
PRE-PUSH ANDESDB: OK
```

## Reglas críticas

- `tools/curso.json` es la fuente de verdad del recorrido; `index.html` es generado.
- `assets/learning/learning-plan.json` define la experiencia pedagógica S6–S16.
- No subas datos personales, encuestas, credenciales, secretos ni material docente privado.
- No publiques S7/S10/S13 en texto plano antes de las 20:00 `America/Bogota`.
- No reintroduzcas progreso personal persistente ni `localStorage` como expediente de avance.
- S6 no lleva Ruta/Núcleo/Reto.
- Diferenciación técnica principalmente en S9, S11, S12, S13, S14 y S15.
- Los servicios cloud reales son obligatorios donde el plan los declara; el fallback local no los reemplaza.
- No muestres banners/modales para instalar la PWA.
- El material heredado puede permanecer en GitHub, pero no debe enlazarse como material vigente hasta reconstruirlo.

## Después del push

No declares la tarea terminada hasta verificar los Actions activados, el HEAD final de `main` y GitHub Pages cuando aplique. Algunos workflows hacen commits automáticos; vuelve a leer `main` después de que terminen.
