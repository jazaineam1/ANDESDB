# Operación · Piloto LMS ANDESDB

Este runbook es para un **proyecto Supabase aislado del piloto**. No usar una base institucional ni mezclar datos reales antes de superar todos los gates.

## 0. Precondiciones

- trabajar en `piloto-lms-sdd-secure`;
- `main` permanece sin cambios del LMS;
- nunca versionar `.env`, secret keys, service role, contraseñas o listados de estudiantes;
- usar URL HTTPS del proyecto;
- el navegador recibe únicamente una clave `sb_publishable_...`.

## 1. Crear proyecto de prueba

Crear un proyecto Supabase dedicado, por ejemplo `andesdb-lms-pilot-dev`.

Durante pruebas técnicas puede usarse el plan gratuito. **Antes de estudiantes reales** debe existir una decisión explícita de backup/retención y una prueba de restauración acorde con el plan contratado.

## 2. Aplicar migraciones

En un proyecto vacío, aplicar exactamente en orden:

1. `supabase/migrations/202608300001_lms_pilot.sql`
2. `supabase/migrations/202608300002_lms_pilot_hardening.sql`
3. `supabase/migrations/202608300003_lms_pilot_rpc.sql`
4. `supabase/migrations/202608300004_lms_pilot_catalog.sql`

No continuar si alguna migración falla. Corregir en un proyecto desechable y repetir desde cero.

Después ejecutar Supabase Security Advisor y revisar cualquier hallazgo antes de usuarios reales.

## 3. Configurar Auth

### Registro

El piloto es cerrado. Deshabilitar la creación abierta de cuentas desde el cliente. Las cuentas se crean/invitan administrativamente.

La llamada del frontend usa `create_user: false`, pero eso es defensa adicional y **no reemplaza** la configuración cerrada del proyecto.

### Email OTP

El template de email debe incluir el token OTP (`{{ .Token }}`), no solo un enlace de confirmación. El participante introduce el código en `/pilot/index.html`.

Configurar límites de envío razonables y un proveedor SMTP adecuado si se supera la capacidad de prueba del correo por defecto.

### URLs

Registrar únicamente los orígenes necesarios del piloto. No añadir comodines amplios de redirect si no son necesarios.

## 4. Crear las identidades de laboratorio

Antes de personas reales crear al menos:

- `student-a`;
- `student-b`;
- `student-no-enrollment`;
- `teacher-a`;
- `teacher-b`;
- `admin-test` si se necesita probar administración.

Usar correos de prueba controlados. No versionarlos.

El trigger de `auth.users` debe crear `profiles` y `user_roles` con rol `student`; no debe matricular automáticamente.

## 5. Matricular/asignar

Usar `supabase/pilot-admin.sql` desde SQL Editor para:

- activar matrícula de `student-a` y `student-b` en `piloto-2026`;
- asignar `teacher-a` a la cohorte piloto;
- dejar `student-no-enrollment` autenticable pero sin matrícula;
- crear una segunda cohorte de prueba si se quiere demostrar aislamiento entre docentes.

Nunca ejecutar estas operaciones desde el navegador.

## 6. Probar la frontera de autorización

Ejecutar la matriz de `supabase/tests/rls-adversarial.sql` y `docs/piloto-lms/PRUEBAS-ADVERSARIALES.md`.

Gate mínimo:

- A no lee ni modifica B;
- un usuario sin matrícula ve 0 datos académicos;
- `anon` ve 0 datos académicos;
- student no puede asignarse teacher/admin;
- student no puede crear enrollment;
- teacher A no consulta cohorte B;
- submission no admite UPDATE/DELETE del estudiante;
- payload > 512 KiB falla;
- dos autosaves con la misma revisión producen un conflicto, no pérdida silenciosa.

## 7. Activar frontend de forma reproducible

No editar tres CSP a mano. Usar el configurador:

```bash
python tools/configurar_piloto_lms.py \
  --project-ref PROJECT_REF \
  --publishable-key sb_publishable_... \
  --enable
```

El script:

- valida el formato de project ref;
- rechaza secret/service keys;
- activa `assets/lms/config.js`;
- escribe URL + publishable key;
- sustituye `https://*.supabase.co` por el origen exacto del proyecto en las tres CSP.

La publishable key es pública por diseño. **No sustituirla por `sb_secret_...` ni por service role.**

Después ejecutar el workflow `Security · piloto LMS SDD`. Cuando `enabled:true`, CI bloquea un CSP que conserve wildcard.

Para apagar el piloto conservando configuración:

```bash
python tools/configurar_piloto_lms.py \
  --project-ref PROJECT_REF \
  --publishable-key sb_publishable_... \
  --disable
```

## 8. Recorrido funcional

Con `student-a`:

1. abrir `/pilot/`;
2. solicitar OTP;
3. entrar a S7;
4. modificar el modelo;
5. esperar `Guardado`;
6. anotar el paso;
7. cerrar navegador A;
8. abrir navegador/dispositivo B;
9. volver a autenticarse;
10. comprobar que servidor reconstruye el mismo modelo/paso;
11. continuar y entregar;
12. comprobar que aparece el intento de entrega.

Repetir 10 veces con cambios diferentes. El gate es 10/10 sin pérdida.

## 9. Recorrido docente

Con `teacher-a`:

1. abrir `/pilot/teacher.html`;
2. seleccionar cohorte asignada;
3. comprobar progreso de A/B;
4. abrir última entrega;
5. insertar previamente payloads XSS como texto de estudiante y comprobar que se muestran como texto, nunca se ejecutan;
6. intentar acceder a cohorte no asignada y confirmar denegación.

## 10. Backups

Antes de participantes reales:

- configurar backup según plan;
- tomar snapshot/backup de prueba;
- introducir un registro de laboratorio;
- probar restauración en entorno seguro;
- documentar fecha, responsable y resultado en `specs/001-lms-pilot/verify.md`.

Un backup no probado no cuenta como gate superado.

## 11. Observabilidad

Para el piloto registrar solo métricas operativas agregadas. Nunca registrar:

- access tokens;
- refresh tokens;
- OTP;
- snapshot JSON completo;
- correos en logs públicos;
- claves API secretas.

## 12. Privacidad

Antes de participantes reales completar/revisar `PRIVACIDAD-PILOTO.md`, especialmente:

- responsable del tratamiento;
- canal de contacto;
- base/autorización aplicable;
- región/proveedor;
- fecha de inicio/cierre;
- retención de 90 días.

## 13. Cierre/retención

A los 90 días del cierre del piloto se debe decidir explícitamente:

- exportar lo necesario;
- anonimizar;
- o eliminar estados/entregas y cuentas de prueba.

No asumir conservación indefinida.

## 14. Rollback

Si ocurre un incidente:

1. desactivar `enabled` y/o retirar deployment;
2. revocar/rotar sesiones o claves si aplica;
3. deshabilitar matrículas afectadas;
4. preservar evidencia mínima del incidente;
5. mantener `main` y el curso público operativos;
6. no reabrir el piloto hasta repetir la matriz adversarial y el Verify relevante.
