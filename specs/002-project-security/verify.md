# Verify · Spec 002

Estado actual: **NO-GO para datos reales** hasta completar controles manuales/infraestructura.

## Evidencia automatizable

- [ ] `python tools/security_gate.py` = OK en CI.
- [ ] sintaxis JS/Python = OK.
- [ ] CodeQL JavaScript/Python = OK sin Critical/High abierto.
- [ ] OpenSSF Scorecard ejecutado y revisado.
- [ ] Dependency Review disponible en PR.
- [ ] todos los workflows sin Action flotante.

## Evidencia funcional de aislamiento

- [ ] LMS origin != lab origin.
- [ ] mensaje desde origen falso hacia host ignorado.
- [ ] mensaje desde ventana distinta pero mismo payload ignorado.
- [ ] mensaje desde padre falso hacia bridge ignorado.
- [ ] laboratorio no recibe token Supabase.
- [ ] XSS de laboratorio no puede leer `sessionStorage` del shell LMS.

## Evidencia operativa obligatoria

- [ ] credencial de BD encontrada fue rotada/revocada.
- [ ] branch protection/ruleset activo en `main` y rama piloto.
- [ ] proyecto Supabase aislado creado.
- [ ] Security Advisor revisado.
- [ ] matriz RLS A/B/teacher A/teacher B/no-enrollment pasa 100%.
- [ ] MFA teacher/admin habilitado.
- [ ] restore drill de backup exitoso.
- [ ] kill switch probado.
- [ ] aviso de privacidad/base institucional aceptados.

## Decisión

Solo cambiar a **GO** cuando todos los ítems de evidencia operativa y todos los bloqueadores Critical/High estén cerrados. La existencia de código/CI no constituye por sí sola aprobación del piloto.
