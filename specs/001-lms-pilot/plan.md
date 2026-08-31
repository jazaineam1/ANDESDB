# Plan técnico · Spec 001

Estado: **IMPLEMENTACIÓN COMPLETA EN REPOSITORIO · VERIFY EXTERNO PENDIENTE**

## Decisión arquitectónica

Frontend existente de ANDESDB + Supabase como backend gestionado para Auth/PostgreSQL/API/RLS.

El piloto mantiene el sitio estático y evita un servidor propio. No incorpora `supabase-js`: usa `fetch` nativo contra Auth y PostgREST/RPC para reducir dependencias runtime.

## Principios

- conservar el frontend actual;
- introducir persistencia reusable sin reescribir talleres;
- RLS como frontera de aislamiento de filas;
- RPC server-side para operaciones donde el cliente no debe elegir identidad/revisión/snapshot;
- no confiar en IDs, roles, timestamps ni porcentajes suministrados por cliente;
- separar estado mutable de entrega inmutable;
- usar solo publishable key en navegador;
- conflictos multi-dispositivo explícitos, sin last-write-wins silencioso;
- `main` no participa del piloto.

## Componentes implementados

### 1. Auth

`assets/lms/auth-client.js`

- email OTP;
- `create_user:false`;
- sesión en `sessionStorage`;
- refresh de token;
- logout;
- publishable key únicamente;
- errores de solicitud OTP mostrados de forma genérica para reducir enumeración.

La cuenta y matrícula se crean administrativamente.

### 2. Persistencia académica

Migraciones:

- `001_lms_pilot`: tablas, índices, triggers, RLS y grants base;
- `002_lms_pilot_hardening`: roles/cohortes, campos de servidor y grants por columna;
- `003_lms_pilot_rpc`: autosave atómico, control de revisión, submission, dashboards;
- `004_lms_pilot_catalog`: curso/cohorte/S7 y lecturas seguras.

### 3. Cliente LMS

`assets/lms/lms-client.js`

Responsabilidades:
- llamar RPC con JWT de usuario + publishable key;
- dashboard propio;
- resolver actividad por slug/versión;
- cargar/guardar estado;
- entregar;
- consultar cohortes/progreso/submission docente.

No decide autorización final.

### 4. Adaptador S7

No se modifica la semántica del constructor. `pilot/s7.html` abre `constructor-abc.html` same-origin y `assets/lms/s7-host.js` usa las funciones existentes:

```text
exportar() -> modelCode
importar(modelCode) -> hidratar
S.paso -> current_step
```

Estado v1:

```json
{
  "schema": 1,
  "activity": "s7-restaurante-abc",
  "case": "abc",
  "modelCode": "...",
  "step": 4
}
```

### 5. Autosave

- debounce: 800 ms;
- servidor deriva enrollment desde `auth.uid()`;
- `SELECT ... FOR UPDATE` + revisión esperada;
- conflicto SQLSTATE `40001`;
- conflicto detiene autosave;
- estudiante puede copiar su código local antes de recargar versión remota;
- indicador Guardando/Guardado/Error/Conflicto.

### 6. Entrega

`submit_activity(activity_id, expected_revision)`:

- valida usuario/matrícula/actividad;
- bloquea estado actual;
- valida revisión;
- copia el snapshot desde PostgreSQL;
- máximo inicial 3 intentos;
- estudiante no tiene UPDATE/DELETE sobre submission.

### 7. Portal estudiante

`pilot/index.html`:

- login OTP;
- estado sin matrícula;
- progreso;
- “Continuar donde quedé”;
- acceso a vista docente solo como UX cuando el rol leído lo permite; la seguridad real sigue en DB.

### 8. Vista docente

`pilot/teacher.html` + `assets/lms/teacher.js`:

- cohortes asignadas;
- progreso;
- última entrega;
- contenido de estudiante con `textContent`;
- RPC docente verifica asignación de cohorte.

### 9. Seguridad frontend

- CSP sin scripts remotos;
- `object-src 'none'`;
- publishable key validada;
- rechazo explícito de secret/service keys;
- sin `innerHTML` para contenido de estudiantes en vista docente;
- ningún token/estado completo en logs.

### 10. CI

`.github/workflows/security-pilot.yml`:

- rama correcta `piloto-lms-sdd-secure`;
- validación ANDESDB;
- sintaxis JavaScript;
- contrato SDD;
- presencia de migraciones/pruebas;
- secret guards;
- checks de CSP/frontera docente;
- CodeQL JS/TS y Python;
- Actions críticas fijadas por SHA.

## Verify pendiente

La siguiente secuencia requiere un proyecto Supabase aislado:

1. aplicar 001–004 desde cero;
2. Security Advisor;
3. crear A/B/no-enrollment/teacher A/B;
4. ejecutar `supabase/tests/rls-adversarial.sql`;
5. probar OTP real;
6. activar `assets/lms/config.js` con URL + publishable key;
7. ejecutar 10 restauraciones A→B;
8. probar submission inmutable;
9. probar XSS almacenado;
10. backup + restore drill;
11. solo entonces incorporar <=10 participantes reales.

## Observabilidad mínima

Registrar únicamente errores/contadores necesarios. Nunca tokens, OTP, Authorization, correo en logs públicos ni `state_snapshot` completo.

## Rollback

- `assets/lms/config.js -> enabled:false`;
- deshabilitar deployment/branch del piloto si aplica;
- revocar sesiones/claves afectadas;
- `main` continúa operando sin depender de Supabase.

## Coste

El cómputo del piloto es pequeño. El criterio para pasar a plan de pago debe ser backup/recuperación/soporte, no volumen. Ver `docs/piloto-lms/ESTIMACION-PILOTO.md`.
