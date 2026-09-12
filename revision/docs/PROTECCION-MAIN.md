# Proteger `main` · pendiente de activar

Estado actual, comprobado el 28 de agosto de 2026:

```
protected: false
rulesets : 0
```

Hoy la validación existe (`tools/pre_push_check.py` antes del push, `Course QA`
después), pero es **detección, no bloqueo**: un push directo llega a `main` y el
Action falla *después*. El paso siguiente es impedir físicamente que llegue.

Se decidió activarlo **después de la sesión 6** para no tocar la infraestructura
el día de una clase.

---

## El riesgo que hay que resolver primero

**Seis workflows escriben directamente en `main`:**

| Workflow | Qué publica |
|---|---|
| `sincronizar-sitio.yml` | `index.html` regenerado desde `tools/curso.json` |
| `publicar-soluciones.yml` | la solución de S7, S10 y S13 **a las 20:00 de Bogotá** |
| `ajustar-etiqueta-avance.yml` | la etiqueta de avance del curso |
| `integrar-lab-s6.yml` | la integración del laboratorio en la sesión 6 |
| `generar-iconos-pwa.yml` | los iconos de la PWA |
| `vendor-wasm.yml` | los binarios de DuckDB y sql.js |

Todos usan `contents: write` y empujan con el `GITHUB_TOKEN`, o sea que el autor
del push es la app `github-actions`.

**Un ruleset que bloquee el push directo los rompe todos** salvo que lleve una
excepción explícita para esa app. El más grave es `publicar-soluciones.yml`: si
falla, el grupo se queda sin la solución a las 20:00 y nadie se entera hasta que
alguien pregunta.

---

## Cómo activarlo

En `Settings → Rules → Rulesets → New branch ruleset`:

1. **Target:** `refs/heads/main`.
2. **Bypass list:** añadir la app **GitHub Actions** *antes* de guardar nada más.
   Sin esto, los seis workflows dejan de poder publicar.
3. **Rules:** `Require status checks to pass` → **Course QA**;
   `Block force pushes`; `Restrict deletions`.
4. Decidir aparte si además se exige *pull request*. Eso obliga a que cualquier
   cambio humano pase por PR, incluidas las correcciones de última hora antes de
   una clase. Con el curso en marcha, conviene dejarlo para el final.

---

## Verificar DESPUÉS de activarlo

No basta con que el ruleset se guarde sin error. Hay que comprobar que la
automatización sigue viva:

- [ ] Lanzar `sincronizar-sitio.yml` a mano (`Run workflow`) y confirmar que su
      push a `main` **no** queda rechazado.
- [ ] Lanzar `publicar-soluciones.yml` a mano con un número de sesión de prueba y
      confirmar lo mismo. Es el que no puede fallar.
- [ ] Intentar un push directo desde el equipo y confirmar que **sí** se rechaza.
- [ ] Volver a leer `main` y comprobar que el HEAD es el esperado.

Si alguno de los dos primeros falla, el problema es la lista de excepciones: se
quita el ruleset, se corrige el bypass y se repite. **No dejarlo a medias.**

---

## Lo que no está verificado

La semántica exacta con la que un ruleset trata los push del `GITHUB_TOKEN` no
se ha probado en este repositorio. Por eso la lista de arriba es de comprobación
empírica y no una receta que se pueda dar por buena sin ejecutarla.
