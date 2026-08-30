# Constitución SDD · Piloto LMS ANDESDB

Versión: 1.0.0

## I. La especificación manda

Ningún cambio funcional del piloto se implementa sin una especificación aprobada. El código debe satisfacer la especificación; no se ajusta la especificación para justificar código ya escrito.

Flujo obligatorio para cambios materiales:

`Spec -> Clarify -> Plan -> Checklist -> Tasks -> Analyze -> Implement -> Verify`

## II. Seguridad por diseño y por defecto

La seguridad es requisito funcional del piloto, no una tarea posterior. Toda historia que lea o modifique datos personales, progreso, entregas o roles debe definir explícitamente:

- actor autorizado;
- activo protegido;
- decisión de autorización en servidor/BD;
- comportamiento ante denegación;
- prueba negativa asociada.

Baseline: deny-by-default, mínimo privilegio, RLS en toda tabla académica expuesta, secretos solo del lado servidor, sin `service_role` en cliente.

## III. Identidad no implica autorización

Autenticarse no matricula ni concede acceso. La autorización depende de matrícula activa, cohorte y rol asignado por un flujo privilegiado.

Un estudiante nunca puede:

- autoasignarse un rol privilegiado;
- autoinscribirse en una cohorte;
- leer/modificar el trabajo de otro estudiante;
- alterar una entrega ya enviada.

## IV. Datos mínimos

El piloto solo almacena los datos necesarios para identidad académica, progreso, estado de actividad, entrega y retroalimentación. No se añade cédula, teléfono, dirección u otros datos personales sin una nueva especificación y justificación.

## V. Persistencia confiable

El estado editable y la entrega son conceptos distintos:

- `activity_state`: mutable, con revisión y autosave;
- `submission`: snapshot inmutable.

Toda actualización de estado debe soportar control de concurrencia para evitar sobrescrituras silenciosas.

## VI. Compatibilidad de actividades

Toda actividad persistente tiene `activity_version`. Cambiar la forma del estado requiere estrategia explícita: migrar, conservar versión anterior o invalidar de forma visible. Nunca se descarta silenciosamente trabajo de un estudiante.

## VII. Validación adversarial

Una funcionalidad que cambia fronteras de autorización no está terminada hasta tener pruebas positivas y negativas. Como mínimo se prueba:

- acceso entre estudiantes;
- acceso entre cohortes/docentes;
- escalada de rol;
- manipulación de IDs;
- XSS almacenado;
- payload sobredimensionado;
- reenvío/edición de entregas;
- concurrencia de autosave.

## VIII. Supply chain reproducible

Actions críticas se fijan por commit SHA. Secretos no se versionan. Las dependencias nuevas requieren justificación, versión fija/lockfile cuando aplique y revisión automatizada de vulnerabilidades.

## IX. Piloto antes que plataforma

El primer objetivo es demostrar un único recorrido vertical seguro:

`login -> S7 -> autosave -> cerrar -> otro dispositivo -> continuar -> entregar -> docente ve`

No se añaden foros, mensajería, certificados, pagos ni funcionalidades de LMS genérico mientras este recorrido no pase los criterios de aceptación.

## X. Definition of Done

Una tarea solo está terminada cuando:

1. satisface su criterio de aceptación;
2. pasa validaciones ANDESDB;
3. pasa pruebas de autorización relevantes;
4. no introduce secretos;
5. no degrada `main`;
6. deja documentación/spec sincronizada con el comportamiento real.
