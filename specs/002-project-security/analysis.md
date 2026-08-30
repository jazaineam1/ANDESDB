# Analysis · Spec 002

## Hallazgo prioritario

Se detectó una credencial de base de datos reutilizable en un archivo de material docente versionado. Impacto: cualquier lector del repositorio/historial podía intentar autenticarse contra el servicio mientras la credencial siguiera vigente. La acción de código es retirarla y bloquear recurrencia; la acción operativa obligatoria es rotarla/revocarla.

## Fronteras de mayor riesgo

1. **Git/GitHub -> CI**: workflows con write token y Actions de terceros. Mitigación: SHA pin, permisos mínimos, no `pull_request_target`, Scorecard/Dependency Review.
2. **Supply chain -> navegador**: WASM/JS vendorizado. Mitigación: versión exacta, `npm pack --ignore-scripts`, copiar solo artefactos necesarios, SHA-256.
3. **Shell autenticado -> laboratorio heredado**: un XSS en el laboratorio no debe poder leer sesión LMS. Mitigación: orígenes distintos + sandbox + protocolo `postMessage` exacto.
4. **Navegador -> Supabase**: IDs/payload son manipulables. Mitigación: RLS, RPC, `auth.uid()`, límites y pruebas IDOR/BOLA.
5. **Profesor -> contenido de estudiante**: riesgo de stored XSS. Mitigación: `textContent`, CSP y cero rich text en piloto.

## Riesgos residuales antes del GO

- una credencial expuesta no puede considerarse segura hasta ser rotada;
- branch protection aún requiere configuración en GitHub;
- CSP meta no sustituye cabeceras reales del hosting;
- RLS/backup/MFA requieren evidencia del entorno Supabase real;
- el branch piloto no sanea automáticamente el historial ni `main`.

## Decisión

NO-GO para estudiantes reales mientras cualquiera de los riesgos residuales anteriores permanezca sin evidencia de cierre.
