-- =====================================================================
-- SESIÓN 2 · De la decisión a la primera consulta
-- Diseño y Gestión de Bases de Datos con SQL · Universidad de los Andes
--
-- Base: dvdrental  (Presentaciones/M2/base-datos/dvdrental.db)
-- Cliente: Beekeeper Studio · tipo de conexión SQLite
--
-- Todas las consultas de este archivo están verificadas contra esa base.
-- El número entre paréntesis es el resultado esperado.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. SELECT ... FROM  ·  pedir columnas de una tabla
-- ---------------------------------------------------------------------

-- Todas las columnas de la tabla film            (1.000 filas)
SELECT * FROM film;

-- Solo las columnas que interesan                (1.000 filas)
SELECT title, length
FROM film;

-- DESAFÍO 1: ¿en qué tabla están los nombres de los protagonistas?
-- Pista: asómate a las tablas que "suenen" a personas que actúan.
SELECT *
FROM actor;                                    -- (200 filas)


-- ---------------------------------------------------------------------
-- 2. DISTINCT  ·  valores únicos de una columna
-- ---------------------------------------------------------------------

-- ¿Qué calificaciones existen?                   (5 filas: G, PG, PG-13, R, NC-17)
SELECT DISTINCT rating
FROM film;

-- ¿Qué nombres de pila distintos tienen los actores?
SELECT DISTINCT first_name
FROM actor;


-- ---------------------------------------------------------------------
-- 3. COUNT  ·  contar filas
-- ---------------------------------------------------------------------

-- ¿Cuántas películas hay?                        (1.000)
SELECT COUNT(*) FROM film;

-- ¿Cuántos clientes hay?                         (599)
SELECT COUNT(*) FROM customer;

-- ¿Cuántas calificaciones distintas?             (5)
-- Se lee de adentro hacia afuera: primero quita repetidos, después cuenta.
SELECT COUNT(DISTINCT rating)
FROM film;

-- DESAFÍO 2: ¿de cuántos distritos distintos son nuestros clientes?
SELECT COUNT(DISTINCT district)
FROM address;                                  -- (378)

-- Compara con el total de direcciones para ver la diferencia:
SELECT COUNT(district) FROM address;           -- (603)
-- 603 direcciones repartidas en 378 distritos.


-- ---------------------------------------------------------------------
-- 4. WHERE  ·  quedarse solo con las filas que cumplen una condición
-- ---------------------------------------------------------------------
--   =    igual a            >=   mayor o igual que
--   >    mayor que          <=   menor o igual que
--   <    menor que          <>   distinto de  (también !=)

-- Películas que duran más de 2 horas             (457 filas)
SELECT title, length
FROM film
WHERE length > 120;

-- Los primeros 10 actores por id
SELECT *
FROM actor
WHERE actor_id <= 10;                          -- (10 filas)

-- OJO: el texto va entre COMILLAS SIMPLES y distingue mayúsculas.
SELECT email FROM customer WHERE first_name = 'Nancy';   -- (1 fila)
SELECT email FROM customer WHERE first_name = 'nancy';   -- (0 filas)
-- Cero filas NO es un error: la consulta está bien, el dato no existe así.


-- ---------------------------------------------------------------------
-- 5. WHERE con varias condiciones  ·  AND, OR, NOT
--    Regla mnemotécnica: AND achica · OR agranda
-- ---------------------------------------------------------------------

-- Las dos condiciones deben cumplirse            (82 filas)
SELECT title
FROM film
WHERE length > 120
  AND rating = 'PG';

-- Basta con que se cumpla una                    (372 filas)
SELECT title
FROM film
WHERE rating = 'G'
   OR rating = 'PG';

-- CUIDADO: AND se evalúa antes que OR. Estas dos NO son lo mismo.
SELECT * FROM actor
WHERE first_name = 'Penelope' OR last_name = 'Peck' AND actor_id < 10;

SELECT * FROM actor
WHERE (first_name = 'Penelope' OR last_name = 'Peck') AND actor_id < 10;
-- Ejecuta las dos y compara: usa paréntesis para dejar clara tu intención.

-- DESAFÍO 3: una clienta olvidó su billetera. Se llama Nancy Thomas.
-- Necesitamos su correo.
SELECT email
FROM customer
WHERE first_name = 'Nancy'
  AND last_name  = 'Thomas';                   -- nancy.thomas@sakilacustomer.org


-- ---------------------------------------------------------------------
-- 6. ORDER BY y LIMIT  ·  ordenar y recortar
--    ORDER BY va casi al final; LIMIT siempre de último.
-- ---------------------------------------------------------------------

-- De mayor a menor duración
SELECT title, length
FROM film
ORDER BY length DESC;

-- Ordenar por dos columnas
SELECT first_name, last_name
FROM actor
ORDER BY last_name ASC, first_name ASC;

-- DESAFÍO 4: las 5 películas más cortas para la hora del almuerzo.
SELECT title, length
FROM film
ORDER BY length ASC
LIMIT 5;                                       -- la más corta dura 46 min

-- OJO: sin ORDER BY, LIMIT devuelve 5 filas CUALESQUIERA, no las 5 más cortas.
SELECT title, length FROM film LIMIT 5;


-- ---------------------------------------------------------------------
-- Orden obligatorio de escritura de las cláusulas vistas hoy:
--
--   SELECT  →  FROM  →  WHERE  →  ORDER BY  →  LIMIT
--
-- En la sesión 3 se suman GROUP BY y HAVING, y el orden se amplía.
-- ---------------------------------------------------------------------
