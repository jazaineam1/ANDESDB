# Plan · Spec 002

## Secuencia

1. **Inventario y secretos**: retirar credenciales del árbol activo, añadir gate de alta señal y exigir rotación de cualquier secreto expuesto.
2. **Supply chain**: fijar Actions por SHA, dependency review, Scorecard, vendoring reproducible e integridad SHA-256.
3. **Aislamiento web**: separar origen autenticado y origen del laboratorio S7; bridge por `postMessage` con allowlist exacta.
4. **Backend**: conservar RLS/RPC, matriz adversarial y mínimo privilegio ya definidos por Spec 001.
5. **Gobierno**: actualizar constitución SDD y `SECURITY.md` para que cubran todo ANDESDB.
6. **Verificación**: ejecutar gate local/CI, CodeQL, Scorecard, pruebas de mensajes, RLS y gates manuales de infraestructura.

## Arquitectura de origen

```text
https://lms-pilot.example
  pilot/index.html
  pilot/s7.html
  auth/session
          |
          | postMessage (origin exacto)
          v
https://lab-pilot.example
  pilot-lab/s7-bridge.html
          |
          | mismo origen del lab
          v
  Presentaciones/M3/constructor-abc.html
```

El laboratorio no recibe tokens ni claves de Supabase. El shell no lee su DOM.

## Rollback

- `assets/lms/config.js.enabled=false` desactiva el LMS.
- El curso público de `main` no depende del piloto.
- El deployment de laboratorio puede retirarse sin modificar datos en Supabase.
- No se borra evidencia de incidentes ni entregas para “arreglar” una prueba fallida.

## Evidencia esperada

- commits de hardening;
- `SECURITY GATE: OK`;
- workflows verdes;
- `verify.md` con controles manuales todavía pendientes;
- rotación de credencial confirmada fuera de Git;
- branch protection visible antes de GO.
