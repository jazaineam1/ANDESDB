-- =====================================================================
--  Sesión 5 · Algorítmica de tablas
--  Diseño y Gestión de Bases de Datos con SQL
--  Universidad de los Andes · Colsubsidio
--
--  Base: dvdrental.db (SQLite) — la misma de las sesiones anteriores.
--  Todos los resultados de este archivo están verificados contra ella.
-- =====================================================================


-- =====================================================================
--  BLOQUE 1 · EL NIVEL DE AGREGACIÓN
--
--  Antes de unir dos tablas, la pregunta que decide si el resultado
--  sirve: ¿qué representa UNA FILA en cada una?
-- =====================================================================

-- 1.1 · Cada JOIN baja un nivel. Ejecútalos en orden y mira crecer.
SELECT COUNT(*) FROM film;
-- 1000   · una fila = una película

SELECT COUNT(*)
FROM   film f
LEFT JOIN inventory i ON f.film_id = i.film_id;
-- 4623   · una fila = una COPIA

SELECT COUNT(*)
FROM   film f
LEFT JOIN inventory i ON f.film_id = i.film_id
LEFT JOIN rental    r ON i.inventory_id = r.inventory_id;
-- 16087  · una fila = un ALQUILER

SELECT COUNT(*)
FROM   film f
LEFT JOIN inventory i ON f.film_id = i.film_id
LEFT JOIN rental    r ON i.inventory_id = r.inventory_id
LEFT JOIN payment   p ON r.rental_id = p.rental_id;
-- 16091  · una fila = un PAGO


-- 1.2 · LA TRAMPA: contar sobre la tabla ya inflada.
SELECT   f.title, COUNT(i.inventory_id) AS copias
FROM     film f
LEFT JOIN inventory i ON f.film_id = i.film_id
LEFT JOIN rental    r ON i.inventory_id = r.inventory_id
WHERE    f.film_id = 1
GROUP BY f.film_id;
-- Academy Dinosaur | 24     ← MAL

-- La verdad:
SELECT COUNT(*) FROM inventory WHERE film_id = 1;
-- 8
--
-- Cada copia aparece una vez por cada alquiler suyo. El número está
-- triplicado, no hubo error, y el informe sale con pinta de correcto.


-- =====================================================================
--  BLOQUE 2 · LA SERVILLETA Y EL MARCO DE CINCO PASOS
--
--  1. Dibuja el objetivo: los campos y QUÉ REPRESENTA UNA FILA.
--  2. ¿De dónde viene cada campo?
--  3. ¿A qué nivel está cada origen? ¿peras con peras o con manzanas?
--  4. Resume lo que haga falta ANTES de unir.
--  5. Une los pedazos, ya todos al mismo nivel.
--
--  La tabla objetivo de hoy:
--    1 fila = 1 PELÍCULA
--    title | categoria | copias | alquileres | recaudo
--
--    film            1 fila = 1 película    ok
--    film_category   1 fila = 1 película    ok
--    category        1 fila = 1 categoría   ok
--    inventory       1 fila = 1 copia       ⚠ resumir
--    rental          1 fila = 1 alquiler    ⚠ resumir
--    payment         1 fila = 1 pago        ⚠ resumir
-- =====================================================================


-- =====================================================================
--  BLOQUE 3 · TEJER CON «WITH»
-- =====================================================================

-- 3.1 · El primer pedazo: baja inventory al nivel de película.
SELECT   film_id, COUNT(*) AS n_copias
FROM     inventory
GROUP BY film_id;
-- 958 filas · una por película CON al menos una copia


-- 3.2 · TALLER 2 · el mismo pedazo, con nombre y unido a film.
WITH copias AS (
  SELECT   film_id, COUNT(*) AS n_copias
  FROM     inventory
  GROUP BY film_id
)
SELECT   f.title,
         COALESCE(c.n_copias, 0) AS copias
FROM     film f
LEFT JOIN copias c ON f.film_id = c.film_id
ORDER BY copias, f.title;
-- 1000 filas. Las 42 primeras tienen 0.
--
-- LEFT JOIN, no JOIN: las 42 sin copia tienen que salir.
-- COALESCE(x, 0) convierte el hueco del LEFT JOIN en un cero. En un
-- informe, vacío y cero no significan lo mismo.


-- =====================================================================
--  BLOQUE 4 · EL SEGUNDO PEDAZO Y SUS DOS TRAMPAS
-- =====================================================================

-- 4.1 · Trampa 1: un alquiler puede tener VARIOS pagos.
SELECT COUNT(*) FROM (
  SELECT rental_id FROM payment GROUP BY rental_id HAVING COUNT(*) > 1
);
-- 1
--
-- Uno solo en toda la base. Por eso es peligroso: olvidar el DISTINCT
-- te desvía una fila de mil y NUNCA lo vas a notar probando.

-- 4.2 · Trampa 2: hay alquileres SIN ningún pago registrado.
SELECT COUNT(*)
FROM   rental r
LEFT JOIN payment p ON r.rental_id = p.rental_id
WHERE  p.payment_id IS NULL;
-- 1452
--
-- Con JOIN a secas desaparecen y el conteo de alquileres queda corto.

-- Academy Dinosaur lo muestra en pequeño:
SELECT COUNT(*) FROM rental r
  JOIN inventory i ON r.inventory_id = i.inventory_id WHERE i.film_id = 1;
-- 23   ← alquileres de verdad
SELECT COUNT(DISTINCT r.rental_id) FROM rental r
  JOIN inventory i ON r.inventory_id = i.inventory_id
  JOIN payment  p ON r.rental_id = p.rental_id WHERE i.film_id = 1;
-- 21   ← lo que darías con JOIN. Faltan 2.


-- 4.3 · TALLER 3 · el segundo pedazo, bien hecho.
WITH movimiento AS (
  SELECT   i.film_id,
           COUNT(DISTINCT r.rental_id) AS n_alquileres,
           ROUND(SUM(p.amount), 2)     AS total
  FROM     inventory i
  JOIN     rental  r ON i.inventory_id = r.inventory_id
  LEFT JOIN payment p ON r.rental_id   = p.rental_id
  GROUP BY i.film_id
)
SELECT * FROM movimiento WHERE film_id = 1;
-- film_id | n_alquileres | total
--       1 |           23 | 33.79


-- =====================================================================
--  BLOQUE 5 · TALLER 4 · LA TABLA COMPLETA
-- =====================================================================

WITH copias AS (
  SELECT   film_id, COUNT(*) AS n_copias
  FROM     inventory
  GROUP BY film_id
),
movimiento AS (
  SELECT   i.film_id,
           COUNT(DISTINCT r.rental_id) AS n_alquileres,
           ROUND(SUM(p.amount), 2)     AS total
  FROM     inventory i
  JOIN     rental  r ON i.inventory_id = r.inventory_id
  LEFT JOIN payment p ON r.rental_id   = p.rental_id
  GROUP BY i.film_id
)
SELECT   f.title,
         cat.name                     AS categoria,
         COALESCE(cp.n_copias, 0)     AS copias,
         COALESCE(mv.n_alquileres, 0) AS alquileres,
         COALESCE(mv.total, 0)        AS recaudo
FROM     film f
JOIN     film_category fc ON f.film_id = fc.film_id
JOIN     category cat     ON fc.category_id = cat.category_id
LEFT JOIN copias     cp ON f.film_id = cp.film_id
LEFT JOIN movimiento mv ON f.film_id = mv.film_id
ORDER BY recaudo DESC;
-- 1000 filas exactas. Las cinco primeras:
--   Telegraph Voyage  Music         7  27  215.75
--   Zorro Ark         Comedy        8  31  199.72
--   Wife Turn         Documentary   8  31  198.73
--   Innocent Usual    Foreign       8  30  191.74
--   Hustler Party     Comedy        8  26  190.78
--
-- Telegraph Voyage recauda MÁS que Zorro Ark con una copia menos y
-- cuatro alquileres menos: cobra más por alquiler. Hallazgo de negocio
-- que la tabla dejó a la vista sin que nadie lo buscara.


-- =====================================================================
--  LA COMPROBACIÓN CRUZADA
--
--  Una tabla de 1000 filas no se revisa a ojo. Se comprueba con un
--  número que tenga que cuadrar por otro camino.
-- =====================================================================

-- Lo que suma mi tabla:
WITH copias AS (
  SELECT film_id, COUNT(*) AS n_copias FROM inventory GROUP BY film_id
),
movimiento AS (
  SELECT   i.film_id, COUNT(DISTINCT r.rental_id) AS n_alquileres,
           ROUND(SUM(p.amount), 2) AS total
  FROM     inventory i
  JOIN     rental  r ON i.inventory_id = r.inventory_id
  LEFT JOIN payment p ON r.rental_id   = p.rental_id
  GROUP BY i.film_id
)
SELECT ROUND(SUM(COALESCE(mv.total, 0)), 2)
FROM     film f
LEFT JOIN movimiento mv ON f.film_id = mv.film_id;
-- 61312.04

-- Lo que dice payment, directo:
SELECT ROUND(SUM(amount), 2) FROM payment;
-- 61312.04
--
-- Cuadra al centavo. Si hubiera perdido alquileres con un JOIN faltaría
-- plata; si hubiera duplicado filas, sobraría.


-- =====================================================================
--  BLOQUE 6 · CASE
-- =====================================================================

-- 6.1 · Inventarse una columna que no está en ninguna tabla.
SELECT   rating,
         CASE
           WHEN length < 60  THEN 'corta'
           WHEN length < 120 THEN 'media'
           ELSE                   'larga'
         END AS duracion,
         COUNT(*) AS peliculas
FROM     film
GROUP BY rating, duracion
ORDER BY rating, duracion;
-- 15 filas: 5 calificaciones × 3 duraciones.

-- El reparto del catálogo:
SELECT   CASE WHEN length < 60 THEN 'corta'
              WHEN length < 120 THEN 'media'
              ELSE 'larga' END AS duracion,
         COUNT(*) AS peliculas
FROM     film
GROUP BY duracion
ORDER BY peliculas DESC;
-- larga 466 · media 438 · corta 96
--
-- Las condiciones se evalúan EN ORDEN y gana la primera que se cumple.
-- Por eso "< 120" no necesita decir "y además >= 60".


-- 6.2 · TALLER 5 · clasificar por rendimiento.
--       El CASE va en el SELECT final, no dentro de los WITH.
--
--       CASE
--         WHEN COALESCE(mv.n_alquileres, 0) = 0 THEN 'sin movimiento'
--         WHEN COALESCE(mv.total, 0) < 50       THEN 'flojo'
--         ELSE                                       'bueno'
--       END AS rendimiento
--
--  POR QUÉ EL ORDEN IMPORTA: una película sin alquileres también
--  recaudó menos de 50. Si pones 'flojo' primero, las 42 sin copia caen
--  ahí y nunca ves el grupo que de verdad te interesa.
--  En un CASE, lo más específico va arriba.


-- =====================================================================
--  LA DEUDA DE LA SESIÓN 4, SALDADA
-- =====================================================================

SELECT ROUND(AVG(length), 2) FROM film;
-- 115.27   · el promedio de las PELÍCULAS

SELECT ROUND(AVG(f.length), 2)
FROM   film f JOIN inventory i ON f.film_id = i.film_id;
-- 114.93   · ponderado por copias: el promedio de los DVD del almacén

WITH con_copia AS (
  SELECT   f.film_id, f.length
  FROM     film f
  JOIN     inventory i ON f.film_id = i.film_id
  GROUP BY f.film_id          -- una fila por película
)
SELECT ROUND(AVG(length), 2) FROM con_copia;
-- 115.49   · el promedio de las 958 que TIENEN copia
--
-- Los tres números son correctos. Lo que cambia es la pregunta que
-- responden. El GROUP BY dentro del CTE es todo el truco: sube
-- inventory del nivel "copia" al nivel "película" antes de promediar.


-- =====================================================================
--  PARA PRACTICAR
-- =====================================================================

-- Una fila por categoría, con cuántas películas tiene, cuánto recaudó
-- en total y cuál fue su película más taquillera. Deben salir 16 filas.
-- Dibuja la servilleta antes de escribir.

WITH movimiento AS (
  SELECT   i.film_id, ROUND(SUM(p.amount), 2) AS total
  FROM     inventory i
  JOIN     rental  r ON i.inventory_id = r.inventory_id
  LEFT JOIN payment p ON r.rental_id   = p.rental_id
  GROUP BY i.film_id
)
SELECT   cat.name                                AS categoria,
         COUNT(*)                                AS peliculas,
         ROUND(SUM(COALESCE(mv.total, 0)), 2)    AS recaudo
FROM     film f
JOIN     film_category fc ON f.film_id = fc.film_id
JOIN     category cat     ON fc.category_id = cat.category_id
LEFT JOIN movimiento mv ON f.film_id = mv.film_id
GROUP BY cat.category_id
ORDER BY recaudo DESC;
-- 16 filas. La de mayor recaudo NO es la que más películas tiene:
--   Sports  74 películas  4892.19
--   Sci-Fi  61 películas  4336.01
--   Animation 66          4245.31
-- Foreign tiene 73 películas y no está en el podio.


-- =====================================================================
--  TRES CERTIFICADOS GRATUITOS DE SQL
--
--  HackerRank. Se presentan en línea, se pueden repetir sin penalización.
--  El básico son 30 minutos y 2 preguntas.
--
--    https://www.hackerrank.com/skills-verification/sql_basic
--    https://www.hackerrank.com/skills-verification/sql_intermediate
--    https://www.hackerrank.com/skills-verification/sql_advanced
--
--  Con lo visto hasta hoy ya alcanzas el intermedio: consultas simples,
--  filtros, agregaciones, agrupaciones y uniones.
-- =====================================================================
