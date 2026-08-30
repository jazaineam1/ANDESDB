# Operación · Piloto LMS ANDESDB

Runbook para entorno **aislado**. No usar datos reales antes de superar `specs/001-lms-pilot/verify.md` y `specs/002-project-security/verify.md`.

## 0. Bloqueadores previos

- trabajar solo en `piloto-lms-sdd-secure`;
- **rotar/revocar la credencial de BD detectada durante el hardening** antes de reutilizar ese servicio;
- no versionar passwords, connection strings, secret keys, service role ni listados de estudiantes;
- activar ruleset/branch protection antes de piloto humano;
- disponer de dos orígenes HTTPS distintos: uno LMS y otro laboratorio.

## 1. Infraestructura

Crear:

1. proyecto Supabase exclusivo del piloto;
2. deployment LMS, p. ej. `https://andesdb-pilot.example`;
3. deployment laboratorio, p. ej. `https://andesdb-lab-pilot.example`.

Ambos deployments pueden salir de la misma rama, pero **no pueden compartir origen**. El laboratorio no recibe configuración Supabase.

## 2. Base de datos

Aplicar desde un proyecto vacío, en orden:

1. `supabase/migrations/202608300001_lms_pilot.sql`
2. `supabase/migrations/202608300002_lms_pilot_hardening.sql`
3. `supabase/migrations/202608300003_lms_pilot_rpc.sql`
4. `supabase/migrations/202608300004_lms_pilot_catalog.sql`

Si una falla, descartar entorno de prueba/corregir y repetir desde cero. Después ejecutar Supabase Security Advisor.

## 3. Auth

- registro abierto deshabilitado;
- cuentas creadas/invitadas administrativamente;
- email OTP con `{{ .Token }}`;
- redirects exactos del origen LMS, sin wildcards amplios;
- `create_user:false` del cliente es defensa adicional, no control principal;
- MFA obligatorio para teacher/admin antes de usuarios reales.

## 4. Identidades de prueba

Crear al menos `student-a`, `student-b`, `student-no-enrollment`, `teacher-a`, `teacher-b` y, si hace falta, `admin-test`. Correos de prueba nunca se versionan.

Usar `supabase/pilot-admin.sql` para matrículas/asignaciones. Nunca realizar estas operaciones desde el navegador.

## 5. Autorización adversarial

Ejecutar `supabase/tests/rls-adversarial.sql` y `docs/piloto-lms/PRUEBAS-ADVERSARIALES.md`.

Gate: A/B cross-user = 0 accesos, no-enrollment = 0 datos académicos, `anon` = 0 datos, student no eleva rol ni crea enrollment, teacher A no ve cohorte B, submission inmutable, payload >512 KiB rechazado y revisión obsoleta produce conflicto.

## 6. Configurar frontend

No editar CSP/configuración manualmente:

```bash
python tools/configurar_piloto_lms.py \
  --project-ref PROJECT_REF \
  --publishable-key sb_publishable_... \
  --lms-origin https://LMS_HOST \
  --lab-origin https://LAB_HOST \
  --enable
```

El script exige HTTPS, rechaza claves secretas, exige orígenes distintos y configura:

- `connect-src` al Supabase exacto;
- `frame-src` de S7 al laboratorio exacto;
- `frame-ancestors` del bridge al LMS exacto;
- `s7SandboxOrigin`.

La publishable key es pública; nunca usar `sb_secret_*`/service role.

## 7. Construir dos artefactos, no desplegar el repositorio completo

Después de configurar el piloto:

```bash
python tools/build_pilot_deploy.py \
  --lms-origin https://LMS_HOST
```

El comando produce exclusivamente:

```text
dist/pilot-lms/   -> desplegar en https://LMS_HOST
dist/pilot-lab/   -> desplegar en https://LAB_HOST
```

**Regla de seguridad:** nunca publicar la raíz completa del repositorio en el origen autenticado. Si se hiciera, el constructor heredado volvería a estar accesible bajo el mismo origen que mantiene la sesión y se perdería una barrera importante frente a XSS.

El artefacto LMS contiene solo el shell y los assets LMS necesarios. El artefacto de laboratorio contiene el bridge, el constructor S7 y los recursos locales que ese laboratorio necesita. El builder genera además `_headers` con CSP y cabeceras de hardening para cada origen.

### LMS origin

Verificar desde la **respuesta HTTP real**, no solo desde el HTML fuente:

- CSP exacta;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer`;
- `Permissions-Policy` restrictiva;
- `frame-ancestors`/protección contra framing;
- `Cache-Control: no-store` para el shell piloto.

### Lab origin

El laboratorio mantiene temporalmente inline JS/CSS y WebAssembly porque el constructor heredado lo requiere, pero esa deuda queda confinada al origen de laboratorio, donde no existe una sesión Supabase. No desplegar allí `auth-client.js`, `lms-client.js`, configuración privada ni secretos.

El iframe del shell usa sandbox. El bridge valida padre/origen exacto y el shell valida bridge/origen exacto.

## 8. Pruebas cross-origin obligatorias

- mensaje con `event.origin` falso hacia el host: ignorado;
- mensaje desde ventana diferente: ignorado;
- mensaje hacia bridge desde padre/origen no autorizado: ignorado;
- XSS/control total del lab no permite leer `sessionStorage` del LMS;
- Network del lab no contiene Authorization/JWT ni claves Supabase;
- el estado sigue guardando/restaurando por bridge.

## 9. Recorrido estudiante

Con `student-a`: login -> S7 -> modificar -> esperar Guardado -> cerrar -> dispositivo B -> login -> restaurar mismo paso/modelo -> continuar -> entregar. Repetir 10 veces; gate 10/10.

## 10. Recorrido docente

Con `teacher-a`: ver solo cohorte asignada, revisar progreso/entrega, probar payload XSS literal, intentar cohorte B y confirmar denegación.

## 11. Supply chain

Antes del GO:

```bash
python tools/security_gate.py
```

Y verificar:

- `Security · piloto LMS SDD`;
- CodeQL;
- Dependency Review en PR;
- vendoring WASM reproducible con SHA-256.

OpenSSF Scorecard queda preparado para ejecutarse en `main`, porque la acción oficial solo soporta la rama por defecto. Debe revisarse cuando el baseline de seguridad se promueva a `main`; no se considera evidencia verde del branch piloto.

No promover con Critical/High abierto.

## 12. Backup/restore

Configurar backup según plan, generar un registro de prueba, restaurar en entorno seguro y documentar resultado. Un backup no restaurado no cuenta.

## 13. Privacidad/retención

Completar `PRIVACIDAD-PILOTO.md`: responsable, contacto, base aplicable, proveedor/región, fechas y retención. A los 90 días del cierre decidir exportar, anonimizar o eliminar; no conservar indefinidamente por defecto.

## 14. Rollback / kill switch

Ante incidente: retirar/deshabilitar deployment o `enabled:false`, revocar sesiones/secretos, deshabilitar matrículas si aplica, preservar evidencia mínima, corregir en rama, añadir regresión y repetir Verify completo antes de reabrir.
