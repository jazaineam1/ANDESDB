# Plan técnico · Spec 001

## Decisión arquitectónica

Frontend existente de ANDESDB + Supabase como backend gestionado para Auth/PostgreSQL/API/RLS. La rama no integra todavía credenciales ni proyecto productivo.

## Principios

- conservar el frontend actual;
- introducir una capa de persistencia reutilizable;
- RLS como frontera de autorización principal;
- no confiar en IDs, roles, timestamps ni porcentajes calculados por el cliente;
- separar estado mutable de entrega inmutable;
- evitar servidor propio mientras no sea necesario;
- usar funciones privilegiadas solo para operaciones que el cliente no deba poder ejecutar directamente.

## Componentes

### 1. Auth

Supabase Auth con proveedor por decidir en `spec.md`.

Resultado requerido:
- sesión autenticada;
- `auth.uid()` disponible para RLS;
- login no implica matrícula.

### 2. Persistencia académica

Migraciones ya existentes en `supabase/migrations/` proporcionan:
- profiles;
- roles;
- courses/cohorts;
- enrollments;
- activities;
- activity_progress;
- activity_state;
- submissions;
- feedback.

Antes de implementación UI deben ejecutarse contra un proyecto de prueba y superarse pruebas adversariales.

### 3. SDK frontend LMS

Crear módulo pequeño, sin framework obligatorio:

`assets/lms/lms-client.js`

Responsabilidades:
- obtener sesión;
- resolver matrícula autorizada;
- cargar estado;
- guardar estado con revisión esperada;
- marcar sincronización;
- crear entrega mediante flujo permitido.

No debe:
- conocer `service_role`;
- decidir permisos;
- aceptar HTML no confiable;
- escribir roles/matrículas.

### 4. Adaptador de actividad S7

Crear un adaptador específico:

`assets/lms/adapters/s7-constructor.js`

Contrato propuesto:

```js
serialize() -> object
hydrate(state) -> void
validate(state) -> { ok, errors }
getProgress() -> { step, percent }
```

La actividad no conoce detalles internos de Supabase; solo entrega/recibe estado.

### 5. Autosave

- debounce inicial: 800 ms;
- guardar únicamente con usuario autenticado y matrícula válida;
- mostrar `Guardando…`, `Guardado`, `Error de sincronización`;
- usar `revision` para control optimista;
- conflicto => recargar/combinar mediante flujo visible, nunca last-write-wins silencioso.

### 6. Entrega

La entrega se genera desde estado confirmado del servidor, no desde un objeto arbitrario suministrado por el navegador. Si la implementación requiere RPC/Edge Function, esa operación será privilegiada y validará identidad, matrícula, actividad y versión.

### 7. Vista docente

En piloto: lectura de progreso + snapshot de entrega. No se implementa analítica compleja.

Todo texto de estudiante se renderiza con APIs seguras (`textContent`) y se evita `innerHTML` salvo contenido estático controlado por el repositorio.

## Secuencia de implementación

1. Validar migraciones en Supabase aislado.
2. Ejecutar matriz RLS con identidades ficticias.
3. Resolver preguntas abiertas de Auth.
4. Implementar `lms-client.js`.
5. Implementar adaptador S7.
6. Integrar autosave.
7. Probar restauración entre dos navegadores/dispositivos.
8. Implementar entrega inmutable.
9. Implementar vista docente mínima.
10. Pentest funcional/adversarial del piloto.
11. Prueba con 3–5 usuarios ficticios.
12. Solo después, piloto real pequeño.

## Observabilidad mínima

Registrar en servidor únicamente eventos necesarios para diagnóstico:
- auth success/failure: usar proveedor, no replicar contraseñas;
- autosave success/conflict/failure sin guardar contenido sensible en logs;
- submission created;
- authorization denied agregada cuando sea útil.

Nunca loggear tokens completos ni `state_json` completo.

## Rollback

El piloto no modifica `main`. Si falla:
- se deshabilita el deployment del branch;
- el curso público actual sigue operando;
- las migraciones se prueban en proyecto Supabase desechable/aislado;
- no se mezclan datos de estudiantes reales con pruebas.

## Coste operativo esperado del piloto

Objetivo: permanecer dentro del tier gratuito durante validación técnica. Pasar a plan con backups automáticos antes de tratar datos académicos reales si la política de retención/recuperación lo requiere.

## Gates

No pasar a usuarios reales hasta que:
- RLS adversarial = PASS;
- CodeQL = PASS;
- secret scan = PASS;
- no existan credenciales reales en repo;
- restauración entre dispositivos = PASS;
- entrega inmutable = PASS;
- revisión manual de privacidad = PASS.
