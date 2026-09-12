-- Proyecto final ANDESDB · plantilla de consultas
-- Cada consulta debe empezar con una pregunta de negocio y una frase de grano.

-- ================================================================
-- Q1 · JOIN
-- Pregunta: _________________________________________________
-- Grano esperado del resultado: una fila = __________________
-- Predicción antes de ejecutar: ______________________________
-- ================================================================

-- SELECT ...
-- FROM ...
-- JOIN ...
-- WHERE ...;

-- Validación: ¿cuántas filas esperabas? ¿qué control usaste?


-- ================================================================
-- Q2 · AGREGACIÓN
-- Pregunta sugerida: ¿qué tipos/localidades concentran casos abiertos
-- o en proceso?
-- Grano esperado del resultado: una fila = __________________
-- ================================================================

-- SELECT ...
-- FROM ...
-- GROUP BY ...
-- HAVING ...;


-- ================================================================
-- Q3 · TIEMPO / SECUENCIA
-- Pregunta sugerida: ¿cuánto tardaron en cerrar los casos cerrados?
-- Decide si usarás minutos_desde_anterior o timestamps y explica por qué.
-- ================================================================

-- SELECT ...;


-- ================================================================
-- Q4 · TELEMETRÍA (extensión recomendada)
-- Pregunta sugerida: ¿qué canal/OS tiene mayor latencia observada?
-- Antes de concluir, responde: ¿asociación observada implica causalidad?
-- ¿Cómo tratarás latencia_ms = 0 en llamadas telefónicas?
-- ================================================================

-- SELECT ...;


-- ================================================================
-- Q5 · ERRORES TÉCNICOS (extensión recomendada)
-- Encuentra los eventos con resultado = 'Error' y reconstruye:
-- caso → evento → canal → tamaño → latencia → código HTTP.
-- ================================================================

-- SELECT ...;


-- CHECK FINAL
-- Si un JOIN multiplica filas, explica primero la cardinalidad.
-- No uses DISTINCT como parche antes de declarar el grano correcto.
