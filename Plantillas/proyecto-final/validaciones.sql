-- Proyecto final ANDESDB · validaciones
-- Convierte cada control en una consulta reproducible.

-- ================================================================
-- A. CONTROLES POSITIVOS CONOCIDOS
-- ================================================================
-- Esperado: 12 casos
-- SELECT COUNT(*) FROM casos;

-- Esperado: 24 eventos
-- SELECT COUNT(*) FROM eventos;

-- Esperado: 4 casos cerrados
-- SELECT COUNT(*) FROM casos WHERE ...;

-- Esperado: 5 casos de prioridad Alta
-- SELECT COUNT(*) FROM casos WHERE ...;

-- Esperado: 2 casos Alta + Cerrado
-- SELECT COUNT(*) FROM casos WHERE ...;

-- Esperado: 0 eventos huérfanos
-- Escribe una validación con LEFT JOIN y explica por qué IS NULL.
-- SELECT ...;

-- Esperado: 2 eventos con resultado = 'Error'
-- SELECT ...;

-- Esperado: 2 eventos sin ip_origen; ambos del canal Telefono
-- SELECT ...;

-- Esperado: 12 eventos tipo creacion; uno por caso
-- SELECT ...;


-- ================================================================
-- B. PRUEBAS NEGATIVAS
-- Deben FALLAR si tus constraints protegen las reglas que declaraste.
-- Ejecuta cada prueba de forma aislada o dentro de una transacción que
-- puedas revertir. Conserva el mensaje de error como evidencia.
-- ================================================================

-- B1 · evento para caso inexistente
-- INSERT INTO eventos (...) VALUES (... caso_id 9999 ...);
-- Constraint esperado: ______________________________________

-- B2 · prioridad fuera del dominio confirmado
-- INSERT INTO casos (...) VALUES (... prioridad 'Urgentisima' ...);
-- Constraint esperado: ______________________________________

-- B3 · dato obligatorio ausente
-- INSERT INTO casos (...) VALUES (...);
-- Constraint esperado: ______________________________________

-- B4 · duplicar una PK
-- INSERT INTO casos (...) VALUES (... caso_id ya existente ...);
-- Constraint esperado: ______________________________________


-- ================================================================
-- C. REASONING CHECK · una prueba que NO debería fallar
-- ================================================================
-- Un evento de canal Telefono puede no tener os, navegador ni ip_origen.
-- Si tu modelo lo rechaza automáticamente, revisa si convertiste una
-- observación frecuente en una regla universal.


-- ================================================================
-- D. CONTROL DE GRANO
-- ================================================================
-- Escribe una consulta que cuente eventos por caso.
-- Luego únela con casos y demuestra que sabes explicar por qué un caso
-- aparece varias veces si haces JOIN directo a eventos.
-- No uses DISTINCT para ocultar esa multiplicación.
