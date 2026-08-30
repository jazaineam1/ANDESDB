# Checklist · Spec 002

## Repositorio y secretos

- [x] archivo con credencial retirado del árbol piloto;
- [ ] credencial rotada/revocada en proveedor;
- [x] gate detecta URI de BD con password, private keys y tokens de alta señal;
- [x] política exige rotación además de eliminación;

## Supply chain

- [x] Actions nuevas fijadas por SHA;
- [ ] todas las Actions heredadas verificadas por el gate;
- [x] Dependency Review añadido;
- [x] OpenSSF Scorecard añadido;
- [x] Dependabot GitHub Actions configurado;
- [x] vendoring usa versiones exactas, `--ignore-scripts` y SHA-256;

## Web/LMS

- [x] shell y laboratorio diseñados para orígenes distintos;
- [x] host valida `event.origin` y `event.source`;
- [x] bridge valida `event.origin` y `event.source`;
- [x] iframe externo usa sandbox;
- [x] CSP sin scripts remotos/inline en shell LMS;
- [ ] deployment confirma cabeceras efectivas;

## Backend/datos

- [x] RLS/RPC/mínimo privilegio definidos en Spec 001;
- [ ] Security Advisor ejecutado en Supabase real;
- [ ] pruebas cross-user ejecutadas contra backend real;
- [ ] MFA teacher/admin habilitado;
- [ ] restore de backup probado;

## Gobierno

- [x] constitución SDD cubre todo el proyecto;
- [x] SECURITY.md cubre todo el proyecto;
- [x] baseline de estándares documentado;
- [ ] ruleset/branch protection activo;
- [ ] verificación final GO/NO-GO completada.
