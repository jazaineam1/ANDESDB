-- =====================================================================
--  SESIÓN 6 · REGLAS DE NEGOCIO
--  Diseño y Gestión de Bases de Datos con SQL
--  Universidad de los Andes · Colsubsidio
-- =====================================================================
--
--  Hoy no se escribe SQL para sacar datos: se escribe para LEER LAS
--  REGLAS que alguien dejó escritas dentro de la base.
--
--  Todos los resultados de este archivo están comprobados contra
--  dvdrental.db. Si a ti te sale otra cosa, avísame en clase.
--
--  Cuatro niveles, y no valen lo mismo:
--
--    RESTRICCIÓN implementada .. el motor la impide. Certeza.
--    PERMISO del esquema ....... el motor lo deja pasar. No dice que ocurra.
--    PATRÓN observado .......... se cumple en los datos de hoy. Mañana no sé.
--    HIPÓTESIS ................. te la imaginas mirando el dato. No vale nada
--                                hasta que alguien del negocio la confirme.
--
-- =====================================================================


-- =====================================================================
--  BLOQUE 1 · LEER LAS REGLAS QUE YA ESTÁN ESCRITAS
-- =====================================================================

-- 1.1 · La forma de la tabla es una decisión que alguien tomó.
--       Esto no consulta datos: consulta el ESQUEMA.
SELECT name, "notnull"
FROM   pragma_table_info('rental');
-- rental_date   1   <- NOT NULL
-- inventory_id  1   <- NOT NULL
-- customer_id   1   <- NOT NULL
-- return_date   0   <- admite vacío
-- staff_id      1   <- NOT NULL
--
-- REGLA 1 (restricción): para alquilar hace falta sí o sí cuándo,
--   qué copia, quién y quién atendió.
-- REGLA 2 (permiso): la devolución puede faltar. El sistema permite
--   un alquiler abierto, y eso no es un descuido: es una decisión.


-- ---------------------------------------------------------------------
--  TALLER 1 · Cuatro consultas. Para cada una, escribe la frase que
--  sale de ella Y de qué nivel es.
-- ---------------------------------------------------------------------

-- 1.2 · ¿Se puede tener una película sin devolver?
SELECT COUNT(*) AS sin_devolver
FROM   rental
WHERE  return_date IS NULL;
-- 183
-- NIVEL: PERMISO del esquema. Lo garantiza que la columna admita vacío;
--        los 183 casos solo confirman que además ocurre.

-- 1.3 · ¿Puede haber dos personas con la misma copia a la vez?
--       Autounión: rental contra sí misma, buscando parejas que se pisen.
--       a.rental_id < b.rental_id evita comparar una fila consigo misma
--       y evita contar cada pareja dos veces.
SELECT COUNT(*) AS solapes
FROM   rental a
JOIN   rental b ON a.inventory_id = b.inventory_id
               AND a.rental_id    < b.rental_id
WHERE  a.return_date IS NOT NULL
  AND  b.rental_date >= a.rental_date
  AND  b.rental_date <  a.return_date;
-- 0
-- NIVEL: PATRÓN observado, y aquí está la trampa del taller.
--        Un cero es tentador: parece una ley. Pero significa
--        «no ha pasado», no «no puede pasar». La base NO lo impide.

-- 1.4 · ¿La clasificación es texto libre?
SELECT   rating, COUNT(*) AS n
FROM     film
GROUP BY rating
ORDER BY n DESC;
-- PG-13 223 · NC-17 210 · R 195 · PG 194 · G 178
SELECT COUNT(*) AS sin_clasificar FROM film WHERE rating IS NULL;
-- 0
-- NIVEL: RESTRICCIÓN implementada. En el original de PostgreSQL
--        mpaa_rating es un tipo enumerado: el motor solo acepta cinco.

-- 1.5 · ¿Puede haber una película sin ninguna copia?
SELECT COUNT(*) AS sin_copias
FROM   film f
LEFT JOIN inventory i ON f.film_id = i.film_id
WHERE  i.film_id IS NULL;
-- 42
-- NIVEL: PERMISO del esquema. Nada obliga a que exista inventario.
--        Son las mismas 42 que perseguimos desde la sesión 4.


-- =====================================================================
--  BLOQUE 2 · LO QUE EL DATO NO PUEDE DECIRTE
-- =====================================================================

-- 2.1 · La hipótesis que parece una regla y no lo es.
SELECT MIN(rental_date)  AS primer_alquiler,
       MAX(rental_date)  AS ultimo_alquiler
FROM   rental;
-- 2005-05-24 22:53:30  ...  2006-02-14 15:16:03

SELECT MIN(payment_date) AS primer_pago,
       MAX(payment_date) AS ultimo_pago
FROM   payment;
-- 2007-02-14 21:21:59  ...  2007-05-14 13:44:29
--
-- ¿«Se paga entre uno y dos años después de alquilar»?  NO.
-- Nadie alquila un DVD y paga dos años después. Es un defecto de los
-- datos de ejemplo. NIVEL: HIPÓTESIS, y de las falsas.

-- 2.2 · Cuando el esquema dice una cosa y el dato dice otra.
--       customer.store_id sugiere que cada cliente es de una tienda.
SELECT COUNT(*) AS clientes_en_las_dos
FROM (
  SELECT   r.customer_id
  FROM     rental r
  JOIN     inventory i ON r.inventory_id = i.inventory_id
  GROUP BY r.customer_id
  HAVING   COUNT(DISTINCT i.store_id) > 1
);
-- 599   <- que son TODOS los clientes que existen

SELECT COUNT(*) AS alquileres_en_otra_tienda
FROM   rental r
JOIN   inventory i ON r.inventory_id = i.inventory_id
JOIN   customer c  ON r.customer_id  = c.customer_id
WHERE  i.store_id <> c.store_id;
-- 8018
--
-- ¿Regla o ruido? La base no lo puede decidir. NIVEL: HIPÓTESIS.


-- ---------------------------------------------------------------------
--  TALLER 2 · Pon el nivel a cada hallazgo: R / P / O / H
-- ---------------------------------------------------------------------

-- 2.3 · Alquileres que no tienen ningún pago asociado.
SELECT COUNT(*) AS alquileres_sin_pago
FROM   rental r
LEFT JOIN payment p ON r.rental_id = p.rental_id
WHERE  p.rental_id IS NULL;
-- 1452
-- NIVEL: HIPÓTESIS. ¿Promoción? ¿Cobro pendiente? ¿Fallo de carga?
--        No se resuelve mirando la base. Va a «qué falta preguntar».

-- 2.4 · Pagos registrados por importe cero.
SELECT COUNT(*) AS pagos_en_cero
FROM   payment
WHERE  amount = 0;
-- 24
-- NIVEL: HIPÓTESIS. ¿Cortesías? ¿Anulaciones? Otra pregunta pendiente.

-- 2.5 · Toda la plantilla de la cadena.
SELECT store_id, COUNT(*) AS empleados
FROM   staff
GROUP BY store_id;
-- 1 | 1
-- 2 | 1
-- NIVEL: PATRÓN observado. Hoy hay dos personas, pero nada impide
--        contratar a una tercera mañana.


-- =====================================================================
--  DE PROPINA · la que queda para casa
-- =====================================================================

-- ¿Qué le pasa a un cliente que se da de baja: se borra o se marca?
SELECT   active, COUNT(*) AS n
FROM     customer
GROUP BY active;
-- 0 |  15
-- 1 | 584
--
-- Y la pregunta de verdad: la conclusión que sacas de aquí,
-- ¿de qué nivel es? ¿Restricción, permiso, patrón o hipótesis?
