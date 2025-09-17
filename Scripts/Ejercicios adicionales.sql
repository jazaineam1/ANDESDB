-- muestra todas las columnas de la tabla film
SeLect * FROM film;

-- Desafio 1
SELECT *
FROM actor;

-- Ejemplo de uso DISTINCT
SELECT distinct(first_name) from actor;
--desafio4




select distinct release_year,film_id from action_movies;

-- Ejemplo count 

select  count (*) from action_movies;

select count(distinct (release_year)) from action_movies;

-- Ejemplo WHERE

seLect * 
from actor 
where actor_id <= 10;


select * 
from actor
where first_name ='Penelope' or last_name='Peck' and actor_id <10 ;

SELECT email
FROM customer 
WHERE first_name = 'Nancy' AND last_name = 'Thomas';

SELECT title, length
from film 
order by length asc
limit 5;

-- Desafio 3

select count(amount)
from payment
where amount>5;

select count(distinct(district))
from address;

-- Desafio group by

select rating, count(rating)
  from film
  group by rating;

select rental_duration, avg(replacement_cost)
  from film 
  group by rental_duration;

SELECT COUNT(*)
FROM film
where rating='R' AND replacement_cost between 5 AND 15;



select customer_ID,SUM(AMOUNT)
  FROM payment
  WHERE staff_id=2
  group BY customer_id
  having count(AMOUNT)>1
  ORDER BY customer_id;




SELECT count(*)
FROM film 
  WHERE title LIKE 'J%';


select *
from customer
where first_name like 'E%' and address_id<500
order by customer_id desc
limit 1;

SELECT
  film.title,
  film.length,
  language.name
FROM film
INNER JOIN language
ON film.language_id = language.language_id
WHERE name = 'Italian';

---------------------------------------------
-- Las condiciones de impuestos para el estado de California han cambiado y necesitamos
-- notificar a nuestros clientes por correo.¿Cuáles son los correos de los clientes que 
-- viven en California?

SELECT first_name, email
FROM customer C
LEFT JOIN address A
  ON C.address_id = A.address_id
where district = 'California';


-----------------------------------------------------

-- Uno de nuestros clientes es un fan aguerrido del actor ‘Nick Wahlberg’ 
-- y quiere conocer todas las películas en las que actúa.

-- film_actor, film, actor


select FILM.TITLE, ACTOR.FIRST_NAME,ACTOR.LAST_NAME
FROM film_actor
INNER JOIN film ON FILM_ACTOR.film_id=FILM.FILM_ID
inner JOIN ACTOR ON FILM_ACTOR.ACTOR_ID= ACTOR.ACTOR_ID
WHERE ACTOR.first_NAME ='Nick' AND ACTOR.LAST_NAME='Wahlberg';



WITH conteos AS (
  SELECT 
    a.actor_id,
    a.first_name,
    a.last_name,
    COUNT(*) AS n_peliculas
  FROM actor a
  JOIN film_actor fa ON fa.actor_id = a.actor_id
  GROUP BY a.actor_id, a.first_name, a.last_name
)
SELECT *
FROM conteos
ORDER BY n_peliculas DESC
LIMIT 5;