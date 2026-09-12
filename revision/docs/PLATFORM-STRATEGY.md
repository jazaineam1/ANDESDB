# ANDESDB + LMS institucional · estrategia de plataforma

## Decisión

Cuando exista acceso institucional a **Bloque Neón / Brightspace** o **Moodle**, ANDESDB no debe competir por convertirse en otro LMS generalista. Debe operar como una **capa especializada de experiencia de aprendizaje** para bases de datos: presentaciones interactivas, laboratorios ejecutables, autovalidación, simulaciones de modelado y telemetría pedagógica fina.

El LMS institucional debe conservar las funciones institucionales que ya resuelve mejor:

- identidad y matrícula oficial;
- secciones/grupos;
- calendario institucional y notificaciones;
- tareas formales y libro de calificaciones;
- comunicaciones oficiales;
- políticas de retención, privacidad, soporte y continuidad;
- acceso móvil institucional.

ANDESDB conserva lo que aporta diferenciación real:

- SQL ejecutable dentro del navegador;
- prácticas autovalidables específicas del curso;
- feedback inmediato basado en resultado/grano/modelado;
- laboratorios de normalización, documentos, DW y BigQuery;
- seguimiento por práctica, intento, pista y punto de abandono;
- curso portable cuando no existe LMS institucional.

## Arquitectura objetivo

```text
Bloque Neón / Brightspace o Moodle
  identidad · curso · grupos · notas · comunicaciones
                    │
                    │ LTI 1.3 / LTI Advantage
                    ▼
                 ANDESDB
  presentaciones · SQL labs · simulaciones · autograding
                    │
                    ├── Supabase (estado técnico especializado)
                    └── GA4 (analítica web agregada)
```

## Integración preferida: LTI 1.3

Brightspace soporta LTI Advantage 1.3. La integración futura debe priorizar:

1. **Launch / SSO**: el estudiante abre ANDESDB desde el curso institucional sin otra contraseña.
2. **Contexto**: ANDESDB recibe curso, recurso y rol conforme al estándar, sin inventar sincronizaciones de usuarios.
3. **Deep Linking**: el profesor elige una presentación o laboratorio ANDESDB y Brightspace crea el enlace correspondiente.
4. **Assignment and Grade Services (AGS)**: solo cuando una actividad de ANDESDB deba reportar una calificación formal al gradebook institucional.

Esta integración necesita registro por un administrador institucional y datos como `client_id`, `deployment_id`, issuer, OIDC/JWKS y endpoints del LMS. No deben inventarse ni almacenarse en GitHub.

## Modo standalone

El LMS propio de `revision/` se conserva como **fallback** para:

- educación continua sin acceso a Bloque Neón;
- demostraciones;
- cohortes externas;
- desarrollo/pruebas;
- portabilidad del curso.

No debe crecer por imitación de Brightspace/Moodle si una capacidad no mejora la experiencia especializada del curso.

## Principio de producto

> **No reconstruir un LMS institucional; construir la mejor herramienta de aprendizaje de bases de datos que pueda conectarse a uno.**

## Criterio para futuras funcionalidades

Antes de agregar una función a ANDESDB, responder:

1. ¿Bloque Neón/Moodle ya la resuelve de forma institucional?
2. ¿ANDESDB puede aportar una evidencia pedagógica o interacción que el LMS generalista no ofrece?
3. ¿La función reduce fricción para estudiante/docente o solo duplica interfaz?
4. ¿Puede integrarse mediante estándar en lugar de mantener una sincronización propietaria?

Si la respuesta a 1 es sí y a 2 es no, la función debe permanecer en el LMS institucional.

## Referencias

- Universidad de los Andes · Bloque Neón: https://tecnologia.uniandes.edu.co/bloqueneon/
- Universidad de los Andes · Bloque Neón para profesores: https://tecnologia.uniandes.edu.co/bloqueneon-profesores/
- D2L Brightspace · LTI Advantage 1.3: https://community.d2l.com/brightspace/kb/articles/23660-lti-advantage-v1-3
- D2L Brightspace · Deep Linking: https://community.d2l.com/brightspace/kb/articles/23755-deep-linking-extension-with-lti-1-3
- D2L Brightspace · Assignment and Grades Services: https://community.d2l.com/brightspace/kb/articles/23752-assignment-and-grades-services-extension-with-lti-1-3
