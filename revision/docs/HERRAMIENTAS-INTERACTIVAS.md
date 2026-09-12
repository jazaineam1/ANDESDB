# Herramientas interactivas · `revision`

Implementación añadida el 12 de septiembre de 2026 únicamente bajo `revision/`. La versión pública normal `Presentaciones/` no se modifica.

## Arquitectura

Las presentaciones objetivo conservan una copia exacta de su HTML previo en una carpeta `__original__/`. El URL habitual de cada sesión usa un cargador mínimo que lee esa copia y añade `revision/assets/learning/interactive-tools.js` antes de renderizarla. Esto evita reconstruir o alterar manualmente cientos de kilobytes de HTML y mantiene intacto el diseño de las diapositivas.

El botón flotante **🧪 Lab · n/10** abre la herramienta de la sesión. Atajo: `Alt+L`.

Estado persistente:

- clave: `andesdb.revision.toolkit.v1`
- almacenamiento: `localStorage`
- guarda retos logrados, modo estudiante/docente y evidencia mínima de algunas interacciones.
- no requiere cuenta ni servidor.

El modo **Estudiante** oculta soluciones. El modo **Docente** muestra solución, salida esperada o criterio de diseño según la sesión. El modo seleccionado se conserva en el navegador.

## 10 retos

| Sesión | Herramienta | Evidencia de logro |
|---|---|---|
| S2 | SQL Playground sobre `dvdrental.db` | 3 películas PG más largas; columnas, filas, orden y valores correctos |
| S3 | SQL Playground | `GROUP BY` + `HAVING`; salida completa correcta |
| S4 | SQL Playground | todas las películas con alquileres; diagnóstico de pérdida/multiplicación de filas |
| S5 | SQL Playground | una fila por película con alquileres e ingresos; control explícito del grano |
| S7 | ERD interactivo | cardinalidades Cliente–Pedido, Mesa–Pedido y Pedido–Producto |
| S8 | ERD bajo supuestos temporales | diferencia entre mesero fijo y asignación por turnos; tabla asociativa cuando corresponde |
| S10 | Selector SQL/NoSQL | demuestra que volumen solo es insuficiente y usa acceso, consistencia, forma y transacciones |
| S12 | Simulador grano + estrella | grano de detalle y clasificación hechos/dimensiones |
| S13 | Simulador partición + clustering | partición por fecha, clustering por `customer_id`; `LIMIT` no reduce por sí mismo bytes |
| S14 | Simulador `UNNEST` | transforma una fila por pedido en una fila por item |

## SQL Playground S2–S5

Motor: SQL.js/WASM ya versionado en el repositorio.

Base: `revision/Presentaciones/M2/base-datos/dvdrental.db`.

La autocorrección **no busca texto o palabras clave en la consulta**. Ejecuta el SQL del estudiante y una consulta canónica contra la misma base y compara:

1. nombres y orden de columnas;
2. cantidad de filas;
3. orden de las filas;
4. valores devueltos.

En S4 hay feedback específico:

- menos filas que la referencia: posible pérdida de películas por `INNER JOIN`;
- más filas: posible multiplicación del grano.

S2–S5 funcionan en modo lectura: `SELECT`, `WITH`, `EXPLAIN` y `PRAGMA`; se bloquean sentencias de modificación.

## Offline

`revision/service-worker.js` precachea:

- `interactive-tools.js`;
- SQL.js + WASM;
- `dvdrental.db`;
- los cargadores de las sesiones objetivo;
- las copias `__original__` usadas para renderizar las presentaciones.

Así, una vez instalada/visitada la revisión, los laboratorios tienen tolerancia a una conexión inestable.
