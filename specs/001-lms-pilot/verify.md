# Verify · Spec 001

Estado: **PENDIENTE DE ENTORNO SUPABASE AISLADO**

Este documento se completa con evidencia real. No marcar PASS a partir de inspección de código.

## Entorno

- Project ref: `PENDIENTE`
- Región: `PENDIENTE`
- Fecha de migración limpia: `PENDIENTE`
- Commit probado: `PENDIENTE`
- Responsable: `PENDIENTE`

No registrar aquí publishable/secret keys, correos reales ni UUID de participantes reales.

## V01 · Migraciones

- [ ] 001 aplicada desde cero
- [ ] 002 aplicada
- [ ] 003 aplicada
- [ ] 004 aplicada
- [ ] reejecución idempotente revisada donde corresponda
- [ ] Security Advisor revisado

Resultado/notas: `PENDIENTE`

## V02 · Autorización

| Prueba | Esperado | Resultado |
|---|---|---|
| A lee A | permitido | PENDIENTE |
| A lee B | 0/denegado | PENDIENTE |
| B escribe A | denegado | PENDIENTE |
| sin matrícula | 0 académico | PENDIENTE |
| anon | 0 académico | PENDIENTE |
| student→teacher | denegado | PENDIENTE |
| autoenrollment | denegado | PENDIENTE |
| teacher A→cohorte B | denegado | PENDIENTE |

Gate: **PENDIENTE**

## V03 · Autosave/concurrencia

- [ ] primer save crea revision 1
- [ ] save siguiente incrementa revision
- [ ] revisión obsoleta produce `40001`
- [ ] estado nuevo no se sobrescribe
- [ ] payload >512 KiB falla
- [ ] paso fuera de rango falla

Gate: **PENDIENTE**

## V04 · Multi-dispositivo

Registrar 10 recorridos ficticios antes de estudiantes reales.

| Ciclo | A guarda | B restaura modelo | B restaura paso | Resultado |
|---:|---|---|---|---|
| 1 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| 2 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| 3 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| 4 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| 5 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| 6 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| 7 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| 8 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| 9 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |
| 10 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE |

Gate: 10/10 requeridos.

## V05 · Submission

- [ ] snapshot coincide con estado confirmado
- [ ] navegador no puede elegir snapshot arbitrario
- [ ] UPDATE student denegado
- [ ] DELETE student denegado
- [ ] intento 4 denegado si max_attempts=3

Gate: **PENDIENTE**

## V06 · XSS

Payloads de `PRUEBAS-ADVERSARIALES.md` guardados como dato de laboratorio y abiertos en vista docente.

- [ ] 0 script ejecutado
- [ ] payload visible como texto
- [ ] CSP sin violaciones inesperadas necesarias para la app

Gate: **PENDIENTE**

## V07 · Auth

- [ ] cuenta precreada recibe OTP
- [ ] cuenta no autorizada no se autoinscribe
- [ ] UI no revela de forma diferencial existencia de cuenta
- [ ] expiración/refresh funciona
- [ ] logout limpia sesión del navegador

Gate: **PENDIENTE**

## V08 · Backup/restore

- [ ] backup configurado
- [ ] restore drill ejecutado con datos ficticios
- [ ] resultado documentado sin PII

Gate: **PENDIENTE**

## V09 · CI

- [ ] validación ANDESDB verde
- [ ] JS syntax verde
- [ ] secret guards verdes
- [ ] CodeQL JS/TS verde
- [ ] CodeQL Python verde

Run/commit: `PENDIENTE`

## V10 · Privacidad

- [ ] `PRIVACIDAD-PILOTO.md` revisado por responsable aplicable
- [ ] responsable/canal/base definidos
- [ ] retención aceptada

Gate: **PENDIENTE**

# Decisión

- [ ] GO — puede iniciar piloto real <=10 participantes
- [ ] ITERATE — corregir y repetir Verify
- [ ] STOP — no continuar

Decisión, fecha y justificación: `PENDIENTE`
