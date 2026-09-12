# ANDESDB · instrucciones para Claude

El contrato canónico para cualquier cambio está en:

`docs/VALIDACION-IA-PRE-PUSH.md`

Antes de hacer push ejecuta obligatoriamente:

```bash
python tools/pre_push_check.py
```

No publiques si no termina con `PRE-PUSH ANDESDB: OK`.

Respeta además `AGENTS.md`, `docs/METODOLOGIA-S6-S16.md` y `.gitignore`.

Después del push revisa los Actions activados, actualiza el HEAD final si algún workflow hizo un commit automático y verifica GitHub Pages cuando aplique. No declares éxito antes de esa comprobación.
