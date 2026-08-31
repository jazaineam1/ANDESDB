# Spec 002 · Seguridad integral de ANDESDB

Estado: aprobado para implementación en `piloto-lms-sdd-secure`.

## Problema

El piloto LMS introduce identidad y datos de estudiantes, pero la frontera de seguridad real incluye el repositorio completo: material docente, workflows, dependencias vendorizadas, scripts, hosting y base de datos. Asegurar solo Supabase deja abiertas rutas de supply chain, credenciales versionadas, XSS del contenido heredado y CI con permisos excesivos.

## Objetivo

Convertir la seguridad en una propiedad verificable del **proyecto ANDESDB**, manteniendo SDD como proceso de desarrollo y usando estándares reconocidos como fuente de controles.

## Activos

- credenciales y secretos;
- cuentas/sesiones;
- progreso, borradores, entregas y feedback;
- integridad del contenido del curso;
- workflows y credenciales CI;
- binarios/dependencias vendorizadas;
- disponibilidad y capacidad de recuperación.

## Requisitos funcionales de seguridad

- **SR-01** Cero credenciales reutilizables o connection strings con password en el árbol Git activo.
- **SR-02** Todo secreto previamente publicado se considera comprometido y debe rotarse/revocarse; borrarlo del árbol no es suficiente.
- **SR-03** Toda GitHub Action externa queda fijada por SHA completo.
- **SR-04** Ningún workflow usa `write-all` ni `pull_request_target` sin una excepción SDD explícita y threat model específico.
- **SR-05** CodeQL, Dependency Review y OpenSSF Scorecard forman parte de los controles automatizados del proyecto.
- **SR-06** Dependencias/binarios de laboratorio se obtienen desde versiones exactas, sin ejecutar scripts de instalación, y se registra SHA-256 del árbol vendorizado.
- **SR-07** El shell LMS autenticado no comparte origen con el laboratorio heredado S7. La comunicación entre orígenes usa `postMessage` con validación exacta de `origin` y `source`.
- **SR-08** Datos controlados por estudiante nunca se convierten en HTML ejecutable en vistas LMS.
- **SR-09** El acceso académico aplica deny-by-default, mínimo privilegio, RLS y RPC que deriva la identidad desde `auth.uid()`.
- **SR-10** ASVS 5.0 Level 2 es el objetivo mínimo aplicable al LMS autenticado/API; desviaciones se documentan, no se ocultan.
- **SR-11** Critical/High abiertos bloquean piloto humano.
- **SR-12** `main` y la rama del piloto deben tener ruleset/branch protection antes de participantes reales.
- **SR-13** Backups solo cuentan como control si existe prueba de restauración.
- **SR-14** Cualquier cambio material de frontera de confianza actualiza spec, threat model y pruebas.

## Baseline de estándares

- NIST SP 800-218 SSDF 1.1 (final);
- NIST CSF 2.0;
- OWASP ASVS 5.0.0, objetivo L2 aplicable;
- OWASP Top 10 2025;
- OWASP API Security Top 10 2023;
- OpenSSF Scorecard;
- SLSA para artefactos/builds cuando aplique procedencia.

Esto es una alineación/objetivo de controles, no una afirmación de certificación.

## Criterios de aceptación

1. `python tools/security_gate.py` devuelve `SECURITY GATE: OK`.
2. El árbol activo de la rama no contiene connection strings con password ni secretos de alta confianza.
3. Todas las Actions externas de workflows están fijadas a SHA de 40 caracteres.
4. El laboratorio S7 se carga desde un origen separado configurable y el host no accede directamente a su DOM/globals.
5. El bridge solo acepta mensajes de su `window.parent` y del origen esperado; el shell solo acepta mensajes del origen de laboratorio configurado.
6. CI valida el gate, CodeQL y Scorecard; PRs ejecutan dependency review.
7. Existe evidencia/documentación de la credencial descubierta y la obligación de rotarla sin publicar su valor.
8. Branch protection, rotación de credencial, Supabase real, MFA y restore test permanecen gates manuales si no existe herramienta para ejecutarlos desde el repositorio.
