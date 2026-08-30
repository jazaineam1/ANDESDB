# Security Policy · ANDESDB

## Alcance

La seguridad cubre **todo el proyecto ANDESDB**, no solo el piloto LMS:

- material HTML/JS/SQL/Python;
- GitHub Actions y supply chain;
- dependencias/binarios vendorizados;
- secretos y credenciales;
- hosting/CSP/orígenes;
- Supabase Auth/PostgreSQL/RLS/RPC;
- datos, backups, privacidad y respuesta a incidentes.

La rama `piloto-lms-sdd-secure` aplica el baseline de `docs/SEGURIDAD-PROYECTO.md` y la constitución SDD. No debe manejar datos reales de estudiantes hasta completar los gates y la verificación.

## Reporte responsable

No publicar en Issues:

- credenciales o connection strings;
- tokens;
- datos de estudiantes;
- OTP/sesiones;
- pasos de explotación que incluyan información privada real.

Un hallazgo con información sensible se reporta por canal privado al responsable del repositorio. Un issue público solo contiene una versión sanitizada.

## Severidad de bloqueo

- **Critical:** secreto privilegiado activo público, exposición masiva, bypass total de autorización, RCE. Detener piloto y rotar/revocar inmediatamente.
- **High:** lectura/escritura cross-user, escalada student→teacher/admin, XSS almacenado con impacto docente, takeover de sesión. No desplegar.
- **Medium:** controles incompletos con impacto limitado. Corregir antes de ampliar cohorte.
- **Low:** hardening sin bypass demostrado. Registrar y programar.

No se acepta ningún Critical/High abierto para un piloto humano.

## Secretos y API keys

El frontend puede contener únicamente una **Supabase publishable key** (`sb_publishable_...`), pública por diseño y sometida a JWT + grants + RLS/RPC.

Prohibido versionar o enviar al navegador:

- passwords/connection strings con password;
- Supabase `sb_secret_...`;
- legacy `service_role`;
- JWT signing secrets;
- OAuth client secrets;
- SMTP passwords;
- tokens Snyk/GitHub/Cloudflare/AWS;
- claves privadas.

Si un secreto entra a Git, borrarlo del archivo NO es suficiente: debe revocarse/rotarse y evaluarse su uso.

### Incidente detectado durante el hardening

Durante la revisión del 30-08-2026 se encontró una credencial de base de datos en texto plano dentro de material versionado. El archivo fue retirado del árbol activo de la rama piloto. **La credencial se considera comprometida hasta que el proveedor confirme su rotación/revocación.** Su valor no debe copiarse a documentación, Issues ni logs.

La limpieza del historial/default branch, si procede, se hará como operación controlada después de rotar; reescribir Git no sustituye la rotación.

## Autenticación y autorización

- autenticación != matrícula != autorización;
- deny-by-default;
- RLS en tablas académicas expuestas;
- escritura crítica mediante RPC que deriva identidad desde `auth.uid()`;
- roles no editables por el estudiante;
- MFA obligatorio para teacher/admin antes de producción;
- laboratorio S7 en origen separado del shell autenticado.

## Frontend

- `script-src 'self'` para el LMS;
- no `eval`, `new Function`, `document.write` ni HTML interpretado desde datos del estudiante;
- vistas docentes usan nodos/texto, no sinks HTML;
- `postMessage` valida origen y ventana exactos;
- no tokens en URL/logs;
- CSP del deployment se verifica además del meta-CSP de desarrollo.

## Supply chain y CI

- Actions externas fijadas por SHA completo;
- CodeQL;
- Dependency Review;
- OpenSSF Scorecard;
- `tools/security_gate.py`;
- workflows con permisos mínimos;
- dependencias vendorizadas desde versiones exactas y con integridad registrada;
- Snyk puede añadirse como segunda opinión cuando exista token/configuración, pero no se simula cobertura inexistente.

## Datos de estudiantes

Aplicar minimización. No usar datos reales como fixtures públicos ni copiarlos a Issues, logs o artifacts. El piloto no necesita cédula, teléfono ni dirección.

Antes de usuarios reales deben existir aviso/base de tratamiento, retención, borrado/exportación y restore test de backups.

## Respuesta a incidente

1. deshabilitar deployment/feature del piloto;
2. revocar sesiones y secretos afectados;
3. deshabilitar matrículas comprometidas si aplica;
4. evaluar alcance y preservar evidencia mínima;
5. corregir en rama aislada;
6. añadir prueba de regresión;
7. actualizar threat model/spec si cambió una frontera;
8. reabrir solo tras repetir gates de seguridad y recuperación.

## Evidencia

- `docs/SEGURIDAD-PROYECTO.md`;
- `.specify/memory/constitution.md`;
- `specs/001-lms-pilot/`;
- `specs/002-project-security/`;
- `docs/piloto-lms/THREAT-MODEL.md`;
- `docs/piloto-lms/PRUEBAS-ADVERSARIALES.md`;
- `supabase/tests/rls-adversarial.sql`;
- `.github/workflows/security-pilot.yml`;
- `.github/workflows/dependency-review.yml`;
- `.github/workflows/scorecard.yml`.
