-- muestra todas las columnas de la tabla film
SeLect * FROM film;

-- Desafio 1
SELECT *
FROM actor;

-- Ejemplo de uso DISTINCT
SELECT distinct(first_name) from actor;

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