# Seguridad integral del proyecto ANDESDB

Estado: baseline obligatorio para la rama `piloto-lms-sdd-secure`.
Fecha de referencia: 2026-08-30.

## Alcance

La seguridad aplica al **proyecto completo**, no solo al LMS ni a Supabase. Quedan dentro del alcance:

- HTML/CSS/JavaScript del curso y del piloto;
- scripts Python y SQL;
- GitHub Actions y permisos del `GITHUB_TOKEN`;
- dependencias y binarios vendorizados (sql.js, DuckDB-Wasm, etc.);
- secretos, credenciales y archivos de datos;
- Supabase Auth/PostgreSQL/RLS/RPC;
- hosting, CSP, cabeceras, redirects y dominios;
- backups, retención y respuesta a incidentes;
- proceso SDD y evidencia de verificación.

## Baseline normativo y de buenas prácticas

No se declara certificación automática. El proyecto se diseña y verifica contra los controles **aplicables** de:

1. **NIST SP 800-218 SSDF 1.1** como baseline final de desarrollo seguro. La revisión 1.2 se monitorea mientras permanezca en borrador.
2. **NIST Cybersecurity Framework 2.0** para gobierno, identificación, protección, detección, respuesta y recuperación.
3. **OWASP ASVS 5.0.0**, objetivo mínimo **Level 2** para el LMS autenticado y sus APIs/RPC; cualquier excepción debe quedar documentada.
4. **OWASP Top 10 2025** para riesgos de aplicaciones web.
5. **OWASP API Security Top 10 2023** para REST/RPC y autorización por objeto/función.
6. **OpenSSF Scorecard** para salud de supply chain del repositorio.
7. Principios **SLSA** cuando exista un artefacto de build/release que requiera procedencia reproducible y verificable.

SDD es el proceso de construcción del proyecto; estos marcos son requisitos/controles que el SDD debe convertir en especificaciones, tareas y pruebas.

## Reglas no negociables

### Credenciales y secretos

- Cero contraseñas, connection strings con password, private keys, `service_role`, `sb_secret_*`, OAuth client secrets, SMTP passwords o tokens en Git.
- Una publishable key de Supabase puede estar en cliente únicamente porque es pública por diseño; **RLS y grants siguen siendo obligatorios**.
- Si un secreto entra a Git, eliminar el archivo no basta: **rotar/revocar**, revisar logs/uso y tratarlo como incidente.
- Los ejemplos de conexión usan placeholders (`DB_HOST`, `DB_USER`, `DB_PASSWORD`) y nunca credenciales reales.

### Autenticación y autorización

- Identidad != matrícula != autorización.
- `deny by default`.
- RLS en toda tabla académica expuesta.
- El cliente no puede elegir `user_id`, `enrollment_id`, rol, timestamps ni revisiones de servidor para operaciones privilegiadas.
- Escrituras críticas se realizan mediante RPC que deriva identidad desde `auth.uid()`.
- Roles privilegiados no se basan en metadata editable por usuario.
- MFA es obligatorio para teacher/admin antes de una promoción a producción.

### Navegador

- `script-src 'self'`; no `unsafe-inline` para scripts del LMS.
- `object-src 'none'`, `base-uri 'self'`/`'none'`, `form-action 'self'` y `frame-ancestors` restrictivo.
- Datos de estudiante se insertan con `textContent`; no se interpretan con `innerHTML`.
- No `eval`, `new Function`, `document.write` ni ejecución de código derivado de input.
- Tokens de sesión no se copian a logs, URLs ni almacenamiento persistente innecesario.
- El laboratorio interactivo que contenga código heredado se debe ejecutar en **origen separado** del shell autenticado antes de usuarios reales.

### Base de datos/API

- Validación de tipo, longitud, rango y tamaño en servidor.
- Payload de estado limitado; autosave con control optimista de concurrencia.
- Entrega = snapshot inmutable; borrador mutable != entrega.
- Consultas y RPC deben resistir IDOR/BOLA y escalada horizontal/vertical.
- `SECURITY DEFINER` solo con `search_path` fijo, privilegios mínimos y pruebas negativas.

### Supply chain

- GitHub Actions de terceros fijadas a **commit SHA completo**.
- Workflows con permisos mínimos; no `write-all`.
- Prohibido `pull_request_target` salvo revisión de amenaza específica y aprobación explícita.
- Dependencias nuevas requieren fuente, versión, motivo y revisión de vulnerabilidades.
- Binarios/artefactos descargados deben tener versión fija y verificación de integridad antes de producción.
- OpenSSF Scorecard, CodeQL y dependency review forman parte del gate de promoción.

### CI/CD y repositorio

- Cambios de seguridad, auth, SQL/RLS, workflows, `SECURITY.md`, `supabase/**` y `assets/lms/**` requieren revisión del CODEOWNER cuando la protección de rama esté activa.
- `main` y la rama de piloto deben tener ruleset/branch protection antes del piloto humano.
- No se permite bypass de checks para una release con datos reales.
- La cuenta/credencial usada por CI debe tener el mínimo privilegio necesario y ser rotatable.

### Datos y privacidad

- Minimización: no almacenar PII que el flujo pedagógico no necesita.
- Datos reales nunca se usan como fixtures públicos.
- Definir retención, borrado, exportación y responsable antes de participantes reales.
- Backups deben probarse mediante restauración; “tener backup” sin restore test no es evidencia suficiente.

## Gates de seguridad del proyecto

### G-S0 · Repositorio

- [ ] `python tools/security_gate.py` pasa.
- [ ] no hay secretos activos en archivos ni historial reciente revisado.
- [ ] Actions externas fijadas por SHA.
- [ ] branch protection/ruleset activo.

### G-S1 · Aplicación

- [ ] ASVS 5.0 L2 aplicable mapeado y verificado.
- [ ] CSP/cabeceras verificadas desde el deployment, no solo en el HTML fuente.
- [ ] XSS, IDOR/BOLA, escalada de rol y session expiry probados.
- [ ] laboratorio heredado aislado del origen autenticado.

### G-S2 · Datos/API

- [ ] RLS Security Advisor sin hallazgos críticos/altos abiertos.
- [ ] matriz A/B/teacher A/teacher B/no-enrollment pasa 100%.
- [ ] no existen escrituras directas del cliente a tablas críticas cuando existe RPC endurecido.
- [ ] restore de backup probado.

### G-S3 · Supply chain

- [ ] CodeQL sin Critical/High abiertos.
- [ ] Dependency Review sin dependencia vulnerable High/Critical introducida.
- [ ] OpenSSF Scorecard revisado; hallazgos relevantes documentados/remediados.
- [ ] integridad de binarios vendorizados verificada.

### G-S4 · Piloto humano

- [ ] aviso de privacidad y responsable definidos.
- [ ] kill switch probado.
- [ ] MFA teacher/admin.
- [ ] sin secretos pendientes de rotación.
- [ ] decisión GO documentada en `specs/001-lms-pilot/verify.md`.

## Severidad

- **Critical**: secreto privilegiado activo público, bypass total de autorización, RCE, exposición masiva. Detener/revocar inmediatamente.
- **High**: cross-user read/write, escalada a teacher/admin, XSS almacenado con impacto en docente, takeover de sesión. Bloquea piloto.
- **Medium**: hardening incompleto con impacto limitado. Corregir antes de ampliar usuarios.
- **Low**: deuda sin bypass demostrado. Registrar y programar.

No se promueve con Critical/High abierto.
