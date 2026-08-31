# Estimación · Piloto LMS ANDESDB

La mayor parte del trabajo de **código base** del vertical ya está versionada en la rama. Lo que queda para convertirlo en una prueba humana es principalmente aprovisionamiento, verificación real y ajustes derivados de las pruebas.

## Infraestructura

| Componente | Piloto técnico | Piloto real pequeño |
|---|---:|---:|
| Hosting estático actual | 0 USD | 0 USD inicialmente |
| Supabase | 0 USD posible | presupuestar plan con backups según política |
| Dominio adicional | opcional | opcional |
| SMTP | 0 USD posible para volumen bajo | depende del proveedor/volumen |
| GitHub Actions/CodeQL | según plan actual | según plan actual |

La escala de 5–10 usuarios del primer piloto no exige infraestructura de alto rendimiento. La decisión de pagar Supabase debe estar guiada por **backup, recuperación y soporte**, no por capacidad de cómputo.

## Trabajo ya implementado en rama

- constitución SDD;
- especificación, aclaraciones, plan, checklist y análisis;
- esquema PostgreSQL/RLS;
- hardening de grants/campos;
- RPC de autosave con concurrencia;
- submission server-side;
- catálogo S7;
- portal OTP;
- dashboard estudiante;
- host S7 con autosave/restauración/conflicto;
- vista docente;
- CSP y salida segura;
- CI/CodeQL/secret guards;
- runbook y matriz adversarial.

## Trabajo externo/restante estimado

| Tarea | Esfuerzo estimado |
|---|---:|
| Crear/configurar proyecto Supabase aislado | 1–2 h |
| Aplicar migraciones desde cero y corregir incompatibilidades reales | 2–5 h |
| Configurar Auth/OTP/SMTP de prueba | 2–4 h |
| Crear identidades ficticias y matrículas | 1–2 h |
| Ejecutar matriz RLS/IDOR/roles | 4–8 h |
| Validar concurrencia/512 KiB/submission | 3–5 h |
| Activar config pública y probar frontend | 2–4 h |
| 10 ciclos multi-dispositivo | 3–5 h |
| XSS y vista docente adversarial | 2–4 h |
| Backup/restauración | 2–4 h |
| Correcciones encontradas | 4–12 h |
| Preparar aviso/consentimiento para piloto real | 2–5 h |
| **Total restante esperado** | **28–60 h** |

No incluye aprobaciones institucionales ni integración con sistemas de matrícula oficiales.

## Costo de desarrollo de referencia

Si el trabajo restante se valorizara externamente:

- a 100.000 COP/h: **2,8–6,0 M COP**;
- a 150.000 COP/h: **4,2–9,0 M COP**.

Son escenarios de presupuesto, no una cotización de mercado.

## Costo oculto que no debe recortarse

Las pruebas negativas no son opcionales. Reducir tiempo eliminando A/B, concurrencia, XSS o restore drill produce un “demo funcional”, no un piloto apto para datos académicos.
