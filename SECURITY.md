# Security Policy · ANDESDB

## Alcance actual

La rama `piloto-lms-sdd-secure` contiene una prueba experimental de identidad y persistencia de actividades desarrollada bajo la constitución SDD del repositorio. No debe manejar datos reales de estudiantes hasta completar los gates de `specs/001-lms-pilot/checklists/requirements.md`.

## Reporte responsable

No publicar en Issues:

- credenciales;
- tokens;
- datos de estudiantes;
- pasos de explotación que incluyan información privada real.

Para una vulnerabilidad reproducible, registrar primero el hallazgo de forma privada con el responsable del repositorio y solo crear un issue sanitizado cuando ya no contenga secretos ni datos personales.

## Severidad de bloqueo

- **Critical:** exposición masiva, secret/service key filtrada, bypass total de autorización, RCE. Detener piloto inmediatamente.
- **High:** lectura/escritura cross-user, escalada student→teacher/admin, XSS almacenado en vista docente, takeover de sesión por defecto de la aplicación. No desplegar.
- **Medium:** controles incompletos sin bypass demostrado, DoS limitado, información técnica excesiva. Corregir antes de ampliar cohorte.
- **Low:** hardening o información de bajo impacto. Registrar y programar.

No se acepta ningún Critical/High abierto para un piloto con estudiantes reales.

## Secretos y API keys

El frontend puede contener únicamente una **Supabase publishable key** (`sb_publishable_...`), que es pública por diseño y sigue sometida a RLS.

Prohibido versionar o enviar al navegador:

- Supabase `sb_secret_...`;
- legacy `service_role`;
- JWT signing secrets;
- OAuth client secrets;
- SMTP passwords;
- tokens Snyk/GitHub/Cloudflare;
- credenciales de base de datos.

La publishable key no sustituye la autorización. La seguridad de datos se basa en JWT de usuario + grants + RLS/RPC.

Si un secreto entra al historial, borrarlo del archivo NO es suficiente: debe revocarse/rotarse.

## Datos de estudiantes

Se aplica minimización. No usar producción para pruebas. No copiar estados reales a fixtures, Issues, logs o artefactos de CI.

El piloto no autoriza almacenar cédula, teléfono, dirección ni datos ajenos a identidad académica mínima, progreso, estado, entrega y feedback.

## Dependencias y CI

- CodeQL activo en la rama piloto;
- guards de secretos activos;
- Actions críticas fijadas por commit SHA;
- workflows con `permissions` mínimos;
- runtime del piloto sin paquetes npm/CDN adicionales;
- Snyk se incorpora cuando exista token y/o se añadan dependencias que justifiquen ese gate.

## Respuesta a incidente

1. cambiar `assets/lms/config.js` a `enabled: false` o retirar el deployment del piloto;
2. revocar sesiones y secretos afectados;
3. deshabilitar matrículas comprometidas si aplica;
4. evaluar alcance;
5. corregir en rama aislada;
6. añadir prueba de regresión;
7. documentar causa raíz;
8. reabrir solo tras repetir pruebas de autorización, XSS, restauración y CI.

## Evidencia de seguridad

La especificación, análisis y pruebas del piloto viven en:

- `.specify/memory/constitution.md`;
- `specs/001-lms-pilot/`;
- `docs/piloto-lms/THREAT-MODEL.md`;
- `docs/piloto-lms/PRUEBAS-ADVERSARIALES.md`;
- `supabase/tests/rls-adversarial.sql`.
