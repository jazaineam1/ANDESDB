-- ============================================================
-- ANDESDB · Sesión 9 · Del modelo a una base real
-- DDL + PostgreSQL · Supabase
--
-- IDEA DE LA SESIÓN
-- Primero usamos SQL conocido para descubrir tres diseños problemáticos.
-- Después ponemos nombre a lo observado: 1FN, 2FN y 3FN.
-- Finalmente construimos el núcleo correcto con DDL y probamos sus reglas.
--
-- IMPORTANTE
-- 1. NO ejecutes todo de una vez.
-- 2. Ejecuta solo el bloque indicado por la presentación.
-- 3. Las tablas lab_* son deliberadamente malas: existen para romperlas.
-- 4. Antes de una prueba negativa, predice qué debería ocurrir.
-- ============================================================

-- ============================================================
-- CHECKPOINT 0 · ESPACIO DEL EQUIPO
-- Cambia 01 por el número de tu equipo.
-- ============================================================
CREATE SCHEMA IF NOT EXISTS abc_e01;
SET search_path TO abc_e01;


-- ============================================================
-- LABORATORIO DE NORMALIZACIÓN · PREPARACIÓN
-- EJECUTA ESTE BLOQUE COMPLETO SIN ANALIZAR TODAVÍA EL DDL.
-- Solo prepara tres pequeñas bases deliberadamente problemáticas.
-- ============================================================
DROP TABLE IF EXISTS lab_1fn_linea_bien;
DROP TABLE IF EXISTS lab_1fn_pedido_mal;
DROP TABLE IF EXISTS lab_2fn_linea_bien;
DROP TABLE IF EXISTS lab_2fn_plato_bien;
DROP TABLE IF EXISTS lab_2fn_pedido_bien;
DROP TABLE IF EXISTS lab_2fn_linea_mal;
DROP TABLE IF EXISTS lab_3fn_pedido_bien;
DROP TABLE IF EXISTS lab_3fn_mesa_bien;
DROP TABLE IF EXISTS lab_3fn_pedido_mal;

-- Problema para 1FN: varios hechos consultables escondidos en una celda.
CREATE TABLE lab_1fn_pedido_mal (
    pedido_id INTEGER PRIMARY KEY,
    platos TEXT NOT NULL
);

INSERT INTO lab_1fn_pedido_mal (pedido_id, platos) VALUES
(1, 'Ajiaco x2; Limonada x4'),
(2, 'Bandeja x1'),
(3, 'Ajiaco x1; Bandeja x2');

-- Problema para 2FN: clave compuesta, pero algunos atributos dependen
-- solo de una parte de la clave.
CREATE TABLE lab_2fn_linea_mal (
    pedido_id INTEGER,
    plato_id INTEGER,
    fecha_pedido DATE NOT NULL,
    nombre_plato TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    PRIMARY KEY (pedido_id, plato_id)
);

INSERT INTO lab_2fn_linea_mal
    (pedido_id, plato_id, fecha_pedido, nombre_plato, cantidad) VALUES
(1, 10, '2026-09-04', 'Ajiaco', 2),
(1, 20, '2026-09-04', 'Limonada', 4),
(2, 10, '2026-09-05', 'Ajiaco', 1),
(3, 10, '2026-09-06', 'Ajiaco', 2);

-- Problema para 3FN: puestos depende de mesa_id, no de pedido_id.
CREATE TABLE lab_3fn_pedido_mal (
    pedido_id INTEGER PRIMARY KEY,
    mesa_id INTEGER NOT NULL,
    puestos INTEGER NOT NULL
);

INSERT INTO lab_3fn_pedido_mal (pedido_id, mesa_id, puestos) VALUES
(1, 1, 4),
(2, 2, 2),
(3, 1, 4),
(4, 1, 4);


-- ============================================================
-- INCIDENTE 1 · 1FN
-- PREGUNTA: ¿qué pedidos contienen Ajiaco?
-- ============================================================
SELECT *
FROM lab_1fn_pedido_mal
WHERE platos = 'Ajiaco';

-- Resultado esperado: 0 filas.
-- Pero sabemos que sí hay Ajiaco.

-- Intento más flexible: encuentra pedidos, pero seguimos tratando
-- una lista como texto y todavía no tenemos una columna cantidad.
SELECT *
FROM lab_1fn_pedido_mal
WHERE platos ILIKE '%Ajiaco%';

-- PREGUNTA MÁS IMPORTANTE:
-- ¿Cuántos Ajiacos vendimos?
-- Con este diseño no existe una columna cantidad que podamos sumar.

-- ============================================================
-- INCIDENTE 1 · REPARACIÓN
-- No memorices todavía CREATE TABLE. Mira el cambio de estructura:
-- una fila = un plato dentro de un pedido.
-- ============================================================
CREATE TABLE lab_1fn_linea_bien (
    pedido_id INTEGER NOT NULL,
    plato TEXT NOT NULL,
    cantidad INTEGER NOT NULL
);

INSERT INTO lab_1fn_linea_bien (pedido_id, plato, cantidad) VALUES
(1, 'Ajiaco', 2),
(1, 'Limonada', 4),
(2, 'Bandeja', 1),
(3, 'Ajiaco', 1),
(3, 'Bandeja', 2);

SELECT SUM(cantidad) AS ajiacos_vendidos
FROM lab_1fn_linea_bien
WHERE plato = 'Ajiaco';
-- Resultado esperado: 3.


-- ============================================================
-- INCIDENTE 2 · 2FN
-- La clave de lab_2fn_linea_mal es (pedido_id, plato_id).
-- Simulamos un cambio normal: Ajiaco cambia de nombre.
-- Alguien actualiza SOLO una de las copias.
-- ============================================================
UPDATE lab_2fn_linea_mal
SET nombre_plato = 'Ajiaco santafereño'
WHERE pedido_id = 1
  AND plato_id = 10;

-- ¿La base ahora dice más de un nombre para el mismo plato?
SELECT plato_id,
       COUNT(DISTINCT nombre_plato) AS nombres_distintos
FROM lab_2fn_linea_mal
GROUP BY plato_id
HAVING COUNT(DISTINCT nombre_plato) > 1;

-- Mira las filas concretas.
SELECT pedido_id, plato_id, nombre_plato, cantidad
FROM lab_2fn_linea_mal
WHERE plato_id = 10
ORDER BY pedido_id;

-- PREGUNTA:
-- ¿nombre_plato necesita conocer pedido_id?
-- No. nombre_plato depende solamente de plato_id.
-- ¿fecha_pedido necesita conocer plato_id?
-- No. fecha_pedido depende solamente de pedido_id.

-- ============================================================
-- INCIDENTE 2 · REPARACIÓN
-- Separamos lo que depende de PEDIDO, de PLATO y de la combinación.
-- ============================================================
CREATE TABLE lab_2fn_pedido_bien (
    pedido_id INTEGER PRIMARY KEY,
    fecha_pedido DATE NOT NULL
);

CREATE TABLE lab_2fn_plato_bien (
    plato_id INTEGER PRIMARY KEY,
    nombre_plato TEXT NOT NULL
);

CREATE TABLE lab_2fn_linea_bien (
    pedido_id INTEGER NOT NULL,
    plato_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    PRIMARY KEY (pedido_id, plato_id)
);

INSERT INTO lab_2fn_pedido_bien VALUES
(1, '2026-09-04'), (2, '2026-09-05'), (3, '2026-09-06');

INSERT INTO lab_2fn_plato_bien VALUES
(10, 'Ajiaco'), (20, 'Limonada');

INSERT INTO lab_2fn_linea_bien VALUES
(1, 10, 2), (1, 20, 4), (2, 10, 1), (3, 10, 2);

-- Ahora el nombre vive en UN solo lugar.
UPDATE lab_2fn_plato_bien
SET nombre_plato = 'Ajiaco santafereño'
WHERE plato_id = 10;

-- Reconstruimos la vista que necesitamos con JOIN.
SELECT l.pedido_id,
       p.nombre_plato,
       l.cantidad
FROM lab_2fn_linea_bien l
JOIN lab_2fn_plato_bien p
  ON p.plato_id = l.plato_id
WHERE l.plato_id = 10
ORDER BY l.pedido_id;
-- Las tres filas deben mostrar el mismo nombre.


-- ============================================================
-- INCIDENTE 3 · 3FN
-- La mesa 1 cambia de 4 a 6 puestos.
-- Alguien actualiza una sola copia dentro de PEDIDO.
-- ============================================================
UPDATE lab_3fn_pedido_mal
SET puestos = 6
WHERE pedido_id = 4;

-- ¿La misma mesa tiene ahora capacidades distintas?
SELECT mesa_id,
       COUNT(DISTINCT puestos) AS capacidades_distintas
FROM lab_3fn_pedido_mal
GROUP BY mesa_id
HAVING COUNT(DISTINCT puestos) > 1;

SELECT pedido_id, mesa_id, puestos
FROM lab_3fn_pedido_mal
WHERE mesa_id = 1
ORDER BY pedido_id;

-- PREGUNTA:
-- ¿puestos describe al pedido o describe a la mesa?
-- pedido_id -> mesa_id -> puestos
-- puestos depende de mesa_id.

-- ============================================================
-- INCIDENTE 3 · REPARACIÓN
-- La capacidad vive una vez en MESA. PEDIDO conserva mesa_id.
-- ============================================================
CREATE TABLE lab_3fn_mesa_bien (
    mesa_id INTEGER PRIMARY KEY,
    puestos INTEGER NOT NULL
);

CREATE TABLE lab_3fn_pedido_bien (
    pedido_id INTEGER PRIMARY KEY,
    mesa_id INTEGER NOT NULL
);

INSERT INTO lab_3fn_mesa_bien VALUES
(1, 4), (2, 2);

INSERT INTO lab_3fn_pedido_bien VALUES
(1, 1), (2, 2), (3, 1), (4, 1);

-- Un único cambio.
UPDATE lab_3fn_mesa_bien
SET puestos = 6
WHERE mesa_id = 1;

-- Reconstruimos la información mediante JOIN.
SELECT p.pedido_id,
       p.mesa_id,
       m.puestos
FROM lab_3fn_pedido_bien p
JOIN lab_3fn_mesa_bien m
  ON m.mesa_id = p.mesa_id
WHERE p.mesa_id = 1
ORDER BY p.pedido_id;
-- Todos los pedidos de la mesa 1 deben mostrar 6 puestos.


-- ============================================================
-- QUÉ ACABAMOS DE HACER
-- 1FN: dejamos de esconder varios hechos en una celda.
-- 2FN: con clave compuesta, sacamos lo que dependía de media clave.
-- 3FN: sacamos lo que dependía de otra columna no clave.
--
-- En los tres casos hicimos la misma pregunta:
-- ¿DE QUÉ DEPENDE ESTE DATO Y DÓNDE DEBE VIVIR?
--
-- Las instrucciones CREATE TABLE que acabamos de ejecutar pertenecen
-- a DDL: SQL para definir estructura.
-- ============================================================


-- ============================================================
-- NÚCLEO REAL DEL RESTAURANTE ABC
-- Ahora sí leemos y construimos el DDL conscientemente.
-- ============================================================
DROP TABLE IF EXISTS linea_pedido CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS plato CASCADE;

-- ============================================================
-- CHECKPOINT 1 · PLATO
-- ============================================================
CREATE TABLE plato (
    plato_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    precio_actual NUMERIC(10,2) NOT NULL,

    CONSTRAINT pk_plato PRIMARY KEY (plato_id),
    CONSTRAINT ck_plato_precio CHECK (precio_actual >= 0)
);

INSERT INTO plato (nombre, precio_actual)
VALUES ('Ajiaco', 28000)
RETURNING *;

-- Debe fallar por ck_plato_precio.
-- INSERT INTO plato (nombre, precio_actual)
-- VALUES ('Plato imposible', -1000);


-- ============================================================
-- CHECKPOINT 2 · PEDIDO
-- ============================================================
CREATE TABLE pedido (
    pedido_id BIGINT GENERATED ALWAYS AS IDENTITY,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado TEXT NOT NULL DEFAULT 'abierto',

    CONSTRAINT pk_pedido PRIMARY KEY (pedido_id),
    CONSTRAINT ck_pedido_estado
        CHECK (estado IN ('abierto', 'en cocina', 'cerrado'))
);

INSERT INTO pedido DEFAULT VALUES
RETURNING *;

-- Debe fallar por ck_pedido_estado.
-- INSERT INTO pedido (estado) VALUES ('inventado');


-- ============================================================
-- CHECKPOINT 3 · LINEA_PEDIDO
-- ============================================================
CREATE TABLE linea_pedido (
    linea_id BIGINT GENERATED ALWAYS AS IDENTITY,
    pedido_id BIGINT NOT NULL,
    plato_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,

    CONSTRAINT pk_linea_pedido PRIMARY KEY (linea_id),

    CONSTRAINT fk_linea_pedido_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedido(pedido_id),

    CONSTRAINT fk_linea_pedido_plato
        FOREIGN KEY (plato_id)
        REFERENCES plato(plato_id),

    CONSTRAINT ck_linea_cantidad CHECK (cantidad > 0),
    CONSTRAINT ck_linea_precio CHECK (precio_unitario >= 0)
);


-- ============================================================
-- CHECKPOINT 4 · DATO VÁLIDO + RECONSTRUCCIÓN
-- ============================================================
INSERT INTO linea_pedido
    (pedido_id, plato_id, cantidad, precio_unitario)
VALUES
    (1, 1, 2, 28000)
RETURNING *;

SELECT pedido_id,
       SUM(cantidad * precio_unitario) AS total
FROM linea_pedido
GROUP BY pedido_id;


-- ============================================================
-- CHECKPOINT 5 · PREDICE EL ERROR
-- Ejecuta UNA POR UNA.
-- ============================================================

-- NOT NULL
-- INSERT INTO linea_pedido
--     (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES (1, 1, NULL, 28000);

-- FOREIGN KEY
-- INSERT INTO linea_pedido
--     (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES (999999, 1, 1, 28000);

-- CHECK
-- INSERT INTO linea_pedido
--     (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES (1, 1, 0, 28000);


-- ============================================================
-- DECISIONES QUE NO SE IMPONEN POR INTUICIÓN
-- ============================================================

-- Solo si el negocio prohíbe repetir un plato dentro del mismo pedido:
-- ALTER TABLE linea_pedido
-- ADD CONSTRAINT uq_linea_pedido_pedido_plato
-- UNIQUE (pedido_id, plato_id);

-- Solo si el negocio confirma nombres de plato irrepetibles:
-- ALTER TABLE plato
-- ADD CONSTRAINT uq_plato_nombre UNIQUE (nombre);

-- DDL también permite cambiar estructura:
-- ALTER TABLE pedido
-- ADD COLUMN observacion TEXT;

-- DROP elimina la tabla, no solo sus filas.
-- DROP TABLE linea_pedido;
