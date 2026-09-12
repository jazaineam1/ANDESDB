-- =====================================================================
-- SESIÓN 3 · Filtrar mejor y resumir
-- Diseño y Gestión de Bases de Datos con SQL · Universidad de los Andes
--
-- Base: dvdrental  (Presentaciones/M2/base-datos/dvdrental.db)
-- Cliente: Beekeeper Studio · tipo de conexión SQLite
--
-- Todas las consultas están verificadas contra esa base.
-- El número entre paréntesis es el resultado esperado.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Calentamiento  ·  lo de la sesión 2, de memoria
-- ---------------------------------------------------------------------

-- Las 10 películas más largas                    (10 filas, la mayor 185 min)
SELECT title, length
FROM film
ORDER BY length DESC
LIMIT 10;

-- ¿Cuántos clientes hay?                         (599)
SELECT COUNT(*) FROM customer;


-- ---------------------------------------------------------------------
-- 1. BETWEEN  ·  un rango, extremos INCLUIDOS
-- ---------------------------------------------------------------------

-- Películas de entre 60 y 90 minutos             (229 filas)
SELECT title, length
FROM film
WHERE length BETWEEN 60 AND 90;

-- Exactamente equivalente a:                     (229 filas, idéntico)
SELECT title, length
FROM film
WHERE length >= 60
  AND length <= 90;

-- OJO: BETWEEN incluye los dos extremos.
-- Si necesitas mayor/menor ESTRICTO, escribe la condición completa:
SELECT title, length
FROM film
WHERE length > 60 AND length < 90;             -- (menos filas que la anterior)


-- ---------------------------------------------------------------------
-- 2. IN  ·  una lista de opciones (reemplaza una cadena de OR)
-- ---------------------------------------------------------------------

-- Con OR: se vuelve ilegible rápido              (595 filas)
SELECT title, rating
FROM film
WHERE rating = 'G'
   OR rating = 'PG'
   OR rating = 'PG-13';

-- Con IN: la misma consulta                      (595 filas, idéntico)
SELECT title, rating
FROM film
WHERE rating IN ('G','PG','PG-13');

-- Cada valor de texto lleva sus propias comillas simples.
-- Esto NO funciona:  WHERE rating IN ('G,PG,PG-13')


-- ---------------------------------------------------------------------
-- 3. LIKE  ·  patrones de texto
--      %  cualquier secuencia de caracteres, incluida ninguna
--      _  exactamente un carácter, y tiene que haber uno
-- ---------------------------------------------------------------------

-- Nombres que empiezan por A                     (13 filas)
SELECT first_name FROM actor WHERE first_name LIKE 'A%';

-- Títulos que contienen "LOVE"
SELECT title FROM film WHERE title LIKE '%LOVE%';

-- Comparación de patrones sobre la tabla actor:
SELECT DISTINCT first_name FROM actor WHERE first_name LIKE 'J%';   -- (17) Jennifer, Johnny, Joe...
SELECT DISTINCT first_name FROM actor WHERE first_name LIKE 'Jo%';  -- (5)  Johnny, Joe...  (sin Jennifer)
SELECT DISTINCT first_name FROM actor WHERE first_name LIKE 'J__';  -- (3)  solo nombres de 3 letras
SELECT DISTINCT first_name FROM actor WHERE first_name LIKE '%er';  -- (7)  terminan en "er"

-- NO confundir = con LIKE: esto busca el texto literal y da 0 filas.
SELECT title FROM film WHERE title = '%LOVE%';

-- ---------------------------------------------------------------------
-- DIALECTOS: mayúsculas y minúsculas
--   PostgreSQL : LIKE distingue mayúsculas.  Existe ILIKE para ignorarlas.
--   SQLite     : LIKE ya las ignora.         ILIKE no existe (da error).
-- Por eso, en la base de hoy, estas dos devuelven lo mismo:
-- ---------------------------------------------------------------------
SELECT COUNT(*) FROM film WHERE title LIKE 'J%';   -- (20)
SELECT COUNT(*) FROM film WHERE title LIKE 'j%';   -- (20) en SQLite; 0 en PostgreSQL


-- ---------------------------------------------------------------------
-- 4. Práctica combinada  (sesión 2 + sesión 3)
-- ---------------------------------------------------------------------

-- 1. ¿Cuántas transacciones de pago fueron de más de 5 dólares?
SELECT COUNT(amount)
FROM payment
WHERE amount > 5;                              -- (3.618)

-- 2. ¿Cuántas películas tienen rating R y costo de reemplazo entre $5 y $15?
SELECT COUNT(*)
FROM film
WHERE rating = 'R'
  AND replacement_cost BETWEEN 5 AND 15;       -- (52)

-- 3. ¿Cuántas películas tienen títulos que comienzan por J?
SELECT COUNT(*)
FROM film
WHERE title LIKE 'J%';                         -- (20)


-- =====================================================================
-- SEGUNDA MITAD · de listar filas a resumirlas
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5. Funciones de agregación  ·  colapsan muchas filas en una sola
-- ---------------------------------------------------------------------

SELECT COUNT(*) FROM film;                     -- (1.000)
SELECT SUM(amount) FROM payment;               -- (61.312,04)
SELECT AVG(length) FROM film;                  -- (115,272)
SELECT MIN(length), MAX(length) FROM film;     -- (46, 185)

-- Todas devuelven UNA fila, sin importar el tamaño de la tabla.


-- ---------------------------------------------------------------------
-- 6. GROUP BY  ·  primero repartir en baldes, después calcular
--    (la analogía de las canicas por color)
-- ---------------------------------------------------------------------

-- DESAFÍO 1: ¿cuántas películas hay por cada calificación?
SELECT rating, COUNT(rating)
FROM film
GROUP BY rating;                               -- (5 filas: una por rating)

-- DESAFÍO 2: costo de reemplazo promedio por duración de préstamo
SELECT rental_duration, AVG(replacement_cost)
FROM film
GROUP BY rental_duration;                      -- (5 filas)

-- Más legible, redondeando a 2 decimales:
SELECT rental_duration, ROUND(AVG(replacement_cost), 2)
FROM film
GROUP BY rental_duration;

-- ---------------------------------------------------------------------
-- LA REGLA DE ORO
-- Cada columna del SELECT o está en el GROUP BY, o va dentro de una
-- función de agregación. No hay tercera opción.
--
--   PostgreSQL : rechaza la consulta de abajo con un error explícito.
--   SQLite     : la ACEPTA y devuelve un título arbitrario del grupo.
--                Silenciosamente equivocado, que es peor que un error.
-- ---------------------------------------------------------------------
SELECT title, rating, COUNT(*)
FROM film
GROUP BY rating;
-- Pregúntate: si el grupo 'G' tiene 178 películas, ¿cuál título es el correcto?


-- ---------------------------------------------------------------------
-- 7. HAVING  ·  filtrar DESPUÉS de agregar
--    WHERE filtra canicas · HAVING filtra baldes
-- ---------------------------------------------------------------------

-- Solo las calificaciones con más de 200 películas   (2 filas: PG-13 y NC-17)
SELECT rating, COUNT(*)
FROM film
GROUP BY rating
HAVING COUNT(*) > 200;

-- Esto NO funciona: cuando WHERE actúa, el COUNT todavía no se ha calculado.
-- SELECT rating, COUNT(*) FROM film WHERE COUNT(*) > 200 GROUP BY rating;

-- DESAFÍO INTEGRADOR: ¿qué clientes han gastado más de $110 con el vendedor 2?
SELECT customer_id, SUM(amount)
FROM payment
WHERE staff_id = 2                             -- filtra pagos    (canicas)
GROUP BY customer_id                           -- reparte por cliente (baldes)
HAVING SUM(amount) > 110;                      -- filtra clientes (baldes) → (2 filas)


-- ---------------------------------------------------------------------
-- DESAFIO EXTRA  ·  dos preguntas de negocio con GROUP BY
-- ---------------------------------------------------------------------

-- 1. Cuanto recaudo cada empleado?
--    staff_id 1 = Mike Hillyer (tienda 1) · staff_id 2 = Jon Stephens (tienda 2)
SELECT staff_id, ROUND(SUM(amount), 2)
FROM payment
GROUP BY staff_id;                             -- 1 -> 30252.12 · 2 -> 31059.92

-- 2. Cuantos clientes tiene cada tienda?
SELECT store_id, COUNT(*)
FROM customer
GROUP BY store_id;                             -- 1 -> 326 · 2 -> 273


-- ---------------------------------------------------------------------
-- COUNT(*) vs COUNT(columna): la diferencia son los NULL
-- ---------------------------------------------------------------------
SELECT COUNT(*) FROM rental;                   -- 16044 filas
SELECT COUNT(return_date) FROM rental;         -- 15861: ignora los 183 sin devolver


-- ---------------------------------------------------------------------
-- 8. Para practicar en casa
-- ---------------------------------------------------------------------

-- De los clientes cuyo nombre empieza por E y con address_id < 500,
-- ¿cuál tiene el customer_id más grande?
SELECT first_name, last_name
FROM customer
WHERE first_name LIKE 'E%'
  AND address_id < 500
ORDER BY customer_id DESC
LIMIT 1;                                       -- (Eddie Tomlin)


-- ---------------------------------------------------------------------
-- Orden en que SQL EJECUTA una consulta (no es el orden en que se escribe):
--
--   FROM → WHERE → GROUP BY → agregación → HAVING → SELECT → ORDER BY → LIMIT
--
-- Orden en que se ESCRIBE:
--
--   SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT
--
-- En la sesión 4: JOIN, para responder preguntas que necesitan más de una tabla.
-- ---------------------------------------------------------------------
