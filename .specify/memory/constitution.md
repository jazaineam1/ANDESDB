# Constitución SDD · ANDESDB y Piloto LMS

Versión: 1.1.0

## I. La especificación manda

Ningún cambio funcional o de seguridad material se implementa sin una especificación trazable. El código debe satisfacer la especificación; no se modifica la especificación después para justificar código inseguro ya escrito.

Flujo obligatorio:

`Spec -> Clarify -> Plan -> Checklist -> Tasks -> Analyze -> Implement -> Verify`

## II. Seguridad del proyecto por diseño y por defecto

La seguridad cubre **todo ANDESDB**: contenido, frontend, scripts, GitHub Actions, dependencias/binarios, hosting, Supabase, datos, backups y operación. No se limita al LMS.

Toda historia que cambie una frontera de confianza debe definir:

- actor autorizado;
- activo protegido;
- entrada no confiable;
- decisión de autorización;
- comportamiento ante denegación;
- prueba positiva y negativa;
- rollback/kill switch cuando aplique.

Baseline operativo: deny-by-default, mínimo privilegio, defensa en profundidad y fail-closed.

Los controles se derivan de `docs/SEGURIDAD-PROYECTO.md`, con NIST SSDF 1.1, NIST CSF 2.0, OWASP ASVS 5.0, OWASP Top 10 2025, OWASP API Security Top 10 2023 y OpenSSF Scorecard como referencias principales aplicables. No se afirma certificación sin auditoría correspondiente.

## III. Identidad no implica autorización

Autenticarse no matricula ni concede acceso. La autorización depende de matrícula activa, cohorte y rol asignado por flujo privilegiado.

Un estudiante nunca puede:

- autoasignarse rol privilegiado;
- autoinscribirse en cohorte;
- leer/modificar trabajo de otro estudiante;
- alterar una entrega enviada.

## IV. Secretos cero en Git

No se versionan contraseñas, connection strings con password, private keys, `service_role`, `sb_secret_*`, OAuth client secrets, SMTP passwords ni tokens reutilizables.

Si un secreto llega a Git, se considera comprometido: **eliminarlo no sustituye su rotación/revocación**. El incidente debe quedar registrado sin repetir el valor secreto.

## V. Datos mínimos

El piloto solo almacena datos necesarios para identidad académica mínima, progreso, estado de actividad, entrega y retroalimentación. No se añade cédula, teléfono, dirección u otra PII sin nueva especificación y justificación.

## VI. Persistencia confiable

- `activity_state`: mutable, revisionado y con autosave;
- `submission`: snapshot inmutable.

Toda actualización de estado soporta control de concurrencia para evitar sobrescrituras silenciosas.

## VII. Compatibilidad de actividades

Toda actividad persistente tiene `activity_version`. Cambiar la forma del estado requiere estrategia explícita: migrar, conservar versión anterior o invalidar de forma visible. Nunca se descarta silenciosamente trabajo de un estudiante.

## VIII. Aislamiento de código heredado/no confiable

El shell autenticado no ejecuta laboratorios heredados complejos en el mismo origen. Los laboratorios se aíslan en origen separado y la interoperabilidad usa un protocolo explícito con validación exacta de `origin` y `source`. Ningún token LMS cruza esa frontera.

## IX. Validación adversarial

Como mínimo se prueban:

- acceso entre estudiantes;
- acceso entre cohortes/docentes;
- escalada de rol;
- manipulación de IDs;
- XSS almacenado;
- payload sobredimensionado;
- reenvío/edición de entregas;
- concurrencia de autosave;
- mensajes cross-origin manipulados;
- exposición de secretos;
- regresiones de supply chain.

## X. Supply chain reproducible

- Actions externas fijadas por SHA completo;
- secretos fuera del repo;
- dependencias nuevas justificadas y versionadas;
- descarga de artefactos sin ejecutar scripts innecesarios;
- integridad registrada/verificada cuando se vendorizan binarios;
- CodeQL, Dependency Review y OpenSSF Scorecard como controles automatizados;
- permisos de CI mínimos.

## XI. Piloto antes que plataforma

El recorrido vertical prioritario sigue siendo:

`login -> S7 -> autosave -> cerrar -> otro dispositivo -> continuar -> entregar -> docente ve`

No se añaden funciones genéricas de LMS antes de que seguridad, persistencia y recuperación estén verificadas.

## XII. Definition of Done

Una tarea solo está terminada cuando:

1. satisface su criterio de aceptación;
2. pasa validaciones ANDESDB;
3. pasa `tools/security_gate.py` cuando aplica;
4. pasa pruebas de autorización/seguridad relevantes;
5. no introduce secretos;
6. no degrada `main` ni una frontera de confianza;
7. deja spec, threat model y documentación sincronizados;
8. no deja Critical/High abierto para un piloto humano.
