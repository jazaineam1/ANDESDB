# Arquitectura y seguridad · Piloto LMS ANDESDB

El proceso de desarrollo es SDD. La función LMS está en `specs/001-lms-pilot/` y el hardening integral del proyecto en `specs/002-project-security/`.

## Arquitectura

```text
ORIGEN A · shell autenticado
https://<lms-origin>
  /pilot/index.html
  /pilot/s7.html
  /pilot/teacher.html
  sessionStorage: sesión Supabase
        |
        | fetch HTTPS
        v
  Supabase Auth/PostgREST/RPC
        |
        v
  PostgreSQL + RLS

        |
        | iframe sandbox + postMessage
        | origin/source exactos
        v

ORIGEN B · laboratorio aislado
https://<lab-origin>
  /pilot-lab/s7-bridge.html
        |
        | mismo origen del laboratorio
        v
  /Presentaciones/M3/constructor-abc.html
```

El laboratorio **no recibe tokens Supabase**. El shell autenticado **no inspecciona DOM, localStorage ni globals del laboratorio**.

## ADR-01 · Frontend público por diseño

HTML, JavaScript, URL de proyecto y publishable key son públicos. Ningún control depende de ocultarlos. Secrets y credenciales administrativas quedan fuera del navegador/Git.

## ADR-02 · Auth no es autorización

Una sesión válida no matricula. Para acceder a una actividad deben coincidir usuario autenticado, enrollment activo, cohorte activa y actividad publicada/liberada.

## ADR-03 · RLS + RPC

RLS aísla filas. Escrituras sensibles usan RPC; el servidor deriva `enrollment_id` desde `auth.uid()` y no confía en IDs de ownership enviados por cliente.

## ADR-04 · Concurrencia explícita

`activity_state.revision` evita last-write-wins silencioso. Una revisión obsoleta produce conflicto y el cliente no sobrescribe.

## ADR-05 · Borrador y entrega separados

`activity_state` es mutable. `submissions` es snapshot inmutable. `submit_activity` copia el último estado confirmado en servidor; el navegador no decide el snapshot final.

## ADR-06 · S7 se conserva pero se aísla

El constructor heredado continúa exportando/importando su modelo. El bridge, en el origen de laboratorio, puede hablar con ese constructor. El shell solo habla con el bridge mediante un protocolo mínimo:

- `READY`;
- `CHANGE`;
- `GET_STATE`;
- `SET_STATE`;
- `RESPONSE`.

Host y bridge validan **`event.origin` y `event.source`** antes de procesar mensajes. No se usa `'*'` como target origin.

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

La sesión está en `sessionStorage`, no `localStorage`. Esto no protege de XSS same-origin; por eso el código heredado vive en otro origen, el LMS usa CSP estricta y el contenido de estudiante se representa como texto.

## ADR-08 · OTP y acceso cerrado

Email OTP con cuentas precreadas; `create_user:false` es defensa adicional, no sustituto de cerrar la creación pública en Supabase. No hay contraseñas propias.

## Matriz resumida

| Operación | Student propio | Student ajeno | Teacher cohorte | Teacher otra cohorte |
|---|---:|---:|---:|---:|
| Ver progreso | sí | no | sí | no |
| Ver borrador | sí | no | sí | no |
| Guardar borrador | sí | no | no | no |
| Entregar | sí | no | no | no |
| Cambiar role/enrollment | no | no | no | no |
| Ver submission | sí | no | sí | no |

## Datos y límites

Solo UUID interno, nombre opcional, rol, matrícula/cohorte, progreso, estado, entrega y feedback. Estado JSON <= 512 KiB, 7 pasos S7, máximo inicial 3 entregas y debounce 800 ms.

## CSP/orígenes

Antes de habilitar se ejecuta `tools/configurar_piloto_lms.py`, que exige:

- origen HTTPS exacto de Supabase;
- origen HTTPS exacto del shell;
- origen HTTPS **distinto** del laboratorio;
- publishable key, nunca secret key.

El shell usa `script-src 'self'`, `object-src 'none'`, `base-uri 'none'` y `frame-ancestors 'none'`. S7 solo puede enmarcar el origen de laboratorio configurado. El bridge solo puede ser enmarcado por el origen LMS configurado.

## Supply chain

- Actions externas por SHA completo;
- CodeQL;
- Dependency Review;
- OpenSSF Scorecard;
- `tools/security_gate.py`;
- motores WASM vendorizados desde versiones npm exactas con `--ignore-scripts` y SHA-256 del árbol resultante.

## Gates antes de datos reales

No hay GO mientras falte: rotar cualquier credencial expuesta; branch protection/ruleset; migraciones 001–004; Security Advisor; matriz A/B/teacher A/B; XSS=0 ejecuciones; mensajes cross-origin falsos ignorados; 10/10 restauraciones; submission inmutable; MFA teacher/admin; backup+restore probado; privacidad revisada; CI/CodeQL/Scorecard sin bloqueadores Critical/High.
