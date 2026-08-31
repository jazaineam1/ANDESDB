# Analyze · Spec 001

## Resultado

La arquitectura propuesta permite probar persistencia por estudiante sin reescribir ANDESDB ni introducir un servidor propio. El riesgo dominante no es capacidad ni costo: es **autorización incorrecta** al exponer progreso y entregas desde un frontend público.

## Decisiones validadas

### Frontend estático + Supabase

El navegador contiene código y una clave publishable, ambos considerados públicos. La seguridad no depende de ocultarlos. Cada llamada académica combina:

1. clave publishable para identificar el proyecto;
2. JWT de la sesión del usuario;
3. RLS/RPC para decidir qué filas y operaciones son válidas.

### No usar enrollment_id para escribir

Aunque UUID no es un secreto, aceptar `enrollment_id` desde el cliente amplía la superficie IDOR/BOLA. Los RPC de escritura derivan la matrícula mediante `auth.uid()` y `activity_id`.

### Autosave mediante RPC atómico

El flujo `leer revisión → comprobar → escribir` ocurre en una sola transacción PostgreSQL y bloquea la fila mientras decide. Dos navegadores con la misma revisión no pueden sobrescribirse silenciosamente: el segundo recibe conflicto.

### Submission server-side

El navegador no envía el snapshot final. Solicita “entregar revisión N” y PostgreSQL copia el `activity_state` ya persistido. Esto elimina la posibilidad de entregar un objeto diferente del que el servidor acaba de confirmar.

### Reutilizar S7 por un host same-origin

`constructor-abc.html` ya tiene un estado interno y funciones `exportar()`/`importar()`. El piloto lo abre en un `iframe` del mismo origen y usa ese contrato como adaptador. Ventajas:

- no se duplica la lógica pedagógica;
- el constructor sigue funcionando fuera del piloto;
- el cambio LMS queda acotado a `/pilot/` y `/assets/lms/`;
- el rollback consiste en dejar de publicar/usar el host del piloto.

## Amenazas principales y control

| Amenaza | Control principal | Evidencia requerida |
|---|---|---|
| Estudiante A lee B | RLS + matrícula derivada | prueba A/B |
| Estudiante altera rol | roles sin write grant | intento de UPDATE rechazado |
| Autoinscripción | no hay INSERT de enrollment para authenticated | intento rechazado |
| Doble edición | revisión + `FOR UPDATE` | dos sesiones con misma revisión |
| Manipular entrega | snapshot desde servidor | payload arbitrario no aceptado |
| Docente ve otra cohorte | `teacher_cohorts` + RPC | docente A/B |
| XSS almacenado | `textContent` + CSP | payload adversarial en snapshot |
| Robo de secret key | no existe secret key en frontend | secret scan + revisión build |
| DoS por estado enorme | límite 512 KiB | payload > límite rechazado |
| Dependencia comprometida | cliente sin runtime npm/CDN nuevo | CodeQL + Actions fijadas por SHA |

## Riesgos residuales aceptados para piloto

### XSS y sesión en `sessionStorage`

Un XSS ejecutado en el mismo origen podría leer la sesión. Por eso el piloto usa CSP restrictiva, evita dependencias remotas y no renderiza HTML de estudiantes. Una arquitectura con cookie HttpOnly exigiría un backend/BFF propio y se deja fuera del piloto.

### Correo como factor de acceso

Quien controla el correo del participante puede obtener el OTP. El piloto no pretende MFA de alta seguridad. Si el proyecto evoluciona a notas oficiales o información institucional sensible, debe revisarse el nivel de autenticación.

### Disponibilidad del proveedor

Una caída de Supabase/Auth impide sincronizar. La actividad visible no se borra, pero el piloto no promete operación offline completa.

### `localStorage` heredado del constructor

S7 ya conserva una copia local para recargas accidentales. El host del piloto la trata solo como borrador inicial; después de existir estado remoto, servidor prevalece. No se presenta ese almacenamiento local como expediente de progreso.

### Hosting público

El código del cliente es inspeccionable por diseño. Ningún control depende de ofuscación, rutas secretas o variables JavaScript ocultas.

## Criterio de salida de Analyze

La implementación puede pasar a Verify solo cuando el backend aislado exista y se ejecuten las pruebas negativas. El hecho de que el código compile no demuestra autorización correcta.
