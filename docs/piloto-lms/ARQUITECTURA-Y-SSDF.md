# Arquitectura y controles SSDF del piloto LMS

## 1. Decisiones de arquitectura

### ADR-01 · Mantener el frontend estático

El curso y los talleres siguen siendo HTML/CSS/JS estáticos. Se evita introducir un servidor propio en la primera prueba para reducir superficie operativa y dependencias.

### ADR-02 · Supabase solo como identidad, persistencia y autorización

Supabase aporta Auth + PostgreSQL + API. La regla fundamental es:

> Que el frontend oculte algo no es una autorización. Toda autorización sobre datos personales debe volver a comprobarse en PostgreSQL mediante RLS.

### ADR-03 · Ningún secreto privilegiado en cliente

El navegador puede conocer únicamente configuración pública/publishable. `service_role`, credenciales SMTP, tokens administrativos y secretos de CI nunca se incluyen en el bundle ni en HTML.

### ADR-04 · Identidad no equivale a matrícula

Autenticarse no da acceso al curso. Son estados distintos:

```text
usuario autenticado
      |
      v
¿tiene enrollment activo en la cohorte?
      | sí
      v
puede acceder a las actividades publicadas de esa cohorte
```

Esto evita que una cuenta creada accidentalmente vea datos académicos.

### ADR-05 · El rol no vive en metadata editable por usuario

`student`, `teacher` y `admin` viven en una tabla separada que el cliente no puede insertar ni modificar. Nunca se confía en un campo de perfil enviado por el navegador para elevar privilegios.

### ADR-06 · Borrador mutable, entrega inmutable

`activity_state` es el borrador y puede cambiar. `submissions` es un snapshot nuevo, sellado con timestamp de servidor. El estudiante no tiene `UPDATE` ni `DELETE` sobre una entrega.

### ADR-07 · JSON con límites explícitos

El estado del taller se guarda como `jsonb` por flexibilidad, pero:

- debe ser un objeto;
- tiene tope de tamaño;
- el cliente aplica debounce;
- el servidor no acepta blobs arbitrarios ni HTML como requisito del piloto.

### ADR-08 · Versionar toda actividad

Una actividad se identifica por `slug + version`. El estado guardado conserva su versión. No se modifica silenciosamente una actividad que ya tenga alumnos trabajando.

## 2. Separación de responsabilidades

| Capa | Responsabilidad | No debe hacer |
|---|---|---|
| Frontend | UX, autosave, mostrar progreso, validaciones tempranas | decidir autorización final |
| Auth | identidad, login, sesión | decidir matrícula académica |
| RLS/Postgres | aislamiento entre usuarios y cohortes | confiar en IDs enviados por cliente |
| Edge Function | operaciones privilegiadas puntuales | convertirse en backend monolítico |
| GitHub/CI | código, pruebas y controles de supply chain | contener secretos en archivos |

## 3. Modelo de autorización

### Student

Puede:

- leer su perfil;
- leer su propia matrícula;
- leer actividades publicadas que correspondan a su curso/cohorte;
- crear/modificar su propio borrador;
- crear una entrega propia;
- leer feedback sobre su entrega.

No puede:

- enumerar estudiantes;
- leer progreso/estado/entregas de otro usuario;
- modificar su rol o matrícula;
- publicar actividades;
- modificar una entrega ya realizada;
- invocar operaciones administrativas.

### Teacher

Puede leer progreso, estados y entregas de las cohortes que administra. Para el piloto inicial, la asignación docente se administra fuera del cliente. No se deriva por dominio de correo.

### Admin

Uso excepcional. No es una cuenta de uso diario. MFA obligatorio antes de pasar a producción.

## 4. SSDF aplicado al piloto

Se usa NIST SSDF 1.1 con sus cuatro grupos como marco de trabajo.

### PO · Prepare the Organization

- threat model versionado;
- inventario de datos y clasificación;
- responsables de seguridad definidos;
- política de secretos;
- criterio explícito de severidad y bloqueo de release;
- entorno piloto separado del productivo.

### PS · Protect the Software

- `main` no se modifica desde esta prueba;
- rama de piloto aislada;
- mínimos permisos de GitHub Actions;
- secretos solo en secret store;
- dependencias fijadas mediante lockfile cuando se incorporen;
- revisión de dependencias y escaneo de secretos;
- artefactos reproducibles cuando se introduzca build.

### PW · Produce Well-Secured Software

- `deny by default`;
- RLS para cada tabla expuesta;
- validación de entrada;
- límites de payload;
- output encoding / `textContent` para contenido de estudiante;
- CSP estricta;
- no usar `innerHTML` con estado del estudiante;
- pruebas de autorización horizontales y verticales;
- control de concurrencia para autosave;
- entrega inmutable;
- logging sin contenido sensible.

### RV · Respond to Vulnerabilities

- `SECURITY.md`;
- procedimiento de revocar claves/sesiones;
- capacidad de desactivar el piloto sin afectar el sitio actual;
- registro de incidentes y root cause;
- parchear primero en rama piloto;
- no cerrar un hallazgo alto/crítico sin prueba de regresión.

## 5. Requisitos mínimos tipo ASVS

No se pretende certificar ASVS en el piloto, pero sí usar requisitos verificables.

### Autenticación

- OAuth/OIDC con proveedor confiable;
- redirects exactos, sin comodines amplios;
- no almacenar contraseñas propias;
- MFA obligatorio para cuentas de profesor/admin antes de producción;
- logout invalida la sesión local;
- sesiones no se registran en logs.

### Control de acceso

- cada request a datos privados se autoriza en servidor/BD;
- pruebas IDOR/BOLA con IDs reales de otra cuenta;
- RLS activada y políticas explícitas;
- ningún endpoint privilegiado depende de un botón oculto;
- no existe `role=teacher` aceptado desde payload de usuario.

### Entrada y salida

- estado JSON con tamaño máximo;
- strings mostrados con `textContent`;
- si se habilita Markdown/rich text en el futuro, sanitizador probado y CSP compatible;
- SQL de estudiantes nunca se concatena para ejecutarlo contra la BD LMS.

### Datos

- minimización de PII;
- TLS en tránsito;
- backups del proveedor en producción;
- borrado documentado;
- no exponer dumps en CI/artifacts;
- no usar datos reales en entornos de desarrollo.

## 6. Cabeceras de seguridad objetivo

En el hosting del piloto:

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self' https://<project-ref>.supabase.co;
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  form-action 'self';

Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

`style-src 'unsafe-inline'` se conserva temporalmente porque el sitio actual usa estilos inline. Debe registrarse como deuda. `script-src` NO debe habilitar `unsafe-inline` para la versión LMS final; si la UI actual lo requiere, el piloto debe migrar scripts de autenticación/persistencia a archivos externos y usar hashes/nonces donde corresponda.

## 7. Supply chain

Antes de añadir npm:

- no cargar SDK de Supabase desde CDN público;
- instalar versión fijada;
- generar y versionar lockfile;
- Dependabot o Renovate para avisos, no auto-merge ciego;
- CodeQL para JavaScript/Python;
- Snyk puede añadirse como segunda opinión, pero su token vive exclusivamente en GitHub Secrets;
- cualquier Action de terceros debe fijarse idealmente por commit SHA antes de producción.

## 8. Observabilidad mínima

Registrar solo:

- error técnico;
- operación (save/submit) sin contenido del estado;
- ID interno de request/correlación;
- timestamp;
- código de error.

No registrar:

- access/refresh tokens;
- estado JSON completo;
- consultas del estudiante;
- email si no es indispensable;
- headers Authorization.

## 9. Estrategia de autosave

```text
cambio UI
  -> actualizar estado en memoria
  -> guardar cache local opcional
  -> debounce 800-1500 ms
  -> UPSERT propio con RLS
  -> mostrar estado de sincronización
```

Para evitar sobrescritura entre dos pestañas/dispositivos se usa `revision` de servidor. La actualización debe partir de la revisión conocida y, ante conflicto, detener el auto-merge y pedir recargar/comparar. El piloto NO resuelve conflictos complejos automáticamente.

## 10. Criterios de bloqueo de release

No hay piloto con estudiantes reales si existe cualquiera de estos puntos:

- RLS desactivada en una tabla expuesta;
- `service_role` o secreto en cliente/repositorio;
- posibilidad de leer/escribir estado ajeno;
- elevación de rol desde navegador;
- XSS almacenado reproducible;
- redirect OAuth abierto;
- hallazgo Critical/High sin resolver;
- falta de aviso de privacidad;
- imposibilidad de desactivar el piloto rápidamente.