# GA4 en ANDESDB LMS

Measurement ID activo: **G-Z5YG0TNP8J**

Esta integración aplica únicamente a la capa `revision/` del LMS.

## Qué queda conectado

GA4 recibe analítica web agregada del Portal, Curso, Presentaciones, Laboratorios y Panel docente. El LMS académico individual continúa viviendo en Supabase.

GA4 recopila automáticamente información estándar de tecnología y contexto, como navegador, sistema operativo, categoría/modelo de dispositivo cuando está disponible, resolución de pantalla, plataforma, país, región y ciudad aproximada.

**GA4 no muestra la dirección IP cruda del usuario.** La ubicación se deriva de la IP durante la recolección, pero no se expone como una dimensión para el docente.

## Eventos personalizados que envía ANDESDB

- `page_view`
- `portal_opened`
- `course_opened`
- `presentation_opened`
- `lab_opened`
- `teacher_dashboard_opened`
- `navigation_click`
- `practice_attempt`
- `practice_failed`
- `hint_requested`
- `practice_completed`
- `activity_started`
- `activity_completed`
- `session_completed`

## Parámetros académicos anónimos

Los eventos pueden llevar parámetros de baja cardinalidad y no identificables:

- `course_code`
- `page_type`
- `actor_type` (`student`, `teacher`, `anonymous`)
- `session_number`
- `activity_code`
- `practice_number`
- `practice_type`
- `strategy`
- `destination_type`
- `score`
- `correct`
- `action`
- `source`
- `model`

La capa `analytics.js` bloquea parámetros cuyos nombres o valores parezcan contener correo, nombre, username, user_id, teléfono, contraseña, token, documento, respuesta libre, SQL, query, prompt, texto o errores. También elimina query string y fragmento de la URL antes de enviarla como ubicación de página.

## Configuración de privacidad aplicada

- `allow_google_signals: false`
- `allow_ad_personalization_signals: false`
- `ads_data_redaction: true`
- URL enviada sin query string ni `#fragment`
- Sin nombre, correo, username, user_id ni token LMS
- La identidad académica permanece en Supabase

## Comprobar que está funcionando

1. Abre el Portal ANDESDB en otra pestaña o dispositivo.
2. En Google Analytics entra a **Informes > En tiempo real**.
3. Navega en ANDESDB: Portal → Curso → Presentación → Laboratorio.
4. En GA4 deberían aparecer eventos como `page_view`, `course_opened`, `presentation_opened`, `lab_opened` y `navigation_click`.
5. Realiza una práctica. Deberían aparecer `practice_attempt` y, según el resultado, `practice_failed`, `hint_requested` o `practice_completed`.

Los reportes en tiempo real son de mejor esfuerzo y pueden presentar una demora breve.

## Ver sistema operativo, navegador y dispositivo

En GA4:

**Informes > Tech > Detalles de tecnología**

Dimensiones útiles:

- Sistema operativo
- Sistema operativo con versión
- Navegador
- Categoría de dispositivo
- Modelo de dispositivo
- Plataforma
- Resolución de pantalla

El modelo del dispositivo es más fiable en móviles/tablets; en desktop puede aparecer como `(not set)`.

## Ver país, región y ciudad

En GA4:

**Informes > Atributos de usuario > Detalles demográficos**

Usa como dimensión:

- País
- Región
- Ciudad
- Idioma

La ubicación es aproximada y puede estar sujeta a umbrales de privacidad cuando hay pocos usuarios.

## Crear las dimensiones personalizadas de ANDESDB

Los parámetros personalizados ya se están enviando desde el código, pero para usarlos cómodamente en informes y Exploraciones debes registrarlos.

En GA4 ve a:

**Administrador > Visualización de datos > Definiciones personalizadas > Crear dimensión personalizada**

Crea estas dimensiones con **alcance Evento**:

| Nombre visible | Parámetro del evento |
|---|---|
| Tipo de página | `page_type` |
| Tipo de actor | `actor_type` |
| Sesión ANDESDB | `session_number` |
| Código de actividad | `activity_code` |
| Número de práctica | `practice_number` |
| Tipo de práctica | `practice_type` |
| Estrategia de práctica | `strategy` |
| Destino de navegación | `destination_type` |

No es necesario registrar dimensiones estándar que GA4 ya ofrece, como navegador, SO, dispositivo, país, ciudad, página o fuente de tráfico.

Después de crear una dimensión personalizada, puede tardar **24 a 48 horas** en quedar disponible en informes y Exploraciones históricas nuevas.

## Marcar resultados importantes como eventos clave

Como docente, los dos candidatos más útiles son:

- `practice_completed`
- `session_completed`

En GA4 puedes marcarlos como **eventos clave** para seguir su evolución sin tratar todos los clics como resultados relevantes.

## Exploración recomendada 1: dificultad por sesión

En **Explorar > Formato libre**:

- Filas: `Sesión ANDESDB`
- Columnas: `Nombre del evento`
- Valores: `Número de eventos`
- Filtro: `Tipo de actor = student`
- Eventos a comparar: `practice_attempt`, `practice_failed`, `hint_requested`, `practice_completed`

Interpretación: una sesión con muchos fallos/pistas y pocas completadas merece revisión pedagógica.

## Exploración recomendada 2: práctica problemática

- Filas: `Código de actividad`
- Columnas: `Nombre del evento`
- Valores: `Número de eventos`
- Filtro por sesión cuando sea necesario

Esto permite localizar una práctica concreta que produce demasiados intentos o pistas.

## Exploración recomendada 3: compatibilidad tecnológica

Usa dimensiones estándar:

- Sistema operativo
- Navegador
- Categoría de dispositivo
- Resolución de pantalla

Cruza con:

- Usuarios activos
- Vistas
- `practice_completed`

Esto ayuda a detectar si el LMS se usa principalmente desde Android/móvil y dónde conviene priorizar diseño responsive.

## Exploración recomendada 4: ubicación

- Filas: Ciudad o País
- Valores: Usuarios activos / Sesiones / Vistas

No uses ubicación para calificar ni identificar estudiantes. Es una dimensión agregada de contexto.

## Separación GA4 vs Supabase

### GA4

Úsalo para:
- OS
- navegador
- dispositivo
- resolución
- ubicación aproximada
- tráfico
- páginas
- engagement
- navegación
- eventos académicos anónimos agregados

### Supabase LMS

Úsalo para:
- estudiante concreto
- matrícula
- progreso individual
- práctica completada por estudiante
- intentos
- pistas
- tiempo activo individual
- estado por sesión

No se envía la identidad del estudiante desde Supabase a GA4.

## Archivos de implementación

- `revision/assets/learning/analytics-config.js`
- `revision/assets/learning/analytics.js`
- `revision/assets/learning/learning-tracker.js`
- `revision/portal.html`
- `revision/teacher-dashboard.html`
- `revision/service-worker.js`

## Prueba mínima después de publicar

1. Recarga el Portal una vez para recibir el Service Worker nuevo.
2. Abre GA4 > En tiempo real.
3. Desde el móvil entra al Portal.
4. Abre Curso.
5. Abre una presentación.
6. Abre un laboratorio.
7. Intenta y completa una práctica.
8. Comprueba en GA4 que aparecen los eventos esperados.

Si `page_view` aparece pero los eventos de práctica no, prueba recargando el laboratorio una vez para forzar la versión nueva de `analytics.js` y `learning-tracker.js`.
