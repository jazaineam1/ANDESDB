# Pruebas adversariales obligatorias · Piloto LMS

No basta con que el flujo feliz funcione. El piloto se aprueba intentando romper aislamiento y autorización.

## Cuentas de prueba

Crear en el proyecto de prueba:

- `student_a` matriculado en cohorte A;
- `student_b` matriculado en cohorte A;
- `student_c` autenticado pero NO matriculado;
- `teacher_a` asignado a cohorte A;
- `teacher_b` asignado a cohorte B;
- `admin_test` solo para administración.

Nunca usar estudiantes reales en estos tests.

## Matriz de autorización

| Operación | A | B | C no matriculado | Teacher A | Teacher B |
|---|---:|---:|---:|---:|---:|
| leer estado A | ✅ | ❌ | ❌ | ✅ | ❌ |
| modificar estado A | ✅ | ❌ | ❌ | ❌* | ❌ |
| leer entrega A | ✅ | ❌ | ❌ | ✅ | ❌ |
| modificar entrega A | ❌ | ❌ | ❌ | ❌ | ❌ |
| feedback entrega A | ❌ | ❌ | ❌ | ✅ | ❌ |
| modificar role propio | ❌ | ❌ | ❌ | ❌ | ❌ |
| crear enrollment propio | ❌ | ❌ | ❌ | ❌ | ❌ |

`*` En el piloto el docente observa el borrador, no lo edita.

## T01 · IDOR/BOLA de lectura

1. A crea un `activity_state`.
2. Obtener su `enrollment_id` y `activity_id` desde una sesión administrativa de prueba.
3. Como B, ejecutar SELECT filtrando por esos IDs.
4. Repetir con request directa, no solo UI.

**Esperado:** cero filas.

## T02 · IDOR/BOLA de escritura

Como B intentar UPDATE/UPSERT sobre la PK de A.

**Esperado:** operación denegada/0 filas; estado de A intacto.

## T03 · Payload con user/enrollment ajeno

Manipular la petición del frontend y sustituir IDs por los de A.

**Esperado:** RLS lo bloquea aunque JavaScript haya sido modificado.

## T04 · Escalada horizontal/vertical

Como student:

- INSERT `user_roles(role='teacher')`;
- UPDATE su `user_roles`;
- INSERT `teacher_cohorts`;
- cambiar metadata del perfil e intentar que el sistema la trate como rol.

**Esperado:** todo bloqueado; el rol efectivo sigue siendo student.

## T05 · Cuenta autenticada sin matrícula

C inicia sesión correctamente pero no tiene enrollment.

**Esperado:** no accede a actividades privadas ni a datos académicos.

## T06 · Teacher fuera de cohorte

Teacher B intenta consultar estado/entrega de cohorte A.

**Esperado:** cero filas.

## T07 · Inmutabilidad de entrega

A crea una submission y luego intenta:

- UPDATE snapshot;
- DELETE submission;
- cambiar `submitted_at`.

**Esperado:** bloqueado.

## T08 · XSS almacenado

Guardar en cada campo de texto soportado:

```text
<img src=x onerror=alert(document.domain)>
<script>alert(1)</script>
"><svg onload=alert(1)>
```

Abrir como A y como teacher A.

**Esperado:** texto visible literal; nunca ejecución.

## T09 · Payload excesivo

Intentar guardar estado JSON > 512 KiB.

**Esperado:** constraint rechaza el write. UI explica que no pudo guardar sin imprimir payload completo.

## T10 · Autosave concurrente

1. abrir misma actividad en dos pestañas/dispositivos;
2. ambos cargan revision N;
3. A guarda -> N+1;
4. B intenta guardar basado en N.

**Esperado objetivo de aplicación:** detectar conflicto y no sobrescribir silenciosamente. La migración incrementa revision en servidor; el adaptador de aplicación debe añadir comparación optimista antes de aprobar G2.

## T11 · Session expiration

Expirar/revocar sesión mientras existe un autosave pendiente.

**Esperado:** no loop infinito, no pérdida silenciosa, estado UI `sesión expirada`, login de nuevo.

## T12 · Solución oculta

Inspeccionar HTML, JS, source maps y network del estudiante antes de hora de publicación.

**Esperado:** ninguna respuesta que se pretenda secreta está presente por estar simplemente `hidden`.

## T13 · Secret scanning manual

Buscar en branch/build:

```text
service_role
PRIVATE KEY
SUPABASE_SERVICE
SNYK_TOKEN
client_secret
Authorization: Bearer
```

La palabra puede existir en documentación de seguridad; ninguna debe corresponder a un valor real.

## T14 · Redirect OAuth

Intentar redirects no registrados, subdominios similares y parámetros abiertos.

**Esperado:** solo URLs exactas del piloto.

## T15 · Rate/autosave

Manipular cliente para enviar decenas de saves por segundo.

**Esperado:** la plataforma sigue disponible; registrar necesidad de rate limiting adicional si el proveedor no basta.

## Gate automático/manual

Una prueba marcada ❌ bloquea el piloto. Un hallazgo se cierra solo con:

1. fix;
2. test repetido;
3. test de regresión añadido cuando sea automatizable;
4. threat model actualizado si cambia la arquitectura.