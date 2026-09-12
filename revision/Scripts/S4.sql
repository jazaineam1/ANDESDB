-- =====================================================================
--  Sesión 4 · Uniones de tablas
--  Diseño y Gestión de Bases de Datos con SQL
--  Universidad de los Andes · Colsubsidio
--
--  Base: dvdrental.db (SQLite)
--  Cómo usarlo: abre la base en Beekeeper Studio y ejecuta las consultas
--  una por una (Ctrl+Enter ejecuta solo la que tiene el cursor encima).
--
--  Todos los resultados de este archivo están verificados contra la base.
-- =====================================================================


-- =====================================================================
--  LOS CUATRO JOIN, SOBRE LA BASE REAL
--
--  En clase los cuatro tipos se explican con un dibujo de dos tablas
--  pequeñas (empleados y proyectos). Ese dibujo NO está en la base: es
--  solo para verlo de un vistazo, con tres filas por lado.
--
--  Aquí tienes los mismos cuatro JOIN sobre tablas de verdad. No hay
--  que crear nada: ejecútalos tal cual.
--
--  El par es film e inventory. Cada fila de inventory es una copia
--  física de una película. Hay 1.000 películas y 4.581 copias, y 42
--  películas no tienen ninguna copia.
-- =====================================================================

-- INNER JOIN · solo lo que tiene pareja en las dos
SELECT   f.title, i.inventory_id
FROM     film AS f
INNER JOIN inventory AS i ON f.film_id = i.film_id;
-- 4581 filas. Las 42 películas sin copia NO aparecen.

-- LEFT JOIN · todas las películas, tengan copia o no
SELECT   f.title, i.inventory_id
FROM     film AS f
LEFT JOIN inventory AS i ON f.film_id = i.film_id;
-- 4623 filas = 4581 + las 42 sin copia, que salen con NULL al lado.

-- RIGHT JOIN · lo mismo con las tablas volteadas
SELECT   f.title, i.inventory_id
FROM     inventory AS i
RIGHT JOIN film AS f ON f.film_id = i.film_id;
-- 4623 filas: idéntico al LEFT de arriba. Eso es todo lo que hace
-- RIGHT: cambiar cuál tabla se conserva entera.

-- FULL OUTER JOIN · todo, de los dos lados
SELECT   f.title, i.inventory_id
FROM     film AS f
FULL OUTER JOIN inventory AS i ON f.film_id = i.film_id;
-- 4623 filas. ¿Las mismas que el LEFT? Sí. Y eso es información:
-- significa que NO hay ninguna copia huérfana, ninguna fila de
-- inventory que apunte a una película inexistente. Compruébalo:
SELECT COUNT(*)
FROM   inventory i LEFT JOIN film f ON f.film_id = i.film_id
WHERE  f.film_id IS NULL;
-- 0
--
-- LA LECCIÓN: en una base bien mantenida, FULL OUTER JOIN casi nunca
-- añade nada sobre LEFT JOIN, porque la integridad referencial impide
-- que existan huérfanos del lado hijo. FULL OUTER se gana el sueldo
-- cuando cruzas DOS SISTEMAS distintos que deberían cuadrar y no
-- cuadran: ahí sí aparecen huérfanos por los dos lados.


-- =====================================================================
--  BLOQUE 1 · CÓMO SE APUNTAN LAS TABLAS
-- =====================================================================

-- 1.1 · La llave foránea vive en customer, NO en address.
--       Mira las columnas de cada una antes de escribir cualquier JOIN.
SELECT * FROM customer LIMIT 3;     -- tiene address_id
SELECT * FROM address  LIMIT 3;     -- NO tiene customer_id

-- 1.2 · La tabla puente de una relación N:N.
--       Una fila por cada pareja actor-película.
SELECT * FROM film_actor LIMIT 10;

-- 1.3 · Cuántas filas tiene cada pieza del rompecabezas.
SELECT 'actor'      AS tabla, COUNT(*) AS filas FROM actor
UNION ALL SELECT 'film',        COUNT(*) FROM film
UNION ALL SELECT 'film_actor',  COUNT(*) FROM film_actor
UNION ALL SELECT 'customer',    COUNT(*) FROM customer
UNION ALL SELECT 'address',     COUNT(*) FROM address
UNION ALL SELECT 'inventory',   COUNT(*) FROM inventory
UNION ALL SELECT 'rental',      COUNT(*) FROM rental
UNION ALL SELECT 'payment',     COUNT(*) FROM payment;
-- actor 200 · film 1000 · film_actor 5462 · customer 599 · address 603
-- inventory 4581 · rental 16044 · payment 14596


-- =====================================================================
--  BLOQUE 2 · APILAR: UNION Y UNION ALL
-- =====================================================================

-- 2.1 · UNION elimina duplicados.
SELECT first_name FROM actor
UNION
SELECT first_name FROM customer;
-- 647 filas

-- 2.2 · UNION ALL los conserva.
SELECT first_name FROM actor
UNION ALL
SELECT first_name FROM customer;
-- 799 filas  (200 + 599)
-- La diferencia son 152 filas. Ojo: NO son 152 nombres compartidos;
-- el desglose real esta abajo, en 2.3.

-- 2.3 · ¿De dónde salen exactamente las 152 filas que UNION borró?
--       No todas vienen del cruce entre las dos tablas.
SELECT first_name FROM actor
INTERSECT
SELECT first_name FROM customer;
-- 72 filas: los nombres de pila que están en las DOS tablas.

-- El desglose completo de las 152:
SELECT 200 - COUNT(DISTINCT first_name) AS repetidos_dentro_de_actor FROM actor;
-- 72
SELECT 599 - COUNT(DISTINCT first_name) AS repetidos_dentro_de_customer FROM customer;
-- 8
--   72 (dentro de actor) + 8 (dentro de customer) + 72 (compartidos) = 152
--
-- La lección: UNION limpia los duplicados de CADA lado, no solo los del cruce.


-- ---------------------------------------------------------------------
--  DESAFÍO 1 · Una sola lista con toda la gente del negocio
--  RR. HH. quiere clientes y empleados en un único listado, con una
--  columna que diga de qué tipo es cada persona.
-- ---------------------------------------------------------------------
SELECT first_name, last_name, 'cliente'  AS tipo
FROM   customer
UNION ALL
SELECT first_name, last_name, 'empleado' AS tipo
FROM   staff
ORDER BY last_name;
-- 601 filas: 599 clientes + 2 empleados

-- Por qué UNION ALL y no UNION. Ejecuta la versión con UNION:
SELECT first_name, last_name, 'cliente'  AS tipo FROM customer
UNION
SELECT first_name, last_name, 'empleado' AS tipo FROM staff;
-- 601 filas. ¡Las mismas! ¿Entonces da igual?  NO.
--
-- Coinciden por dos casualidades que se suman:
--   1. En esta base no hay dos personas con el mismo nombre y apellido.
--      Compruébalo:
--          SELECT first_name, last_name, COUNT(*) c FROM customer
--          GROUP BY first_name, last_name HAVING c > 1;   -- 0 filas
--   2. OJO, ESTO NO ES UN MOTIVO: la columna 'tipo' NO te salva. Vale
--      'cliente' en las 599 filas de un lado y 'empleado' en las 2 del
--      otro, así que separa clientes de empleados pero NO distingue dos
--      clientes entre sí. Compruébalo quitándola: también da 601.
--
-- UNION compara LA FILA ENTERA. Una sola columna diferente anula la
-- limpieza por completo. Míralo con actor y customer:
SELECT first_name FROM actor
UNION SELECT first_name FROM customer;                    -- 647
SELECT first_name, 'actor' AS origen FROM actor
UNION SELECT first_name, 'cliente' AS origen FROM customer;  -- 719
-- Al añadir la etiqueta de origen, UNION deja de borrar los 72 nombres
-- compartidos: ya no son filas iguales.
--
-- Conclusión: que hoy den lo mismo no valida UNION; significa que el
-- resultado depende del azar de los datos. Un homónimo NO es un
-- duplicado, y UNION ALL da la respuesta correcta pase lo que pase.


-- =====================================================================
--  BLOQUE 3 · INNER JOIN
-- =====================================================================

-- 3.1 · La forma canónica. Las cinco preguntas, numeradas.
SELECT   f.title, l.name              -- 3 · ¿qué campos pongo?
FROM     film     AS f                -- 1 · ¿con qué tabla inicio?
INNER JOIN language AS l              -- 2 y 5 · ¿cuál le pego, y de qué tipo?
  ON     f.language_id = l.language_id;   -- 4 · ¿qué campos me ayudan a pegar?
-- 1000 filas

-- 3.2 · El INNER JOIN es simétrico: esto devuelve lo mismo.
SELECT   f.title, l.name
FROM     language AS l
INNER JOIN film AS f
  ON     l.language_id = f.language_id;
-- 1000 filas


-- ---------------------------------------------------------------------
--  DESAFÍO 2 · Un cliente solo habla italiano
-- ---------------------------------------------------------------------

-- a) ¿En qué idioma está cada película?
SELECT   f.title, l.name
FROM     film AS f
INNER JOIN language AS l
  ON     f.language_id = l.language_id;
-- 1000 filas

-- b) ¿Hay alguna en italiano?
SELECT   f.title, l.name
FROM     film AS f
INNER JOIN language AS l
  ON     f.language_id = l.language_id
WHERE    l.name = 'Italian';
-- 0 filas.  PERO NO TE CREAS ESE CERO TODAVÍA.

-- Compruébalo con el idioma que SÍ debería estar:
SELECT   COUNT(*)
FROM     film AS f
INNER JOIN language AS l
  ON     f.language_id = l.language_id
WHERE    l.name = 'English';
-- 0 filas TAMBIÉN. Y eso es imposible: las mil películas son en inglés.
--
-- El cero de arriba era correcto POR CASUALIDAD. Diagnóstico:
SELECT '[' || name || ']' AS crudo, LENGTH(name) AS largo FROM language;
-- [English             ]  20
-- [Italian             ]  20
--
-- language.name viene rellenado con espacios hasta 20 caracteres (era
-- character(20) en la base PostgreSQL original). 'English' son 7, así que
-- el = no coincide nunca. TRIM quita los espacios de los extremos.

SELECT   COUNT(*) FROM film f INNER JOIN language l
  ON f.language_id = l.language_id WHERE TRIM(l.name) = 'English';
-- 1000  ✔

SELECT   COUNT(*) FROM film f INNER JOIN language l
  ON f.language_id = l.language_id WHERE TRIM(l.name) = 'Italian';
-- 0  ✔  Ahora sí: cero es la respuesta de verdad.
--
-- NOTA DE PORTABILIDAD: en PostgreSQL este WHERE sí habría funcionado sin
-- TRIM, porque la comparación de character(N) ignora los espacios finales.
-- SQLite no hace esa cortesía. Es un caso perfecto de "funciona en un
-- motor y no en el otro" con datos idénticos.

-- Por qué: las 1000 películas tienen el mismo idioma.
SELECT language_id, COUNT(*) FROM film GROUP BY language_id;
-- 1 | 1000

-- Y la tabla language sí lista el italiano, pero sin películas asociadas.
SELECT * FROM language;
-- 6 filas: English, Italian, Japanese, Mandarin, French, German

-- OJO con esta trampa de la base: language.name viene rellenado con
-- espacios hasta 20 caracteres. Si comparas con LIKE o con = sobre un
-- texto más largo, no cuadra. TRIM lo arregla.
SELECT '[' || name || ']' AS crudo, '[' || TRIM(name) || ']' AS limpio
FROM   language;
-- [English             ]  vs  [English]


-- ---------------------------------------------------------------------
--  DESAFÍO 3 · Los clientes de California
--  ¡ATENCIÓN! Este ejercicio se hace en clase con el error incluido.
-- ---------------------------------------------------------------------

-- ❌ La versión del material original. NO FUNCIONA.
--    SELECT district, email
--    FROM   address
--    INNER JOIN customer
--      ON   address.customer_id = customer.customer_id
--    WHERE  district = 'California';
--
--    Error: no such column: address.customer_id
--
--    Motivo: la relación está invertida. Un cliente TIENE una dirección
--    (customer.address_id -> address.address_id). Una dirección no
--    "tiene" un cliente: address no guarda ninguna referencia de vuelta.

-- ✅ La versión correcta.
SELECT   c.first_name, c.last_name, c.email, a.district
FROM     customer AS c
INNER JOIN address AS a
  ON     c.address_id = a.address_id
WHERE    a.district = 'California'
ORDER BY c.last_name;
-- 9 filas. La primera: Patricia Johnson,
-- patricia.johnson@sakilacustomer.org

-- Cómo se diagnostica un ON que falla: mira las columnas reales.
PRAGMA table_info(address);
PRAGMA table_info(customer);


-- =====================================================================
--  BLOQUE 4 · LEFT, RIGHT Y FULL OUTER JOIN
-- =====================================================================

-- 4.1 · LEFT JOIN conserva TODAS las filas de la primera tabla.
--       Las películas sin copia salen con NULL en las columnas de inventory.
SELECT   f.title, i.inventory_id
FROM     film AS f
LEFT JOIN inventory AS i
  ON     f.film_id = i.film_id;
-- 4623 filas  (4581 con copia + 42 sin copia)

-- 4.2 · El mismo JOIN pero INNER: se caen las 42.
SELECT   f.title, i.inventory_id
FROM     film AS f
INNER JOIN inventory AS i
  ON     f.film_id = i.film_id;
-- 4581 filas

-- 4.3 · RIGHT JOIN es un LEFT JOIN con las tablas volteadas.
--       Estas dos consultas devuelven exactamente lo mismo.
SELECT COUNT(*) FROM inventory i RIGHT JOIN film f ON f.film_id = i.film_id;
SELECT COUNT(*) FROM film f LEFT JOIN inventory i ON f.film_id = i.film_id;
-- 4623 las dos

-- 4.4 · FULL OUTER JOIN: todo, de los dos lados.
--       SQLite lo soporta desde la versión 3.39 (2022). MySQL nunca.
SELECT COUNT(*) FROM film f FULL OUTER JOIN inventory i ON f.film_id = i.film_id;
-- 4623 (aquí coincide con el LEFT porque no hay copias huérfanas:
--       toda fila de inventory apunta a una película que existe)


-- ---------------------------------------------------------------------
--  DESAFÍO 4 · Películas en catálogo que no están en ninguna tienda
--  El patrón más importante de la sesión:
--       LEFT JOIN + WHERE ... IS NULL  =  "lo que está aquí y no allá"
-- ---------------------------------------------------------------------
SELECT   f.film_id, f.title
FROM     film AS f
LEFT JOIN inventory AS i
  ON     f.film_id = i.film_id
WHERE    i.film_id IS NULL
ORDER BY f.title;
-- 42 filas. La primera: Alice Fantasia (film_id 14)

-- La comprobación de que cuadra: 958 + 42 = 1000
SELECT COUNT(DISTINCT f.film_id) AS con_copia
FROM   film f INNER JOIN inventory i ON f.film_id = i.film_id;
-- 958

-- Este ejercicio NO se puede resolver con INNER JOIN.
-- Las 42 que buscas son justo las filas que el INNER JOIN descarta.


-- =====================================================================
--  BLOQUE 5 · ENCADENAR JOINS
-- =====================================================================

-- 5.1 · Cruzar el puente de una relación N:N.
--       actor -> film_actor -> film
SELECT   a.first_name, a.last_name, f.title
FROM     actor AS a
INNER JOIN film_actor AS fa ON a.actor_id = fa.actor_id
INNER JOIN film       AS f  ON fa.film_id = f.film_id;
-- 5462 filas: una por cada pareja actor-película


-- ---------------------------------------------------------------------
--  DESAFÍO 5 · El fan de Nick Wahlberg
-- ---------------------------------------------------------------------
SELECT   f.title, f.length, f.rating
FROM     actor AS a
INNER JOIN film_actor AS fa ON a.actor_id = fa.actor_id
INNER JOIN film       AS f  ON fa.film_id = f.film_id
WHERE    a.first_name = 'Nick'
  AND    a.last_name  = 'Wahlberg'
ORDER BY f.title;
-- 25 filas. La primera: Adaptation Holes (50 min, NC-17)

-- Variante para comprobar: Penelope Guiness
SELECT   COUNT(*)
FROM     actor AS a
INNER JOIN film_actor AS fa ON a.actor_id = fa.actor_id
WHERE    a.first_name = 'Penelope' AND a.last_name = 'Guiness';
-- 19

-- ¿Qué actor sale en más películas?
SELECT   a.first_name || ' ' || a.last_name AS actor, COUNT(*) AS peliculas
FROM     actor AS a
INNER JOIN film_actor AS fa ON a.actor_id = fa.actor_id
GROUP BY a.actor_id
ORDER BY peliculas DESC
LIMIT    5;
-- Gina Degeneres 42 · Walter Torn 41 · Mary Keitel 40
-- Matthew Carrey 39 · Sandra Kilmer 37
--
-- OJO: agrupamos por a.actor_id, NO por el nombre. En esta base hay
-- DOS actores distintos llamados 'Susan Davis' (actor_id 101 y 110).
-- Si agrupas por nombre, los fusionas y te sale un falso número 1 con
-- 54 películas que ninguna persona real hizo. Compruébalo:
SELECT first_name, last_name, COUNT(*) AS veces
FROM   actor GROUP BY first_name, last_name HAVING veces > 1;
-- Susan | Davis | 2


-- ---------------------------------------------------------------------
--  LA TRAMPA · Un JOIN puede multiplicar filas
-- ---------------------------------------------------------------------
SELECT COUNT(*) FROM film;
-- 1000

SELECT COUNT(*)
FROM   film f
INNER JOIN inventory i ON f.film_id = i.film_id;
-- 4581  ¡no se rompió nada! Es una relación 1:N.

-- Correcto para "¿cuántas copias hay?"      -> COUNT(*)
-- Correcto para "¿cuántas películas hay?"   -> COUNT(DISTINCT f.film_id)
SELECT COUNT(DISTINCT f.film_id)
FROM   film f INNER JOIN inventory i ON f.film_id = i.film_id;
-- 958

-- Por qué importa: el promedio queda ponderado por el número de copias.
SELECT ROUND(AVG(length), 2) FROM film;
-- 115.27   <- el promedio de las PELÍCULAS

SELECT ROUND(AVG(f.length), 2)
FROM   film f INNER JOIN inventory i ON f.film_id = i.film_id;
-- 114.93   <- el promedio de los DVD DEL ALMACÉN
--
-- El JOIN le hizo DOS cosas al promedio, y van en direcciones contrarias:
SELECT ROUND(AVG(length), 2) FROM film
WHERE  film_id IN (SELECT film_id FROM inventory);
-- 115.49   <- botó las 42 sin copia: el promedio SUBE
--
--   1000 películas .................. 115.27
--   958 con copia, sin ponderar ..... 115.49   (+0.22 por botar las 42)
--   4581 filas del JOIN ............. 114.93   (-0.56 por el peso)
--
-- Los dos efectos se cancelan en parte, así que la diferencia final es de
-- 34 centésimas. Pequeña justo lo suficiente para que nadie la note.
--
-- Y OJO CON EL ANTÍDOTO: COUNT(DISTINCT) sirve para CONTAR. Para promediar
-- no sirve:
SELECT ROUND(AVG(DISTINCT f.length), 2)
FROM   film f INNER JOIN inventory i ON f.film_id = i.film_id;
-- 115.50  <- tampoco es el número que querías.
-- Para promedios y sumas hay que resumir ANTES de unir. Sesión 5.


-- ---------------------------------------------------------------------
--  QUIZ · ¿Cuántos clientes nunca han alquilado nada?
-- ---------------------------------------------------------------------
SELECT COUNT(*)
FROM   customer c
LEFT JOIN rental r ON c.customer_id = r.customer_id
WHERE  r.rental_id IS NULL;
-- 0.  Todos los clientes de esta base han alquilado al menos una vez.
-- Cero también es una respuesta, y hay que saber distinguirla de un error.


-- ---------------------------------------------------------------------
--  DESAFÍO INTEGRADOR · Los cinco clientes que más han gastado
--  Junta todo: JOIN (hoy) + SUM y GROUP BY (S3) + ORDER BY y LIMIT (S2)
-- ---------------------------------------------------------------------
SELECT   c.first_name || ' ' || c.last_name AS cliente,
         c.email,
         ROUND(SUM(p.amount), 2) AS total
FROM     customer AS c
INNER JOIN payment AS p
  ON     c.customer_id = p.customer_id
GROUP BY c.customer_id
ORDER BY total DESC
LIMIT    5;
-- Eleanor Hunt    211.55
-- Karl Seal       208.58
-- Marion Snyder   194.61
-- Rhonda Kennedy  191.62
-- Clara Shaw      189.60


-- =====================================================================
--  PARA PRACTICAR EN CASA
-- =====================================================================

-- P1 · ¿Cuántas películas hay por cada categoría?
SELECT   c.name AS categoria, COUNT(*) AS peliculas
FROM     category AS c
INNER JOIN film_category AS fc ON c.category_id = fc.category_id
GROUP BY c.category_id
ORDER BY peliculas DESC;
-- 16 filas. Sports 74 · Foreign 73 · Family 69 · Documentary 68 ...
-- La menor: Music, con 51.

-- P2 · ¿Qué ciudad tiene más clientes?
SELECT   ci.city, COUNT(*) AS clientes
FROM     customer AS cu
INNER JOIN address AS a  ON cu.address_id = a.address_id
INNER JOIN city    AS ci ON a.city_id     = ci.city_id
GROUP BY ci.city_id
ORDER BY clientes DESC
LIMIT    5;
-- Solo DOS ciudades tienen 2 clientes: Aurora y London. Las demás
-- tienen 1. Con LIMIT 1 el motor escoge una de las dos por ti, y no
-- siempre la misma: cuando hay empate, LIMIT sin desempate es una
-- respuesta arbitraria disfrazada de respuesta exacta.
--
-- Hallazgo de negocio: los clientes están repartidísimos —597 ciudades
-- distintas para 599 clientes—. No hay ninguna concentración geográfica.

-- P3 · (extra) ¿Cuánto ha recaudado cada tienda?
SELECT   s.store_id, ROUND(SUM(p.amount), 2) AS recaudo
FROM     payment AS p
INNER JOIN staff AS s ON p.staff_id = s.staff_id
GROUP BY s.store_id
ORDER BY recaudo DESC;
-- 1 → 30252.12   ·   2 → 31059.92

-- P4 · (extra) LA TRAMPA DE ENCADENAR DOS LEFT JOIN.
--       Parece que esto responde "¿qué películas nunca se han
--       alquilado?". No lo hace. Ejecútalo:
SELECT   f.film_id, f.title, i.inventory_id
FROM     film AS f
LEFT JOIN inventory AS i ON f.film_id      = i.film_id
LEFT JOIN rental    AS r ON i.inventory_id = r.inventory_id
WHERE    r.rental_id IS NULL
ORDER BY f.title;
-- 43 filas, no 42. ¿De dónde sale la de más?
--
-- Cada fila del resultado es UNA COPIA FÍSICA, no una película. La fila
-- extra es una copia concreta de 'Academy Dinosaur' que nunca se
-- alquiló... pero la película sí se ha alquilado 23 veces con sus otras
-- 7 copias. El WHERE está filtrando copias huérfanas, no películas.
--
-- Las 43 se descomponen así:
--   42 películas sin ninguna copia  +  1 copia suelta nunca alquilada.

-- ✅ La pregunta bien respondida necesita agrupar primero:
SELECT   f.film_id, f.title
FROM     film AS f
LEFT JOIN inventory AS i ON f.film_id      = i.film_id
LEFT JOIN rental    AS r ON i.inventory_id = r.inventory_id
GROUP BY f.film_id
HAVING   COUNT(r.rental_id) = 0
ORDER BY f.title;
-- 42 filas. Ahora sí: las mismas del desafío 4.

-- ✅ Y la pregunta que la consulta original SÍ respondía bien:
--    "¿qué copias físicas nunca se han alquilado?"
SELECT   i.inventory_id, i.film_id
FROM     inventory AS i
LEFT JOIN rental AS r ON i.inventory_id = r.inventory_id
WHERE    r.rental_id IS NULL;
-- 1 fila: una copia de Academy Dinosaur.
--
-- MORALEJA. El patrón LEFT JOIN + IS NULL funciona perfecto con DOS
-- tablas. Encadenando tres, "no tiene pareja" deja de significar lo que
-- crees: pasa a referirse a la tabla del medio. Antes de escribir el
-- WHERE, pregúntate siempre: ¿qué representa UNA FILA de mi resultado?
-- En la sesión 5 le ponemos nombre y método a esto.


-- =====================================================================
--  EXTRA · EL FILTRO EN EL «ON» NO ES LO MISMO QUE EN EL «WHERE»
--
--  Se menciona en la diapositiva «Encadenar». Aquí está la prueba.
--  Pregunta: ¿qué películas tienen copia EN LA TIENDA 1, y cuáles no
--  tienen ninguna allí?
-- =====================================================================

-- El filtro DENTRO del ON: se aplica al emparejar.
-- Las películas sin copia en la tienda 1 siguen saliendo, con NULL.
SELECT   COUNT(*)
FROM     film AS f
LEFT JOIN inventory AS i
  ON     f.film_id = i.film_id AND i.store_id = 1;
-- 2511 filas

-- El filtro en el WHERE: se aplica DESPUÉS de emparejar.
-- Como NULL no cumple "store_id = 1", esas filas se caen.
SELECT   COUNT(*)
FROM     film AS f
LEFT JOIN inventory AS i
  ON     f.film_id = i.film_id
WHERE    i.store_id = 1;
-- 2270 filas
--
-- El segundo convirtió tu LEFT JOIN en un INNER JOIN sin decirte nada.
-- Es el mismo tipo de error que el promedio inflado: no da error,
-- da un número.
--
-- LA REGLA:
--   condición sobre la tabla de la DERECHA  -> va en el ON
--   condición sobre la tabla de la IZQUIERDA -> va en el WHERE
--
-- Y la razón está en el orden de ejecución que vimos en la sesión 3:
--   FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT
-- El ON trabaja mientras se arma la unión; el WHERE llega cuando ya
-- está armada y solo ve el resultado.
