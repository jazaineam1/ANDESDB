# Borrador de aviso de privacidad · Piloto LMS ANDESDB

> **BORRADOR TÉCNICO.** No sustituye la revisión jurídica/institucional aplicable. No publicar para participantes reales sin identificar responsable de tratamiento, canales de contacto y base/autorización correspondiente.

## Finalidad

Durante el piloto se registrará información mínima para comprobar si ANDESDB puede conservar el avance de una actividad entre dispositivos y permitir al docente revisar progreso/entregas.

## Datos previstos

- identificador interno de cuenta;
- correo gestionado por el sistema de autenticación;
- nombre visible opcional;
- matrícula y rol del piloto;
- paso/progreso de la actividad;
- estado del taller S7;
- entregas y sus timestamps;
- feedback docente si se habilita posteriormente.

El piloto no necesita cédula, teléfono, dirección, fecha de nacimiento ni información sensible para cumplir su objetivo.

## Acceso

- cada estudiante puede acceder únicamente a su propio progreso/estado/entregas;
- docentes pueden acceder únicamente a cohortes asignadas;
- administración técnica tiene acceso excepcional para operar, probar y responder incidentes.

## Conservación propuesta

Los datos del piloto se conservan hasta 90 días después de su cierre. Antes de vencer el plazo se define si corresponde exportar, anonimizar o eliminar.

## Proveedores

La solución técnica propuesta usa Supabase para autenticación y persistencia. El hosting del frontend permanece separado y no contiene la base académica.

Antes del piloto real debe revisarse la región del proyecto, condiciones del proveedor, acuerdos institucionales y cualquier requisito de transferencia/tratamiento aplicable.

## Seguridad

Se aplican RLS, mínimo privilegio, separación de roles, entrega inmutable, análisis estático, pruebas adversariales y backup/restore drill. Ningún sistema puede prometer riesgo cero; cualquier incidente relevante detiene el piloto mientras se evalúa.

## Derechos/canales

**PENDIENTE DE COMPLETAR ANTES DE PILOTO REAL:**

- responsable institucional del tratamiento;
- correo/canal para consultas, corrección o eliminación;
- fundamento/autorización aplicable;
- enlace a política institucional vigente;
- fecha de inicio y cierre del piloto.

## Consentimiento/participación

La prueba real debe ser presentada como piloto experimental y no como sistema oficial de calificación. La participación, obligatoriedad y mecanismo de autorización deben ser definidos por la institución antes de usar información de estudiantes reales.
