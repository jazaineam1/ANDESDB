-- ============================================================
-- ANDESDB · Restaurante ABC · la base completa
-- PostgreSQL · para pegar en el SQL Editor de Supabase
--
-- QUÉ ES ESTO
--   Las once tablas del modelo que construyó el curso, ya escritas,
--   con datos dentro. Se pega entero, se ejecuta una vez, y al
--   terminar tienes tu propia base del Restaurante ABC.
--
-- CÓMO SE USA
--   1. Abre el SQL Editor de tu proyecto en Supabase.
--   2. Pega este archivo COMPLETO.
--   3. Pulsa Run (o Ctrl + Enter).
--   4. Vete a Table Editor y mira las once tablas.
--
--   Si algo sale mal, vuelve a ejecutarlo entero: empieza borrando
--   lo que hubiera, así que repetirlo no rompe nada.
--
-- EL MODELO
--   cliente ──1:N── reserva ──N:1── mesa ──N:1── mesero
--   pago ──N:1── pedido ──1:N── pedido_mesa ──N:1── mesa
--   pedido ──1:N── linea_pedido ──N:1── plato
--   plato ──1:N── receta ──N:1── ingrediente
--
--   Tres de esas once son tablas puente: nadie las pidió, las obliga
--   un varios-a-varios. Son pedido_mesa, linea_pedido y receta.
--
--   Y una columna que NO existe a propósito: el total del pedido. No
--   se guarda, se reconstruye sumando sus líneas. Está al final, en
--   las comprobaciones.
-- ============================================================


-- ============================================================
-- PASO 0 · BORRAR LO ANTERIOR
--
-- CASCADE arrastra lo que dependa de cada tabla. El orden es el
-- inverso al de creación: primero lo que apunta, después lo apuntado.
-- ============================================================
DROP TABLE IF EXISTS pago          CASCADE;
DROP TABLE IF EXISTS linea_pedido  CASCADE;
DROP TABLE IF EXISTS pedido_mesa   CASCADE;
DROP TABLE IF EXISTS pedido        CASCADE;
DROP TABLE IF EXISTS receta        CASCADE;
DROP TABLE IF EXISTS ingrediente   CASCADE;
DROP TABLE IF EXISTS plato         CASCADE;
DROP TABLE IF EXISTS reserva       CASCADE;
DROP TABLE IF EXISTS mesa          CASCADE;
DROP TABLE IF EXISTS mesero        CASCADE;
DROP TABLE IF EXISTS cliente       CASCADE;


-- ============================================================
-- PASO 1 · CLIENTE
--
-- Quien reserva. Nombre y teléfono son obligatorios: sin teléfono
-- no hay a quién llamar si la mesa se cae.
--
-- El teléfono NO es único a propósito. Una familia puede dejar el
-- mismo número dos veces, y eso no es un error.
-- ============================================================
CREATE TABLE cliente (
    cliente_id SERIAL       PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    telefono   VARCHAR(20)  NOT NULL
);


-- ============================================================
-- PASO 2 · MESERO
--
-- El documento SÍ es único: dos meseros no pueden tener la misma
-- cédula. Esa es la diferencia con el teléfono del cliente, y es
-- una decisión del negocio, no del programa.
-- ============================================================
CREATE TABLE mesero (
    mesero_id SERIAL       PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL,
    documento VARCHAR(20)  NOT NULL UNIQUE
);


-- ============================================================
-- PASO 3 · MESA
--
-- El número de mesa es único: no hay dos mesas 4 en el salón.
-- La capacidad tiene que ser positiva, y eso lo vigila un CHECK.
--
-- mesero_id es la primera clave foránea del archivo. Va aquí y no
-- en MESERO porque un mesero atiende varias mesas, y cada mesa
-- tiene un solo mesero asignado: el lado N se queda la clave.
--
-- Se permite NULL: una mesa puede estar sin asignar a nadie.
-- ============================================================
CREATE TABLE mesa (
    mesa_id   SERIAL  PRIMARY KEY,
    numero    INTEGER NOT NULL UNIQUE,
    puestos   INTEGER NOT NULL CHECK (puestos > 0),
    mesero_id INTEGER REFERENCES mesero (mesero_id)
);


-- ============================================================
-- PASO 4 · RESERVA
--
-- Dos claves foráneas: de quién es la reserva y para qué mesa.
-- Las dos obligatorias — una reserva sin cliente o sin mesa no es
-- una reserva.
--
-- personas > 0 por la misma razón que puestos > 0: reservar para
-- cero personas no significa nada.
-- ============================================================
CREATE TABLE reserva (
    reserva_id SERIAL  PRIMARY KEY,
    fecha      DATE    NOT NULL,
    hora       TIME    NOT NULL,
    personas   INTEGER NOT NULL CHECK (personas > 0),
    cliente_id INTEGER NOT NULL REFERENCES cliente (cliente_id),
    mesa_id    INTEGER NOT NULL REFERENCES mesa (mesa_id)
);


-- ============================================================
-- PASO 5 · PLATO
--
-- precio_actual es el precio de HOY en la carta. Ojo con el nombre:
-- se llama «actual» porque cambia, y por eso la línea del pedido
-- guarda su propio precio. Eso se ve en el paso 10.
-- ============================================================
CREATE TABLE plato (
    plato_id      SERIAL        PRIMARY KEY,
    nombre        VARCHAR(100)  NOT NULL,
    precio_actual NUMERIC(10,2) NOT NULL CHECK (precio_actual > 0)
);


-- ============================================================
-- PASO 6 · INGREDIENTE
-- ============================================================
CREATE TABLE ingrediente (
    ingrediente_id SERIAL       PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    vencimiento    DATE         NOT NULL
);


-- ============================================================
-- PASO 7 · RECETA  ·  TABLA PUENTE (1 de 3)
--
-- Un plato lleva varios ingredientes y un ingrediente sirve para
-- varios platos. Eso es un varios-a-varios, y un varios-a-varios no
-- cabe en dos tablas: hace falta una tercera.
--
-- Su clave primaria son las DOS columnas juntas. Así el mismo
-- ingrediente no puede aparecer dos veces en la misma receta.
-- ============================================================
CREATE TABLE receta (
    plato_id       INTEGER NOT NULL REFERENCES plato (plato_id),
    ingrediente_id INTEGER NOT NULL REFERENCES ingrediente (ingrediente_id),
    PRIMARY KEY (plato_id, ingrediente_id)
);


-- ============================================================
-- PASO 8 · PEDIDO
--
-- creado_en se llena solo: DEFAULT NOW() pone la fecha y la hora
-- del momento en que se inserta la fila. No hay que escribirla.
--
-- El CHECK sobre estado limita los valores posibles a tres. Si
-- alguien intenta guardar 'pendiente', la base lo rechaza.
--
-- Y fíjate en lo que NO está: no hay columna total. El total se
-- reconstruye sumando las líneas. Guardarlo sería copiar un dato
-- que ya está en otro sitio.
-- ============================================================
CREATE TABLE pedido (
    pedido_id SERIAL      PRIMARY KEY,
    creado_en TIMESTAMP   NOT NULL DEFAULT NOW(),
    estado    VARCHAR(20) NOT NULL DEFAULT 'abierto'
              CHECK (estado IN ('abierto', 'cerrado', 'anulado'))
);


-- ============================================================
-- PASO 9 · PEDIDO_MESA  ·  TABLA PUENTE (2 de 3)
--
-- Un pedido puede ocupar varias mesas (la fiesta que junta la 3 y
-- la 4), y una mesa recibe muchos pedidos a lo largo del día.
-- Varios-a-varios otra vez, y otra vez una tabla en medio.
-- ============================================================
CREATE TABLE pedido_mesa (
    pedido_id INTEGER NOT NULL REFERENCES pedido (pedido_id),
    mesa_id   INTEGER NOT NULL REFERENCES mesa (mesa_id),
    PRIMARY KEY (pedido_id, mesa_id)
);


-- ============================================================
-- PASO 10 · LINEA_PEDIDO  ·  TABLA PUENTE (3 de 3)
--
-- Un pedido lleva varios platos y un plato aparece en muchos
-- pedidos. La tercera tabla puente.
--
-- Esta se lleva algo propio que las otras dos no tienen: la
-- CANTIDAD y el PRECIO_UNITARIO. Por eso su clave primaria es una
-- columna suya (linea_id) y no la pareja: la misma pareja pedido +
-- plato podría repetirse si se piden dos ajiacos en momentos
-- distintos de la misma cuenta.
--
-- precio_unitario NO es plato.precio_actual. Es el precio de aquel
-- día. Si mañana sube el ajiaco, las cuentas de ayer no cambian —
-- y esa es la única copia que se guarda a propósito en todo el
-- modelo.
-- ============================================================
CREATE TABLE linea_pedido (
    linea_id        SERIAL        PRIMARY KEY,
    cantidad        INTEGER       NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    pedido_id       INTEGER       NOT NULL REFERENCES pedido (pedido_id),
    plato_id        INTEGER       NOT NULL REFERENCES plato (plato_id)
);


-- ============================================================
-- PASO 11 · PAGO
--
-- Un pedido puede pagarse en varios pagos (mitad en efectivo,
-- mitad en tarjeta), y cada pago pertenece a un solo pedido. El
-- lado N se queda la clave foránea: va en PAGO.
-- ============================================================
CREATE TABLE pago (
    pago_id   SERIAL        PRIMARY KEY,
    monto     NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    pedido_id INTEGER       NOT NULL REFERENCES pedido (pedido_id)
);


-- ============================================================
-- PASO 12 · LOS DATOS
--
-- Los cliente_id, mesero_id y demás no se escriben: son SERIAL y
-- los pone la base sola, empezando en 1 y en el orden en que se
-- insertan. Por eso más abajo se puede escribir mesero_id = 1
-- sabiendo que es Marta.
-- ============================================================

INSERT INTO mesero (nombre, documento) VALUES
    ('Marta Quintero',  '52148903'),
    ('Andrés Poveda',   '80231447'),
    ('Luisa Cárdenas',  '1013558902'),
    ('Julián Ospina',   '79554120');

INSERT INTO mesa (numero, puestos, mesero_id) VALUES
    (1, 4, 1),
    (2, 2, 1),
    (3, 6, 2),
    (4, 4, 2),
    (5, 8, 3),
    (6, 2, NULL);          -- la 6 aún no tiene mesero asignado

INSERT INTO cliente (nombre, telefono) VALUES
    ('Camila Restrepo',   '3104458821'),
    ('Jorge Beltrán',     '3126677401'),
    ('Sofía Naranjo',     '3005512099'),
    ('Diego Mahecha',     '3199087745'),
    ('Valentina Ruiz',    '3104458821'),   -- mismo teléfono que Camila: son hermanas
    ('Ernesto Cárdenas',  '3151122896'),
    ('Paula Gutiérrez',   '3178890234'),
    ('Ricardo Salgado',   '3013345678');

INSERT INTO plato (nombre, precio_actual) VALUES
    ('Ajiaco santafereño',   28000.00),
    ('Bandeja paisa',        34000.00),
    ('Sancocho de gallina',  30000.00),
    ('Limonada de coco',      9000.00),
    ('Arepa de choclo',       7500.00),
    ('Sobrebarriga al horno', 36000.00),
    ('Postre de natas',      11000.00),
    ('Tamal tolimense',      22000.00);    -- en la carta, y nadie lo ha pedido

INSERT INTO ingrediente (nombre, vencimiento) VALUES
    ('Papa criolla',    DATE '2026-09-20'),
    ('Pollo',           DATE '2026-09-12'),
    ('Guascas',         DATE '2027-02-28'),
    ('Crema de leche',  DATE '2026-09-18'),
    ('Fríjol',          DATE '2027-06-30'),
    ('Chicharrón',      DATE '2026-09-11'),
    ('Arroz',           DATE '2027-11-15'),
    ('Limón',           DATE '2026-09-14'),
    ('Coco',            DATE '2026-10-05'),
    ('Maíz',            DATE '2027-04-22');

INSERT INTO receta (plato_id, ingrediente_id) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4),        -- ajiaco
    (2, 5), (2, 6), (2, 7),                -- bandeja paisa
    (3, 2), (3, 1), (3, 7),                -- sancocho
    (4, 8), (4, 9),                        -- limonada de coco
    (5, 10),                               -- arepa de choclo
    (7, 4),                                -- postre de natas
    (8, 10);                               -- tamal

INSERT INTO pedido (creado_en, estado) VALUES
    (TIMESTAMP '2026-09-04 12:40:00', 'cerrado'),
    (TIMESTAMP '2026-09-04 13:05:00', 'cerrado'),
    (TIMESTAMP '2026-09-04 13:20:00', 'cerrado'),
    (TIMESTAMP '2026-09-05 19:10:00', 'cerrado'),
    (TIMESTAMP '2026-09-05 20:00:00', 'abierto'),
    (TIMESTAMP '2026-09-05 20:35:00', 'anulado');

INSERT INTO pedido_mesa (pedido_id, mesa_id) VALUES
    (1, 1),
    (2, 3),
    (3, 2),
    (4, 3), (4, 4),        -- este pedido ocupó DOS mesas: la fiesta
    (5, 5),
    (6, 1);

INSERT INTO linea_pedido (cantidad, precio_unitario, pedido_id, plato_id) VALUES
    (2, 26000.00, 1, 1),   -- el ajiaco costaba 26.000 aquel día, no 28.000
    (4,  9000.00, 1, 4),
    (1, 34000.00, 2, 2),
    (2,  7500.00, 2, 5),
    (1, 26000.00, 3, 1),
    (3, 30000.00, 4, 3),
    (2, 36000.00, 4, 6),
    (2, 11000.00, 4, 7),
    (1, 28000.00, 5, 1),
    (2,  9000.00, 5, 4);

INSERT INTO pago (monto, pedido_id) VALUES
    (88000.00, 1),
    (49000.00, 2),
    (26000.00, 3),
    (90000.00, 4),         -- este pedido se pagó en dos veces
    (94000.00, 4);

INSERT INTO reserva (fecha, hora, personas, cliente_id, mesa_id) VALUES
    (DATE '2026-09-10', TIME '19:00', 4, 1, 1),
    (DATE '2026-09-10', TIME '20:30', 2, 2, 2),
    (DATE '2026-09-11', TIME '13:00', 6, 3, 3),
    (DATE '2026-09-11', TIME '19:30', 8, 4, 5),
    (DATE '2026-09-12', TIME '12:30', 4, 5, 4);


-- ============================================================
-- COMPROBACIÓN 1 · ¿ESTÁN LAS ONCE TABLAS?
--
-- Selecciona estas líneas y pulsa Run. Deben salir once filas.
-- ============================================================
SELECT table_name AS tabla
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;


-- ============================================================
-- COMPROBACIÓN 2 · EL TOTAL QUE NO SE GUARDA
--
-- PEDIDO no tiene columna total. Aquí está, reconstruido: cada
-- línea aporta cantidad × precio_unitario, y se suman por pedido.
--
-- Compáralo con la tabla PAGO: el pedido 4 se pagó en dos veces,
-- 90.000 + 94.000 = 184.000, que es justo su total.
-- ============================================================
SELECT p.pedido_id,
       p.creado_en,
       p.estado,
       SUM(l.cantidad * l.precio_unitario) AS total
FROM pedido p
JOIN linea_pedido l ON l.pedido_id = p.pedido_id
GROUP BY p.pedido_id, p.creado_en, p.estado
ORDER BY p.pedido_id;


-- ============================================================
-- COMPROBACIÓN 3 · EL PRECIO DE AYER NO ES EL DE HOY
--
-- El ajiaco vale hoy 28.000 y en los pedidos de ayer aparece a
-- 26.000. Las dos cifras son correctas: son datos distintos.
-- ============================================================
SELECT l.linea_id,
       pl.nombre,
       l.precio_unitario AS precio_de_aquel_dia,
       pl.precio_actual  AS precio_de_hoy
FROM linea_pedido l
JOIN plato pl ON pl.plato_id = l.plato_id
WHERE pl.nombre = 'Ajiaco santafereño'
ORDER BY l.linea_id;


-- ============================================================
-- COMPROBACIÓN 4 · EL PLATO QUE NADIE HA PEDIDO
--
-- El tamal está en la carta desde el primer día y no aparece en
-- ninguna línea de pedido. Existe igual, porque PLATO es su propia
-- tabla y no depende de que alguien lo pida.
-- ============================================================
SELECT pl.nombre,
       COUNT(l.linea_id) AS veces_pedido
FROM plato pl
LEFT JOIN linea_pedido l ON l.plato_id = pl.plato_id
GROUP BY pl.nombre
ORDER BY veces_pedido, pl.nombre;


-- ============================================================
-- COMPROBACIÓN 5 · LA FIESTA DE DOS MESAS
--
-- El pedido 4 ocupó la mesa 3 y la mesa 4. Sin la tabla puente
-- pedido_mesa esto no se podría ni escribir.
-- ============================================================
SELECT pm.pedido_id,
       m.numero  AS mesa,
       m.puestos,
       me.nombre AS mesero
FROM pedido_mesa pm
JOIN mesa m   ON m.mesa_id = pm.mesa_id
LEFT JOIN mesero me ON me.mesero_id = m.mesero_id
WHERE pm.pedido_id = 4
ORDER BY m.numero;


-- ============================================================
-- COMPROBACIÓN 6 · LO QUE LA BASE NO TE DEJA HACER
--
-- Estas cuatro líneas están comentadas a propósito. Quítales los
-- dos guiones de delante, una por una, y ejecútalas para ver el
-- error. Cada una choca contra una regla distinta.
-- ============================================================

-- Choca contra el CHECK: no se puede reservar para cero personas.
-- INSERT INTO reserva (fecha, hora, personas, cliente_id, mesa_id)
-- VALUES (DATE '2026-09-15', TIME '19:00', 0, 1, 1);

-- Choca contra el UNIQUE: ya existe una mesa número 1.
-- INSERT INTO mesa (numero, puestos) VALUES (1, 4);

-- Choca contra la clave foránea: no existe el cliente 999.
-- INSERT INTO reserva (fecha, hora, personas, cliente_id, mesa_id)
-- VALUES (DATE '2026-09-15', TIME '19:00', 2, 999, 1);

-- Choca contra el NOT NULL: un plato sin nombre no es un plato.
-- INSERT INTO plato (nombre, precio_actual) VALUES (NULL, 15000);
