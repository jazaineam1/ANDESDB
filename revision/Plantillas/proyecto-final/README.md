# Proyecto final ANDESDB · Atención de incidentes urbanos

Este paquete organiza el trabajo de la **Sesión 15**. No contiene una solución: contiene preguntas, archivos y controles para que puedas construir una solución propia y demostrar por qué confías en ella.

## Los tres archivos de datos

- `Datos/casos.csv`: una fila representa un **caso reportado** y muestra su estado actual.
- `Datos/eventos.csv`: una fila representa un **evento o cambio registrado sobre un caso**.
- `Datos/evidencias.json`: un documento representa un **caso con un arreglo de evidencias**; cada evidencia puede ser foto, video o comentario.

Antes de escribir SQL, confirma que puedes explicar esos tres granos con tus palabras.

## Trabaja por cuatro puertas

### Puerta 1 · Significado
Completa en `decisiones.md`:
- pregunta de negocio que priorizas;
- grano de cada fuente;
- reglas confirmadas frente a hipótesis.

### Puerta 2 · Fuente de verdad y representación
Decide y justifica:
- cómo relacionas el estado actual de `casos.csv` con el historial de `eventos.csv`;
- si las evidencias conviene representarlas de forma relacional, documental o híbrida;
- qué requisito de acceso, consistencia o evolución sustenta la decisión.

### Puerta 3 · Modelo que protege
Usa `schema.sql` para proponer un modelo ejecutable con PK, FK y las restricciones que realmente puedas justificar. Incluye al menos una operación válida y una prueba que deba fallar.

### Puerta 4 · Pregunta → SQL → validación
Usa `queries.sql` para responder al menos:
1. una pregunta que requiera `JOIN`;
2. una agregación por una dimensión del caso;
3. una pregunta de tiempo o secuencia basada en eventos.

En `validaciones.sql` demuestra que el resultado no depende de una multiplicación accidental de filas.

## Escalera de validación

No pases directamente de “la consulta corrió” a “la respuesta es correcta”. Revisa:

1. **Estructura:** conteos, unicidad, tipos y nulos inesperados.
2. **Referencias:** PK/FK y eventos huérfanos.
3. **Negocio:** contrasta contra los controles de `criterios.md`.
4. **Negativa:** demuestra que una entrada inválida es rechazada por la regla esperada.
5. **Analítica:** comprueba que un JOIN no infla el indicador.

## Evidencia mínima defendible

Los seis archivos se agrupan en cuatro evidencias:

- **Decisión:** `decisiones.md` + `modelo.png`.
- **Base que protege:** `schema.sql`.
- **Respuesta comprobada:** `queries.sql` + `validaciones.sql`.
- **Transferencia:** `arquitectura.md`.

La salida analítica es una extensión: si el núcleo ya funciona, propón en `arquitectura.md` el grano de una tabla de hechos, sus medidas y dimensiones. No necesitas construir otro sistema completo.

## Regla de defensa

Debes poder explicar una línea de SQL, una relación o una restricción elegida al azar, modificarla ante un requisito nuevo y decir qué control volverías a ejecutar.
