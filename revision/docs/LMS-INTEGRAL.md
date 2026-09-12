# ANDESDB LMS integral · `revision/`

Fecha de corte: 2026-09-12

## Propósito

`revision/` es la capa LMS autenticada de ANDESDB. El objetivo no es reproducir Moodle completo: la plataforma concentra lo que aporta al aprendizaje del curso y mantiene una navegación corta:

`Portal → Curso → Sesión → Material / Laboratorio → Evidencia`

El frontend se publica en GitHub Pages y la persistencia académica vive en Supabase. Google Analytics 4 se usa únicamente para analítica web agregada; Supabase es la fuente de verdad del expediente académico.

## Fuente de verdad académica

- `tools/curso.json`: recorrido, módulos, sesiones, fechas, títulos, recursos y etiquetas.
- `assets/learning/learning-plan.json`: diseño pedagógico detallado S6–S16.
- PostgreSQL/Supabase: matrícula, intentos, progreso, tiempo activo, anuncios, entregas, competencias, marcadores y credenciales.
- `localStorage`/`sessionStorage`: estado técnico de sesión o caché de interfaz; **no son el expediente académico**.

## Experiencia estudiante

### Portal

- usuario/correo + contraseña;
- retorno seguro a la URL solicitada mediante `?next=`;
- progreso global de 160 prácticas y 16 sesiones;
- continuar desde la última evidencia registrada;
- anuncios con leído/no leído;
- próximas sesiones y calendario `.ics`;
- entregas pendientes;
- dominio de competencias;
- marcadores y notas;
- gestión de contraseña y dispositivos/sesiones.

### Curso

`learning-hub.html` carga el recorrido desde `tools/curso.json`, ofrece búsqueda textual y presenta **una única fila por sesión** con material, laboratorio y avance. No se repiten rutas equivalentes.

### Laboratorio

`lab.html?session=N&practice=P` permite retomar una práctica exacta. Cada laboratorio contiene 10 evidencias verificables. S2–S5 ejecutan SQL en el navegador con `sql.js` y `dvdrental.db`.

### Presentaciones

El runtime común registra actividad LMS cuando el usuario está autenticado, mantiene la navegación dentro del mismo origen y permite guardar un punto de una presentación como marcador/nota. El toolkit de presentaciones usa una caché temporal de interfaz y sincroniza logros con la cuenta LMS; no debe tratarse como persistencia académica local.

### Agenda

`calendar.html` se genera desde el manifiesto. Permite descargar un calendario estándar `.ics`, abrir una sesión y añadir eventos individuales a Google Calendar sin OAuth ni servicio de pago.

### Entregas

`assignment.html?id=...` admite evidencia de texto, URL o archivo privado (máx. 2 MB). Los archivos se almacenan en un bucket privado de Supabase y se exponen temporalmente mediante URL firmada.

## Experiencia docente

`teacher-dashboard.html` funciona como centro de control:

- resumen de cohorte;
- estudiantes que requieren atención;
- prácticas con mayor fricción;
- competencias del grupo;
- ficha individual por estudiante;
- activación/desactivación de cuentas;
- revocación de sesiones/dispositivos;
- anuncios;
- creación y revisión de entregas;
- solicitudes de matrícula y restablecimiento de contraseña;
- exportación CSV;
- emisión de certificado verificable cuando se cumplen criterios.

## Competencias

Las 160 actividades se vinculan con competencias de SQL, modelado, normalización, integridad, arquitectura SQL/NoSQL, data warehouse, analítica cloud, integración y DP-900. Desde S6 existe además evidencia transversal para DP-900.

El dominio se calcula desde actividades completadas y sus pesos. Es una señal de progreso y no sustituye una evaluación humana cuando el artefacto requiere juicio docente.

## Cohortes y escalabilidad

El modelo separa:

- `lms_courses`: definición del curso;
- `lms_course_runs`: ejecución/cohorte;
- `lms_run_enrollments`: matrícula por cohorte;
- `course_run_id` en eventos y progreso.

Esto evita que una futura S1 de otro curso/cohorte colisione con la S1 actual. El número de sesión es un atributo de la experiencia; la cohorte forma parte de la identidad académica del progreso.

## Seguridad

### Controles aplicados

- contraseñas con `pgcrypto`/bcrypt;
- tokens de sesión guardados en PostgreSQL únicamente como hash SHA-256;
- Edge Functions validan sesión y rol;
- rate limit de login;
- RLS habilitado en tablas LMS;
- roles `anon`/`authenticated` sin acceso directo a las tablas internas del LMS;
- RPC académicos sensibles ejecutables solo por `service_role`;
- bucket de entregas privado;
- URLs firmadas de archivo con vigencia corta;
- auditoría de acciones privilegiadas;
- el docente puede revocar sesiones o desactivar una cuenta;
- cambio de contraseña cierra otras sesiones.

### Límite de GitHub Pages

GitHub Pages es hospedaje estático público. La autenticación protege la **experiencia LMS y los datos académicos**, pero un HTML publicado en el repositorio no puede considerarse un documento secreto. Material que deba ser confidencial debe vivir en almacenamiento/backend privado.

### Separación de demos didácticas

Las bases/RPC usados para ejercicios de Restaurante ABC no son la base de control del LMS. Deben mantenerse conceptualmente aislados. No se deben reutilizar credenciales ni funciones didácticas como autorización académica.

## Analítica

### Supabase

Fuente de verdad individual:

- progreso;
- sesiones;
- tiempo activo;
- intentos;
- pistas;
- completitud;
- competencias;
- entregas;
- riesgo pedagógico.

### GA4

`G-Z5YG0TNP8J` registra comportamiento web agregado: páginas, presentaciones, slides, engagement, dispositivo, navegador, sistema operativo y geografía aproximada. No se envían nombre, correo, username, token ni respuestas del estudiante.

La conexión directa del panel con GA4 Data API requiere una credencial de lectura y el `property_id` numérico de GA4. Esa credencial **no debe publicarse en GitHub**; hasta tenerla, el panel enlaza al informe de GA4 y la analítica académica permanece completamente operativa en Supabase.

## Certificados

El backend puede emitir una credencial cuando el estudiante cumple al menos 80 % de las prácticas y completa S15 y S16. `verify.html?code=...` permite comprobar de forma pública el código sin exponer correo ni expediente.

## Interoperabilidad futura

Para integración institucional con Moodle/Canvas, el camino recomendado es LTI 1.3/LTI Advantage. La plataforma no debe inventar un protocolo propietario. La activación requiere registro institucional (issuer, client ID, deployment ID y claves), por lo que no se habilita sin esos datos.

## Política de costo

Arquitectura prevista para operar sin costo adicional en la escala del curso:

- GitHub Pages;
- Supabase Free dentro de sus límites;
- GA4 estándar;
- motores WASM en navegador;
- calendario `.ics`.

No se habilitan planes pagos, SMTP pago, VPS ni servicios adicionales automáticamente.

## Verificación antes de publicar

Desde `revision/`:

```bash
python tools/pre_push_check.py
```

Resultado esperado:

```text
PRE-PUSH ANDESDB: OK
```

Después del push se revisan los workflows de validación, el `HEAD` final de `main` y la publicación de GitHub Pages.
