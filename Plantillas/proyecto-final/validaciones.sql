-- Proyecto final ANDESDB · validaciones.sql
-- La meta no es acumular queries: es demostrar por qué confías en el resultado.

-- CAPA 1 · Estructura
-- Conteos, unicidad, nulos inesperados, dominios observados.


-- CAPA 2 · Referencias
-- Comprueba que no existan eventos huérfanos respecto a los casos.


-- CAPA 3 · Controles de negocio
-- Contrasta al menos dos resultados con criterios.md.


-- CAPA 4 · Prueba negativa
-- Escribe una operación que deba FALLAR y explica qué constraint debe rechazarla.
-- IMPORTANTE: déjala comentada si impide ejecutar el archivo completo de una vez.


-- CAPA 5 · Estabilidad analítica
-- Comprueba que una unión 1:N no infle el indicador que presentas.
