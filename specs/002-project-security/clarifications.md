# Clarifications · Spec 002

## C1 · SDD vs estándar de seguridad

SDD define **cómo** se cambia el software. No sustituye los controles de seguridad. Los requisitos de seguridad se derivan de SSDF/CSF/OWASP/OpenSSF y se convierten en spec, tareas y pruebas SDD.

## C2 · ¿“Seguir todos los estándares” significa certificación?

No. El piloto debe aplicar rigurosamente los controles pertinentes y documentar su cobertura. No se afirmará certificación ISO, PCI, SOC 2, ASVS ni otra sin auditoría/certificación correspondiente.

## C3 · Nivel ASVS

El objetivo mínimo del LMS autenticado y API/RPC es **ASVS 5.0 Level 2 aplicable**. Level 3 no se declara necesario para este piloto educativo de bajo volumen, aunque controles L3 pueden adoptarse cuando sean baratos y pertinentes.

## C4 · Laboratorio heredado

El constructor S7 contiene bastante JavaScript heredado y usa almacenamiento local. No debe compartir origen con el shell que mantiene sesión LMS. Se aislará en un segundo origen y se comunicará mediante un bridge de mensajes.

## C5 · Credencial encontrada

Una connection string con contraseña fue detectada en material versionado. Se elimina del árbol de la rama piloto, pero se considera comprometida hasta que el proveedor confirme rotación/revocación. No se copia su valor a Issues, docs, logs ni commits nuevos.

## C6 · Dependencias vendorizadas

No se confiará en descargas CDN sin verificación. El workflow obtiene paquetes de versiones exactas mediante `npm pack --ignore-scripts`, copia solo archivos necesarios y genera SHA-256 del árbol resultante.

## C7 · Protección de ramas

Es un control obligatorio previo a usuarios reales. Si el conector de GitHub no permite modificar rulesets, queda como gate manual con evidencia en `verify.md`; no se simula que está activo.
