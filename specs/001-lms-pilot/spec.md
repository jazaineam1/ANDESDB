# Spec 001 · Piloto LMS persistente y seguro

Estado: DRAFT PARA VALIDACIÓN

## Problema

ANDESDB ofrece contenido y actividades interactivas, pero el progreso no está asociado a una identidad persistente. Un estudiante que cambia de dispositivo o cierra una actividad no tiene una forma confiable de continuar exactamente donde quedó.

## Objetivo del piloto

Demostrar con una cohorte de prueba que un estudiante puede autenticarse, trabajar la actividad S7, cerrar el navegador, volver desde otro dispositivo, continuar sin pérdida, entregar y permitir que el docente consulte esa entrega, manteniendo aislamiento entre usuarios.

## Fuera de alcance

No forman parte del piloto: foros, chat, videollamadas, certificados, pagos, integración SIS, libro de calificaciones institucional, notificaciones masivas, almacenamiento de archivos grandes ni migración de todas las sesiones.

## Actores

### Estudiante
Usuario autenticado con matrícula activa en una cohorte.

### Docente
Usuario autenticado con rol docente y asignación explícita a una cohorte.

### Administrador
Rol privilegiado para configuración del piloto. No se usa para las tareas cotidianas de estudiante/docente.

## Historias y criterios de aceptación

### US-01 · Autenticarse sin autoautorizarse

Como estudiante invitado quiero autenticarme para acceder a mis actividades.

Criterios:
- autenticarse no crea una matrícula activa por sí solo;
- un usuario autenticado sin matrícula no puede consultar curso, cohorte ni trabajos;
- el cliente nunca recibe credenciales privilegiadas.

### US-02 · Ver únicamente mi S7

Como estudiante matriculado quiero abrir S7 y cargar solo mi estado.

Criterios:
- A puede leer su estado;
- A no puede leer el estado de B aunque sustituya IDs manualmente;
- la autorización se verifica en BD/servidor, no únicamente en interfaz.

### US-03 · Autosave

Como estudiante quiero que mis cambios se guarden automáticamente.

Criterios:
- guardar no requiere botón manual;
- el estado persistido contiene `activity_version`, revisión y paso actual;
- payload máximo 512 KiB;
- campos controlados por servidor no pueden ser alterados por el cliente;
- un conflicto de revisión no puede sobrescribir silenciosamente una versión más nueva.

### US-04 · Continuar en otro dispositivo

Como estudiante quiero cerrar el dispositivo A e iniciar sesión en B para continuar S7.

Criterios:
- el último estado confirmado por servidor se reconstruye;
- el sistema indica claramente estado de sincronización;
- no depende de `localStorage` como fuente de verdad.

### US-05 · Entregar

Como estudiante quiero convertir mi trabajo actual en una entrega.

Criterios:
- la entrega crea un snapshot separado de `activity_state`;
- el estudiante no puede modificar ni eliminar el snapshot entregado;
- la entrega registra versión y fecha del servidor.

### US-06 · Docente consulta su cohorte

Como docente quiero consultar entregas y progreso de estudiantes de mi cohorte.

Criterios:
- docente A puede consultar cohorte A;
- docente A no puede consultar cohorte B si no está asignado;
- contenido escrito por estudiantes se representa como texto seguro y no como HTML ejecutable.

### US-07 · Cambiar versión de actividad sin perder trabajo

Como mantenedor quiero evolucionar S7 sin destruir trabajos guardados.

Criterios:
- cada estado identifica la versión de actividad;
- incompatibilidad de versión nunca descarta trabajo silenciosamente;
- existe decisión explícita: migrar, abrir versión anterior o pedir reinicio informado.

## Requisitos no funcionales

### Seguridad
- deny-by-default;
- mínimo privilegio;
- RLS en todas las tablas académicas expuestas;
- `service_role` prohibido en frontend;
- protección frente a IDOR/BOLA, escalada de rol y XSS almacenado;
- secretos fuera del repositorio;
- CI con análisis estático y controles de secretos.

### Rendimiento
Para el piloto de hasta 100 usuarios concurrentes:
- carga de estado p95 objetivo < 1,5 s sin contar latencia del proveedor de identidad;
- autosave no más frecuente que una petición por ~800 ms de actividad continua;
- estado de actividad <= 512 KiB.

### Disponibilidad y recuperación
- el piloto puede degradarse mostrando error de sincronización sin borrar el estado visible del usuario;
- antes de usuarios reales debe existir mecanismo de backup/restauración del proveedor;
- no se promete modo offline completo en esta primera versión.

### Privacidad
Se almacenan únicamente identidad mínima, matrícula, progreso, estado, entrega y feedback. La especificación no autoriza recopilar cédula, teléfono ni dirección.

## Métricas de éxito

El piloto se considera funcional si:
- 10/10 recorridos dispositivo A -> dispositivo B restauran estado correctamente;
- 0 accesos cruzados en matriz adversarial;
- 0 escaladas de rol exitosas;
- 0 ejecuciones de XSS almacenado en vista docente;
- 100 % de entregas permanecen inmutables desde el rol estudiante;
- CI de seguridad y curso en verde.

## Preguntas abiertas que deben aclararse antes de implementar Auth

1. ¿Proveedor inicial: Microsoft institucional, Google o ambos?
2. ¿La cohorte piloto será cerrada por lista de correos o invitación individual?
3. ¿Cuántos estudiantes reales participarán inicialmente?
4. ¿Se exige conservar entregas después del curso y por cuánto tiempo?
5. ¿El docente necesita feedback en el piloto o basta lectura de entrega?

Estas preguntas no bloquean el diseño de datos/RLS, pero sí el flujo final de identidad y retención.
