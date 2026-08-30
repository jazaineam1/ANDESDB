# Security Policy · ANDESDB

## Alcance actual

La rama `piloto-lms-secure-ssdf` contiene una prueba experimental de identidad y persistencia de actividades. No debe manejar datos reales de estudiantes hasta completar los gates de `docs/piloto-lms/README.md`.

## Reporte responsable

No publicar en Issues:

- credenciales;
- tokens;
- datos de estudiantes;
- pasos de explotación que incluyan información privada real.

Para una vulnerabilidad reproducible, registrar primero el hallazgo de forma privada con el responsable del repositorio y solo crear un issue sanitizado cuando ya no contenga secretos ni datos personales.

## Severidad de bloqueo

- **Critical:** exposición masiva, service role filtrado, bypass total de autorización, RCE. Detener piloto inmediatamente.
- **High:** lectura/escritura cross-user, escalada student->teacher/admin, XSS almacenado en vista docente, takeover de sesión por defecto de la aplicación. No desplegar.
- **Medium:** controles incompletos sin bypass demostrado, DoS limitado, información técnica excesiva. Corregir antes de ampliar cohorte.
- **Low:** hardening o información de bajo impacto. Registrar y programar.

No se acepta ningún Critical/High abierto para un piloto con estudiantes reales.

## Secretos

Prohibido versionar o enviar al navegador:

- Supabase `service_role`;
- JWT signing secrets;
- OAuth client secrets;
- SMTP passwords;
- tokens Snyk/GitHub/Cloudflare;
- credenciales de base de datos.

La publishable/anon key de Supabase no sustituye la autorización. La seguridad de los datos se basa en grants + RLS.

Si un secreto entra al historial, borrarlo del archivo NO es suficiente: debe revocarse/rotarse.

## Datos de estudiantes

Se aplica minimización. No usar producción para pruebas. No copiar estados reales a fixtures, Issues, logs o artefactos de CI.

## Dependencias y CI

Antes de producción:

- CodeQL activo;
- secret scanning activo;
- dependencias con lockfile;
- Snyk opcional como segunda capa si se configura token en GitHub Secrets;
- GitHub Actions de terceros fijadas por SHA cuando sea viable;
- workflows con `permissions` mínimos.

## Respuesta a incidente

1. deshabilitar deployment piloto;
2. revocar sesiones y secretos afectados;
3. evaluar alcance;
4. corregir en rama aislada;
5. añadir prueba de regresión;
6. documentar causa raíz;
7. reabrir solo tras repetir pruebas de autorización y seguridad.
