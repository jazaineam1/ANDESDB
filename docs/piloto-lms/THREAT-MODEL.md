# Threat model · Piloto LMS ANDESDB

## Alcance

Protege el flujo:

`email OTP -> matrícula -> S7 -> autosave -> continuar -> entregar -> revisar`

Activos principales:

1. identidad/sesión del participante;
2. estado de actividad;
3. entregas;
4. roles y matrículas;
5. asignaciones de cohorte docente;
6. secretos de infraestructura;
7. disponibilidad y recuperabilidad del piloto.

## Fronteras de confianza

```text
[ navegador estudiante/docente ]  NO confiable
              |
              | HTTPS
              v
[ frontend estático /pilot/ ]      público e inspeccionable
              |
              | publishable key + JWT usuario
              v
[ Supabase Auth + API ]
              |
              v
[ PostgreSQL + RLS + RPC ]         frontera de autorización

[ SQL Editor/Admin ]               frontera privilegiada separada
[ GitHub Actions ]                 frontera de supply chain
```

Todo valor del navegador es manipulable: `activity_id`, JSON, paso, revision, URL y llamadas REST. Los RPC sensibles no aceptan `user_id`, `role` ni `enrollment_id` para escritura.

## STRIDE

### S · Spoofing

**Amenazas**
- robo de access/refresh token por XSS;
- control del buzón de correo del participante;
- creación no autorizada de cuentas;
- suplantación de docente.

**Controles**
- OTP gestionado por Supabase Auth; ANDESDB no almacena contraseñas;
- cuentas precreadas y `create_user:false`;
- matrícula separada de autenticación;
- sesión en `sessionStorage`, no progreso en almacenamiento de sesión;
- CSP restrictiva y sin scripts CDN nuevos;
- HTTPS.

**Pruebas**
- autenticado sin matrícula obtiene 0 datos académicos;
- cuenta student no asume role teacher;
- OTP inválido/vencido no crea sesión.

### T · Tampering

**Amenazas**
- modificar estado ajeno variando UUID;
- inflar porcentaje/paso;
- sobrescribir una versión nueva desde otra pestaña;
- modificar submission;
- enviar snapshot distinto al estado guardado.

**Controles**
- RLS;
- `save_activity_state` deriva enrollment desde `auth.uid()`;
- porcentaje calculado por servidor;
- revisión esperada + bloqueo de fila;
- `submit_activity` copia el snapshot desde servidor;
- sin UPDATE/DELETE de submission para student.

**Pruebas**
- A usa IDs de B: 0 acceso;
- dos saves con misma revisión: uno debe recibir conflicto;
- PATCH/DELETE de submission: denegado.

### R · Repudiation

**Amenazas**
- disputa sobre si/cuándo se entregó;
- confusión entre borrador y entrega.

**Controles**
- `submitted_at` del servidor;
- `attempt_no`;
- snapshot separado e inmutable;
- `activity_version` persistida.

El piloto no ofrece auditoría legal completa ni firma digital.

### I · Information Disclosure

**Amenazas**
- enumeración de estudiantes;
- IDOR/BOLA;
- docente de otra cohorte;
- estado/tokens en logs;
- secret key en frontend/repositorio.

**Controles**
- RLS + mínimo GRANT;
- `anon` sin tablas académicas;
- docente ligado a `teacher_cohorts`;
- publishable key como única key en cliente;
- secret guards y CodeQL;
- no log de tokens/estado completo.

### D · Denial of Service

**Amenazas**
- autosave por cada tecla;
- JSON enorme;
- spam de OTP;
- submission loop;
- consultas docentes excesivas.

**Controles**
- debounce 800 ms;
- límite 512 KiB en DB/RPC;
- límites/rate limits del proveedor Auth;
- máximo 3 submissions iniciales;
- índices de RLS/dashboard;
- cohorte real inicial <=10;
- kill-switch por configuración/deployment.

### E · Elevation of Privilege

**Amenazas**
- `role=teacher` desde DevTools;
- autoenrollment;
- abuso de SECURITY DEFINER;
- docente accede a cohorte no asignada;
- secret key filtrada.

**Controles**
- roles/enrollments sin write grant de student;
- helpers SECURITY DEFINER mínimos con `search_path` fijo;
- EXECUTE explícito solo donde aplica;
- teacher RPC valida asignación;
- secret/service key prohibida en frontend.

## XSS almacenado

La vista docente es el objetivo de mayor impacto: contenido persistido por estudiante podría intentar ejecutar código con la sesión del profesor.

**Regla:** snapshots/identificadores del estudiante se presentan con `textContent`; no `innerHTML` ni `insertAdjacentHTML`.

Payload mínimo de prueba:

```text
<img src=x onerror=alert(document.domain)>
```

Debe verse como texto literal.

El constructor S7 heredado usa HTML interno para su propia UI. El host LMS persiste un `modelCode` compacto y no inyecta directamente texto arbitrario de estudiante en el DOM docente.

## IDOR / BOLA

Es la amenaza prioritaria del LMS.

Resultado obligatorio:
- Student A no puede leer/escribir B;
- Teacher A no puede leer cohorte B;
- conocer un UUID no concede nada;
- RPC de escritura deriva la identidad real desde `auth.uid()`.

## CSRF

El piloto usa bearer JWT, no una cookie propia enviada automáticamente a la API académica. CSRF clásico no es la amenaza dominante. Si se introduce un BFF/cookie HttpOnly en el futuro, esta sección debe reabrirse y definir SameSite/CSRF token/origin checks.

## Supply chain

Runtime nuevo del piloto:
- 0 npm packages;
- 0 SDK cargados desde CDN;
- scripts propios del mismo origen.

CI:
- Actions críticas por commit SHA;
- CodeQL;
- secret guards;
- sintaxis JS;
- CSP/frontera de render docente.

Si se incorpora una dependencia, se exige versión fija/lockfile y revisión de vulnerabilidades antes de merge.

## Riesgos residuales aceptados

| Riesgo | Tratamiento de piloto |
|---|---|
| JWT legible por JS | aceptar temporalmente; CSP + mínimo JS + sessionStorage; reevaluar BFF para producción |
| Sin merge offline complejo | aceptar; detener autosave ante conflicto |
| Dependencia de correo/Supabase | aceptar; no es sistema oficial de notas |
| Sin auditoría legal completa | aceptar |
| `localStorage` heredado de S7 | solo recuperación local; servidor prevalece en host LMS |
| CSP connect-src wildcard durante preparación | reemplazar por origen exacto antes del piloto real |

## Kill switch

Ante fuga, XSS, error RLS o secreto filtrado:

1. `enabled:false` y/o retirar deployment piloto;
2. revocar sesiones/claves afectadas;
3. deshabilitar matrículas afectadas;
4. preservar evidencia mínima;
5. corregir en rama;
6. añadir prueba de regresión;
7. repetir matriz adversarial y restore drill antes de reabrir.

`main` y el curso público no dependen de Supabase y deben seguir operativos.
