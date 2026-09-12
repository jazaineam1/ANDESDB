
-- De aquí saco el id del cliente.
SELECT * FROM customer; 

-- De la misma tabla puedo obtener el id de dirección
SELECT customer_id, address_id, first_name FROM customer;

-- Me doy cuenta de que necesito filtrar (los que tienen nombre que empieza por E)
SELECT customer_id, address_id, first_name 
FROM customer
WHERE nombre LIKE('E%')
;

-- Uy! no se llama nombre! se llama first_name
SELECT customer_id, address_id, first_name 
FROM customer
WHERE first_name LIKE('E%');

-- Bueno... ahora quiero el cliente con id más grande (DE ESTOS QUE YA TENGO)
SELECT MAX(customer_id) 
FROM customer
WHERE first_name LIKE('E%');

-- Ah claro! el id máximo es el que me sale, pero ni idea cuál cliente...
SELECT MAX(first_name), MAX(customer_id) 
FROM customer
WHERE first_name LIKE('E%');

-- Finalmente quiero verificar que el id de dirección sea menor que 500
SELECT MAX(first_name), MAX(customer_id)
FROM customer
WHERE first_name LIKE('E%')
AND address_id < 500;
