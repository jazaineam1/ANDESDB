# Clarifications · Spec 001

Estado: RESUELTO PARA PILOTO TÉCNICO

Estas decisiones cierran las preguntas abiertas de `spec.md` sin convertir el piloto en un LMS completo.

## C01 · Identidad

**Decisión:** email OTP de Supabase Auth para la primera prueba.

- No hay contraseña propia de ANDESDB.
- El correo usa una cuenta Auth creada previamente por administración.
- La llamada OTP usa `create_user: false`: autenticarse no crea una cuenta nueva.
- El template de correo debe usar `{{ .Token }}` para entregar un código y no depender de un enlace mágico.
- El navegador recibe únicamente una clave `sb_publishable_...`.

**Razón:** minimiza infraestructura, evita almacenar contraseñas y permite repetir el recorrido en otro dispositivo.

## C02 · Registro y matrícula

**Decisión:** piloto cerrado.

1. Administración crea/invita primero la cuenta en Supabase Auth.
2. El trigger crea perfil y rol `student` por defecto.
3. Una operación administrativa separada activa la matrícula en `piloto-2026`.

No existe autoinscripción ni elevación de rol desde el frontend.

## C03 · Tamaño

**Decisión:** dos etapas.

- Etapa A: 5 identidades ficticias/adversariales.
- Etapa B: máximo 10 participantes reales en la primera salida.

Ampliar la cohorte requiere revisar las métricas y defectos de la etapa B.

## C04 · Retención

**Decisión de piloto:** conservar estados y entregas hasta 90 días después del cierre del piloto. Antes de vencer el plazo se toma una decisión explícita de exportar, anonimizar o eliminar.

No se promete retención institucional permanente.

## C05 · Función docente

**Decisión:** el MVP docente permite ver progreso y el último snapshot entregado. La creación de feedback/calificación existe en el modelo de datos, pero no es requisito de salida del primer recorrido vertical.

## C06 · Fuente de verdad y uso local

**Decisión:** PostgreSQL es la fuente de verdad una vez que el estudiante entra por `/pilot/`.

El `localStorage` que ya usa `constructor-abc.html` se conserva únicamente como recuperación accidental dentro de la actividad heredada. Al abrir desde el host del piloto:

- si existe estado de servidor, ese estado se hidrata y prevalece;
- si todavía no existe estado de servidor, el primer cambio confirmado crea el estado remoto;
- un conflicto de revisión detiene el autosave y nunca ejecuta `last-write-wins` silencioso.

## C07 · Hosting

**Decisión:** el código seguirá siendo estático durante el piloto. La arquitectura no depende de mover inmediatamente el sitio fuera de GitHub Pages. Un cambio a Cloudflare Pages u otro hosting es una decisión posterior y no debe bloquear la prueba de persistencia.

## C08 · Offline

**Decisión:** no hay modo offline completo en el piloto. Ante pérdida de red la interfaz conserva lo visible en memoria/localmente, muestra error de sincronización y no afirma que el cambio quedó persistido en servidor.
