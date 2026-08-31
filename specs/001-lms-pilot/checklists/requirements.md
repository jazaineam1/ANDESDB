# Checklist de requisitos · Spec 001

## Alcance

- [x] El piloto tiene un único recorrido vertical: login → S7 → autosave → reabrir → entregar → docente ve.
- [x] No se incluyeron foros, chat, certificados, pagos ni LMS genérico.
- [x] La actividad piloto está versionada (`s7-restaurante-abc`, v1).

## Identidad y autorización

- [x] Login no crea matrícula.
- [x] Registro abierto queda fuera del frontend.
- [x] El navegador no puede asignar roles ni matrículas.
- [x] La autorización final se ejecuta en PostgreSQL/RLS/RPC.
- [x] El cliente nunca necesita una clave privilegiada.
- [ ] Ejecutar pruebas con identidades reales de laboratorio en Supabase.

## Persistencia

- [x] Existe estado mutable separado de submission inmutable.
- [x] El estado tiene revisión para control optimista.
- [x] Los conflictos no se resuelven con sobrescritura silenciosa.
- [x] El payload se limita a 512 KiB.
- [x] El porcentaje se deriva en servidor.
- [x] La entrega se genera desde el estado confirmado en servidor.
- [ ] Validar 10/10 restauraciones entre navegadores reales.

## Seguridad del frontend

- [x] CSP del piloto bloquea scripts de terceros y `object-src`.
- [x] La vista docente representa contenido del estudiante con `textContent`.
- [x] La sesión no se persiste como progreso académico en `localStorage`.
- [x] El frontend rechaza claves `sb_secret_`/service role.
- [x] No se registran tokens ni estados completos en consola.
- [ ] Ejecutar XSS almacenado contra backend desplegado.

## Seguridad del backend

- [x] RLS habilitado en tablas académicas expuestas.
- [x] `anon` no tiene acceso a tablas académicas.
- [x] SECURITY DEFINER usa `search_path` fijo.
- [x] Autosave deriva matrícula desde `auth.uid()`.
- [x] Submission deriva snapshot desde servidor.
- [x] Docente queda restringido a cohortes asignadas.
- [ ] Ejecutar Security Advisor después de migraciones.
- [ ] Ejecutar matriz IDOR/BOLA con A/B y docente A/B.

## Operación

- [x] Configuración pública y secretos están separados.
- [x] Existe procedimiento de alta/matrícula administrativa.
- [x] Existe política de retención de piloto (90 días).
- [ ] Configurar backup antes de usuarios reales.
- [ ] Probar restauración del backup.
- [ ] Publicar aviso de privacidad aplicable al piloto real.

## Gates

No se marca GO mientras exista una casilla pendiente relacionada con aislamiento, backups, restauración multi-dispositivo o XSS.
