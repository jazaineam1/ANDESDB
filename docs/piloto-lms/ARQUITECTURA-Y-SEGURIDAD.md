# Arquitectura y seguridad · Piloto LMS ANDESDB

Este documento describe **cómo queda construido** el piloto. El proceso de desarrollo es SDD y su fuente de verdad está en `specs/001-lms-pilot/`.

## Arquitectura

```text
Navegador
  |
  | HTML/CSS/JS estático
  v
/pilot/
  |- index.html          login + progreso
  |- s7.html             host persistente de S7
  `- teacher.html        vista docente mínima
  |
  | apikey: sb_publishable_...
  | Authorization: Bearer <JWT de usuario>
  v
Supabase
  |- Auth: email OTP
  |- PostgREST/RPC
  `- PostgreSQL
       |- RLS
       |- activity_state
       |- activity_progress
       |- submissions
       `- funciones SECURITY DEFINER
```

No existe un servidor Node/Python propio en el piloto.

## ADR-01 · Frontend público por diseño

Todo JavaScript, HTML, URL del proyecto y publishable key se consideran recuperables por cualquier visitante. Ningún control depende de ocultarlos.

Las claves secretas/administrativas quedan fuera del navegador y del repositorio.

## ADR-02 · Auth no es autorización

Supabase Auth responde **quién es** el usuario. PostgreSQL decide **qué puede hacer**.

Una sesión válida no crea matrícula. Para acceder a S7 deben coincidir:

- usuario autenticado;
- enrollment activo;
- cohorte activa;
- actividad publicada/activa/liberada.

## ADR-03 · RLS + RPC

RLS permanece activo como aislamiento de filas. Las operaciones sensibles se realizan además mediante RPC para no confiar en campos elegidos por el cliente.

El autosave recibe:

- `activity_id`;
- estado JSON;
- revisión esperada;
- paso actual.

El servidor deriva `enrollment_id` desde `auth.uid()`.

## ADR-04 · Concurrencia explícita

`activity_state.revision` evita el patrón last-write-wins silencioso.

```text
A lee rev 5        B lee rev 5
A guarda -> rev 6
                   B intenta guardar rev 5
                   -> 40001 revision conflict
```

El cliente detiene autosave y ofrece copiar el trabajo local antes de cargar la versión remota.

## ADR-05 · Borrador y entrega separados

`activity_state` es mutable.

`submissions` es un snapshot inmutable para el estudiante. El navegador no envía el snapshot que desea guardar: llama `submit_activity(activity_id, revision)` y PostgreSQL copia el último estado confirmado.

## ADR-06 · S7 no se reescribe

El taller `constructor-abc.html` ya sabe exportar/importar su estado. `/pilot/s7.html` lo aloja en un iframe same-origin y lo adapta al contrato LMS.

Estado persistido v1:

```json
{
  "schema": 1,
  "activity": "s7-restaurante-abc",
  "case": "abc",
  "modelCode": "...",
  "step": 4
}
```

## ADR-07 · Sesión del navegador

El piloto conserva access/refresh token en `sessionStorage`, no en `localStorage`. Esto reduce persistencia entre cierres completos, pero no protege contra un XSS same-origin. Por eso son obligatorios:

- CSP;
- sin scripts CDN nuevos;
- sin `innerHTML` para contenido de estudiantes;
- CodeQL;
- pruebas XSS almacenado.

Una sesión basada en cookie HttpOnly requeriría un BFF/backend y queda fuera del alcance inicial.

## ADR-08 · Email OTP y acceso cerrado

El piloto usa OTP por correo y `create_user: false`. Las cuentas se crean administrativamente y la matrícula es una operación separada.

No se implementan contraseñas propias.

## Matriz resumida de autorización

| Operación | Student propio | Student ajeno | Teacher cohorte | Teacher otra cohorte |
|---|---:|---:|---:|---:|
| Ver progreso | sí | no | sí | no |
| Ver borrador | sí | no | sí | no |
| Guardar borrador | sí | no | no | no |
| Entregar | sí | no | no | no |
| Cambiar role/enrollment | no | no | no | no |
| Ver submission | sí | no | sí | no |

Las operaciones administrativas se ejecutan fuera del navegador.

## Superficie de datos

Se persiste únicamente:

- UUID interno;
- nombre visible opcional;
- rol;
- matrícula/cohorte;
- progreso;
- estado de actividad;
- entregas;
- feedback si posteriormente se activa.

No se incorpora cédula, teléfono, dirección o datos de perfil innecesarios.

## Límites

- estado JSON <= 512 KiB;
- actividad S7 = 7 pasos;
- máximo inicial de entregas = 3;
- autosave cliente = debounce de 800 ms;
- piloto real inicial = máximo 10 participantes;
- retención de piloto = 90 días después del cierre, sujeta a decisión de exportar/anonimizar/eliminar.

## Cabeceras/CSP del piloto

Las páginas `/pilot/` incluyen CSP que exige:

- scripts y estilos del mismo origen;
- conexión solo al mismo origen y `https://*.supabase.co`;
- sin `object-src`;
- `base-uri` y `form-action` restringidos.

El contenido heredado dentro del iframe mantiene su runtime actual; el host LMS no introduce scripts remotos.

## Supply chain

El piloto deliberadamente no añade npm ni SDK de runtime. Usa `fetch` nativo contra Auth/PostgREST.

CI ejecuta:

- validación del curso;
- `node --check` en `assets/lms/*.js`;
- comprobación de artefactos SDD;
- secret guards;
- verificación de CSP/fronteras frontend;
- CodeQL JavaScript/TypeScript y Python.

Snyk se activa si en el futuro se añaden dependencias o se configura su token; no se simula cobertura inexistente.

## Gates antes de datos reales

No hay GO mientras falte cualquiera de estos:

1. migraciones 001–004 aplicadas desde cero;
2. Security Advisor revisado;
3. A/B cross-user = 0 accesos;
4. docente A/B = aislamiento correcto;
5. XSS almacenado = 0 ejecuciones;
6. 10/10 restauraciones multi-dispositivo;
7. submissions inmutables;
8. backup y restauración probados;
9. aviso de privacidad revisado;
10. CI verde.
