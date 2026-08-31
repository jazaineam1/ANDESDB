# Pruebas adversariales obligatorias · Piloto LMS

El flujo feliz no aprueba el piloto. Hay que intentar romper aislamiento, sesión, concurrencia y entrega.

## Identidades de laboratorio

Crear, sin usar personas reales:

- `student_a`: cohorte A;
- `student_b`: cohorte A;
- `student_no_enrollment`: autenticado, sin matrícula;
- `teacher_a`: asignado a cohorte A;
- `teacher_b`: asignado a cohorte B;
- `admin_test`: administración puntual.

## Matriz de autorización

| Operación sobre A | A | B | Sin matrícula | Teacher A | Teacher B |
|---|---:|---:|---:|---:|---:|
| leer estado | ✅ | ❌ | ❌ | ✅ | ❌ |
| guardar estado | ✅ RPC | ❌ | ❌ | ❌ | ❌ |
| leer submission | ✅ | ❌ | ❌ | ✅ | ❌ |
| modificar submission | ❌ | ❌ | ❌ | ❌ | ❌ |
| cambiar role/enrollment | ❌ | ❌ | ❌ | ❌ | ❌ |

## T01 · IDOR/BOLA lectura

B intenta seleccionar `enrollment`, `activity_state` y `submissions` de A usando UUID conocidos.

**Esperado:** 0 filas o denegación; nunca datos de A.

## T02 · Escritura directa ajena

B intenta `INSERT/UPDATE` directo sobre `activity_state`/`activity_progress` con IDs de A.

**Esperado:** permiso denegado. Migration 003 revoca escritura directa a `authenticated`.

## T03 · Manipular identidad en el navegador

Modificar DevTools/request para añadir `user_id`, `enrollment_id`, `role` o timestamps arbitrarios.

**Esperado:** los RPC de autosave/submit ignoran esos conceptos porque no forman parte de su contrato; derivan matrícula desde `auth.uid()`.

## T04 · Escalada vertical

Como student intentar:

- UPDATE/INSERT de `user_roles`;
- INSERT de `enrollments`;
- INSERT de `teacher_cohorts`;
- editar perfil esperando convertirse en teacher.

**Esperado:** todo bloqueado.

## T05 · Autenticado sin matrícula

`student_no_enrollment` obtiene una sesión OTP válida.

**Esperado:** `get_my_dashboard()` devuelve 0 filas y S7 no está disponible.

## T06 · Teacher fuera de cohorte

Teacher B llama `get_teacher_cohort_progress(cohortA)` y `get_teacher_submission(enrollmentA, ...)`.

**Esperado:** error de autorización (`42501`) o 0 datos, según operación.

## T07 · Inmutabilidad de entrega

A entrega por `submit_activity`. Después intenta UPDATE/DELETE directo.

**Esperado:** denegado. El snapshot sigue idéntico.

## T08 · Snapshot no manipulable

Interceptar el botón Entregar e intentar enviar un `state_snapshot` inventado.

**Esperado:** `submit_activity` no acepta ese parámetro. Copia el estado que ya existe en PostgreSQL.

## T09 · XSS almacenado

Introducir como dato persistente cadenas como:

```text
<img src=x onerror=alert(document.domain)>
<script>alert(1)</script>
"><svg onload=alert(1)>
```

Abrir la entrega en vista docente.

**Esperado:** texto literal; 0 ejecución. `teacher.js` no usa `innerHTML`/`insertAdjacentHTML`.

## T10 · Payload excesivo

`save_activity_state` con JSON >512 KiB.

**Esperado:** error controlado; el estado anterior permanece intacto.

## T11 · Autosave concurrente

1. dos navegadores cargan revision N;
2. A guarda y obtiene N+1;
3. B guarda con expected=N.

**Esperado:** B recibe `40001 revision conflict`; no existe last-write-wins. La UI detiene autosave, permite copiar código local y cargar servidor.

## T12 · Expiración de sesión

Revocar/expirar JWT durante autosave.

**Esperado:** no bucle infinito, no mensaje falso de “Guardado”, posibilidad de autenticarse de nuevo.

## T13 · OTP / cuentas inexistentes

Solicitar OTP para cuenta no autorizada y autorizada.

**Esperado UI:** mensaje equivalente para ambos casos; no usar la interfaz como oráculo de usuarios.

## T14 · Registro abierto

Intentar crear cuenta desde el frontend o alterar `create_user` en la request.

**Esperado:** el proyecto de Auth está configurado cerrado y una sesión sin enrollment sigue viendo 0 datos aunque consiga autenticarse.

## T15 · Key misuse

Inspeccionar HTML/JS/network.

**Esperado:** puede verse `sb_publishable_...`; nunca `sb_secret_...`, legacy service role, DB password, SMTP password o OAuth secret.

## T16 · Submission replay

Repetir el submit hasta superar `max_attempts=3`.

**Esperado:** intentos 1–3 válidos según política; el cuarto falla. Los intentos previos permanecen intactos.

## T17 · Progreso manipulado

Alterar el porcentaje en JavaScript o llamar el RPC con un paso fuera de 0..max_step.

**Esperado:** porcentaje se deriva del paso en servidor y paso fuera de rango falla.

## T18 · Acceso anónimo

Sin JWT consultar tablas académicas o RPC protegidos.

**Esperado:** 0 acceso/permission denied.

## T19 · Stress básico

Simular la escala objetivo con debounce normal y luego un cliente deliberadamente agresivo.

**Esperado:** no corrupción. Si el rate limit del proveedor no basta ante abuso, registrar rate limiting adicional antes de ampliar el piloto.

## T20 · Backup/restore

Crear datos ficticios, ejecutar backup, alterar/borrar datos de laboratorio y restaurar en entorno seguro.

**Esperado:** restauración demostrada y documentada; no basta con que “el proveedor tiene backups”.

## Evidencia

`supabase/tests/rls-adversarial.sql` contiene escenarios SQL reproducibles. Cada hallazgo se cierra solo con fix + repetición + prueba de regresión cuando sea automatizable.

Una sola prueba crítica fallida bloquea el GO.
