# Threat model · Piloto LMS ANDESDB

## Alcance

Protege el flujo:

`login -> matrícula -> abrir S7 -> autosave -> continuar -> entregar -> revisar`

Activos principales:

1. identidad del estudiante;
2. estado de sus actividades;
3. entregas;
4. feedback docente;
5. roles y matrículas;
6. secretos de infraestructura;
7. disponibilidad del piloto.

## Fronteras de confianza

```text
[ navegador estudiante ]
        |  NO confiable
        v
[ hosting estático ]
        |
        | HTTPS
        v
[ Supabase Auth/API ]
        |
        v
[ PostgreSQL + RLS ]

[ navegador docente ] ---- misma API, privilegios distintos

[ GitHub Actions ] ---- frontera privilegiada separada
```

Todo valor enviado por navegador se considera manipulable: `user_id`, `enrollment_id`, `activity_id`, rol, progreso, JSON, timestamps y parámetros de URL.

## STRIDE

### S · Spoofing

**Amenazas**

- robo de sesión del estudiante;
- OAuth redirect mal configurado;
- cuenta falsa autoinscrita;
- docente suplantado.

**Controles**

- OAuth/OIDC; no password store propio;
- allowlist exacta de redirects;
- matrícula separada de autenticación;
- MFA para teacher/admin antes de producción;
- no guardar tokens en logs;
- HTTPS únicamente.

**Prueba**

- usuario autenticado pero no matriculado recibe acceso denegado;
- redirect no registrado falla;
- cuenta student no puede asumir role teacher.

### T · Tampering

**Amenazas**

- cambiar el estado de otro alumno variando UUID;
- alterar porcentaje para aparecer completado;
- modificar una entrega después de enviarla;
- cambiar `role` o `enrollment` desde DevTools;
- sobrescribir un autosave nuevo desde una pestaña antigua.

**Controles**

- RLS con ownership;
- roles no editables por estudiantes;
- submissions sin UPDATE/DELETE de student;
- constraints de rango/tamaño;
- revisión de servidor para autosave;
- progreso derivable de criterios y no usado como prueba de autorización.

**Prueba**

- student A usa IDs de B en GET/POST/PATCH/DELETE: todos denegados;
- modificar payload `user_id=B`: no crea ni actualiza datos;
- PATCH sobre submission propia: denegado.

### R · Repudiation

**Amenazas**

- disputa de si se entregó o cuándo;
- docente modifica feedback sin trazabilidad mínima.

**Controles**

- `submitted_at` generado por servidor;
- snapshot inmutable;
- timestamps de servidor;
- para piloto, feedback conserva `teacher_id` y timestamps.

**Fuera de alcance inicial**

- ledger criptográfico;
- auditoría legal completa.

### I · Information Disclosure

**Amenazas**

- enumeración de perfiles;
- IDOR/BOLA;
- estado de estudiante filtrado en logs;
- secretos en repo/bundle;
- respuestas correctas ocultas solo por CSS/JS.

**Controles**

- RLS;
- mínimos GRANT;
- `anon` sin acceso académico;
- service role prohibido en frontend;
- logging sin payload;
- soluciones privilegiadas fuera de HTML si realmente deben protegerse;
- secret scanning.

**Prueba**

- student A no puede SELECT de B ni por relación indirecta;
- inspeccionar JS/build no revela secreto privilegiado;
- artifact/log de CI no contiene `.env`.

### D · Denial of Service

**Amenazas**

- autosave por cada tecla;
- payload JSON enorme;
- spam de login;
- envío repetido de entregas;
- consultas costosas del dashboard.

**Controles**

- debounce 800-1500 ms;
- límite de JSON <= 512 KiB por estado en piloto;
- límites del proveedor Auth;
- attempt count y límites de aplicación;
- índices en FKs/consultas de RLS;
- cohorte pequeña y kill switch.

**Prueba**

- payload > límite rechazado;
- simulación de 40 estudiantes guardando en paralelo;
- dashboard no ejecuta N+1 requests por estudiante.

### E · Elevation of Privilege

**Amenazas**

- cambiar `role=teacher`;
- editar metadata del perfil;
- abusar de función `SECURITY DEFINER`;
- filtrar service role;
- teacher accede a cohorte no asignada.

**Controles**

- rol separado y sin write grant;
- funciones SECURITY DEFINER mínimas, `search_path` fijo y `EXECUTE` explícito;
- service role solo servidor;
- política por cohorte para teacher en versión antes de producción;
- no confiar en claims editables por usuario.

**Prueba**

- INSERT/UPDATE a `user_roles` como student falla;
- llamada a funciones auxiliares con IDs arbitrarios no filtra datos;
- teacher de cohorte A no puede ver cohorte B.

## Amenazas web específicas

### XSS almacenado

El estado de S7 contiene texto controlado por estudiante. Si posteriormente se pinta con `innerHTML`, un payload podría ejecutarse en la sesión de docente.

**Regla:** todo texto de usuario usa `textContent`. Rich text queda fuera del piloto.

Caso de prueba:

```text
<img src=x onerror=alert(document.domain)>
```

Debe mostrarse literalmente y nunca ejecutar código.

### IDOR / BOLA

Es la amenaza prioritaria del piloto porque el frontend conoce UUIDs.

Caso:

1. A guarda actividad;
2. B obtiene o adivina el `activity_state.id`/`enrollment_id` de A;
3. B modifica manualmente la petición.

Resultado obligatorio: 0 filas visibles/modificadas.

### CSRF

Con bearer tokens del SDK y no cookies de sesión de aplicación, el riesgo cambia frente a un backend clásico. Aun así, ninguna operación sensible debe depender solo de origen visual. Si en el futuro se introducen cookies propias, se reabre este threat model y se exige defensa CSRF explícita.

### Supply-chain

- SDK comprometido;
- Action comprometida;
- dependencia vulnerable;
- CDN sustituida.

Mitigación: bundle local, lockfile, revisión de updates, CodeQL/Snyk, SHA pin de Actions antes de producción.

## Riesgos aceptados en piloto

| Riesgo | Decisión |
|---|---|
| Sin offline conflict merge | aceptar; mostrar conflicto y no sobrescribir |
| Sin auditoría legal completa | aceptar; no es sistema oficial de notas |
| Hosting piloto separado | obligatorio |
| Google/Microsoft dependencia externa | aceptar |
| `style-src 'unsafe-inline'` temporal | aceptar solo si no se habilita `script-src 'unsafe-inline'`; registrar deuda |

## Kill switch

Ante fuga, XSS, error RLS o secreto filtrado:

1. deshabilitar acceso al deployment piloto;
2. revocar sesiones/secretos afectados;
3. pausar o bloquear API del proyecto si aplica;
4. preservar solo logs técnicos necesarios;
5. corregir en rama;
6. añadir test de regresión;
7. documentar causa raíz antes de reabrir.

El sitio principal de ANDESDB debe seguir operativo porque el piloto vive en otra rama y otro deployment.