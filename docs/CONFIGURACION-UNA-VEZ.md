# Configuración de una sola vez · ANDESDB

La mayor parte de la experiencia se versiona y automatiza desde el repositorio. Hay dos ajustes que viven en la configuración de GitHub y no pueden activarse desde los archivos del proyecto.

## 1. Proteger `main`

Ruta: `Settings → Rules → Rulesets → New branch ruleset`.

Configuración recomendada:

- Nombre: `Proteger main`
- Enforcement status: `Active`
- Target branches: incluir `main`
- Bloquear force pushes
- Bloquear eliminación de la rama
- Requerir pull request antes de merge para cambios humanos
- Requerir status checks
- Status check requerido: `Course QA`
- Permitir que GitHub Actions haga los commits automáticos de sincronización/publicación que ya usa el curso

Objetivo: un cambio de contenido no debería poder romper la página pública sin que el control de calidad lo detecte primero.

## 2. Secret para soluciones de las sesiones autónomas

Ruta: `Settings → Secrets and variables → Actions → New repository secret`.

- Nombre: `SOLUTIONS_PASSPHRASE`
- Valor: frase aleatoria larga y exclusiva de este repositorio

El secret solo se usa para descifrar S7, S10 y S13 cuando llega la hora de publicación definida en `assets/learning/learning-plan.json`.

## Verificación

Después de configurar lo anterior:

1. abre `Actions → Validar curso` y ejecuta el workflow;
2. comprueba que `Course QA` queda verde;
3. abre `Settings → Rules → Rulesets` y verifica que `Proteger main` esté activo;
4. antes de S7 prepara `soluciones_cifradas/S7.sql.enc` siguiendo `soluciones_cifradas/README.md`.
