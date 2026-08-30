# Piloto LMS seguro para ANDESDB

> Rama experimental: `piloto-lms-secure-ssdf`.
>
> Esta rama NO se debe desplegar sobre el sitio principal ni usar con datos reales de estudiantes hasta completar los gates de seguridad y privacidad descritos aquí.

## Objetivo

Probar, con una cohorte pequeña, el salto de ANDESDB desde un sitio de curso interactivo a un LMS ligero donde cada estudiante pueda:

1. autenticarse con una identidad propia;
2. ver su progreso por actividad;
3. guardar automáticamente el estado de un taller;
4. cerrar el navegador y continuar en otro dispositivo exactamente donde quedó;
5. entregar una versión inmutable de su trabajo;
6. permitir que el docente vea progreso y entregas de su cohorte, sin exponer trabajos de otros estudiantes.

El piloto usa la Sesión 7 (`constructor-abc.html`) como primer vertical completo porque ya tiene pasos, estado estructurado, criterios de avance y una entrega clara.

## Principio rector

No se intenta construir Moodle. Se construye primero el núcleo que ANDESDB necesita:

`identidad -> matrícula -> actividad -> autosave -> restauración -> entrega -> vista docente`

Si ese flujo funciona y supera las pruebas de seguridad, se reutiliza en las demás sesiones.

## Baseline de seguridad

Para el piloto se adopta un proceso de **Secure Software Development** alineado con:

- NIST SP 800-218 SSDF 1.1 como baseline estable;
- OWASP ASVS como catálogo de requisitos verificables para autenticación, sesión, control de acceso, validación y protección de datos;
- OWASP Top 10 como referencia de amenazas web;
- principio `deny by default`, mínimo privilegio y defensa en profundidad;
- PostgreSQL Row Level Security como barrera de autorización en la capa de datos;
- ninguna clave privilegiada en navegador, HTML, repositorio o artefactos de CI.

La revisión 1.2 de SSDF se sigue como referencia de evolución, pero al estar en borrador no se usa como requisito normativo del piloto.

## Arquitectura propuesta

```text
GitHub (código)
      |
      v
Frontend estático del curso
Cloudflare Pages o entorno aislado de preview
      |
      | HTTPS + sesión del usuario
      v
Supabase
  |- Auth (Google/Microsoft; acceso por invitación)
  |- PostgreSQL
  |- RLS
  |- API
  `- Edge Functions solo si una operación necesita privilegios
```

Para el piloto no se requiere servidor Node/Python persistente. La autorización final vive en PostgreSQL/RLS, no en JavaScript.

## Datos que se guardan

Mínimo necesario:

- identificador interno del usuario;
- nombre visible opcional;
- rol (`student`, `teacher`, `admin`) en tabla no modificable por el estudiante;
- matrícula a cohorte;
- progreso de actividad;
- estado JSON del taller;
- snapshot de la entrega;
- feedback del docente.

No almacenar en el piloto: cédula, teléfono, dirección, fecha de nacimiento, contraseñas, tokens OAuth, claves privadas ni datos de terceros.

El correo permanece preferiblemente en el proveedor de identidad/Auth y no se duplica en las tablas de aplicación si no es necesario.

## Scope del piloto

### Incluido

- 1 curso y 1 cohorte piloto;
- 10-40 estudiantes;
- S7 como primera actividad persistente;
- login por Google o Microsoft;
- matrícula administrada, no autoinscripción pública;
- autosave online;
- recuperación en otro dispositivo;
- dashboard mínimo del estudiante;
- dashboard mínimo del docente;
- entrega inmutable;
- logs técnicos mínimos sin contenido sensible;
- pruebas de RLS con al menos dos estudiantes y un docente.

### Fuera del piloto

- pagos;
- mensajería privada;
- foros;
- videollamadas;
- certificados;
- almacenamiento de archivos de estudiantes;
- calificación oficial de la universidad;
- integración SIS/LDAP institucional;
- modo offline con resolución automática de conflictos;
- analítica invasiva de comportamiento;
- ejecución de SQL de estudiantes en servidores compartidos.

## Gates: no pasar al siguiente estado si falla uno

### G0 - Diseño

- [ ] threat model aprobado;
- [ ] inventario de datos personales;
- [ ] roles y matriz de autorización definidos;
- [ ] alcance de piloto y criterio de salida definidos.

### G1 - Infraestructura de prueba

- [ ] proyecto Supabase exclusivo para piloto;
- [ ] autenticación por invitación;
- [ ] RLS habilitado en TODA tabla expuesta;
- [ ] `anon` sin permisos sobre datos de estudiantes;
- [ ] `service_role` solo en secreto de servidor/CI autorizado, nunca frontend;
- [ ] URLs de redirect allowlisted de forma explícita.

### G2 - Aplicación

- [ ] ninguna respuesta de otro estudiante es legible manipulando IDs;
- [ ] ninguna escritura de otro estudiante es posible manipulando requests;
- [ ] rol docente no puede autootorgarse desde el cliente;
- [ ] autosave tiene límite de tamaño y frecuencia;
- [ ] todo contenido introducido por usuario se renderiza como texto salvo sanitización explícita;
- [ ] CSP y cabeceras de seguridad verificadas en el hosting del piloto.

### G3 - Verificación

- [ ] tests negativos de autorización;
- [ ] prueba XSS almacenado;
- [ ] prueba de IDOR/BOLA;
- [ ] prueba de manipulación de rol;
- [ ] prueba de replay/duplicación de entrega;
- [ ] CodeQL/escaneo estático sin hallazgos críticos abiertos;
- [ ] secret scanning sin secretos activos;
- [ ] revisión de dependencias y lockfile.

### G4 - Piloto humano

- [ ] aviso de privacidad visible;
- [ ] consentimiento/base institucional definida antes de datos reales;
- [ ] procedimiento de borrado/corrección de datos;
- [ ] recuperación documentada ante pérdida o corrupción;
- [ ] máximo 10-40 participantes;
- [ ] mecanismo de rollback al sitio actual.

## Criterio de éxito

El piloto es exitoso si, durante dos semanas o al menos dos actividades:

- >= 95% de autosaves terminan correctamente;
- 100% de pruebas cross-user son denegadas;
- ningún secreto privilegiado llega al cliente;
- ningún hallazgo crítico/alto queda abierto;
- un estudiante puede iniciar en dispositivo A y continuar en B;
- una entrega queda congelada aunque el borrador posterior cambie;
- el docente puede ver solo estudiantes de cohortes que administra;
- ningún incidente de privacidad obliga a detener el piloto.

## Orden de lectura

1. `ARQUITECTURA-Y-SSDF.md`
2. `THREAT-MODEL.md`
3. `BACKLOG-PILOTO.md`
4. `../../supabase/migrations/202608300001_lms_pilot.sql`
5. `SECURITY.md` en la raíz del repositorio

## Regla de despliegue

La rama se mantiene aislada de `main`. El piloto debe desplegarse en un dominio/preview separado. No se mezcla con el curso productivo hasta que G0-G4 estén completos y exista una decisión explícita de promoción.