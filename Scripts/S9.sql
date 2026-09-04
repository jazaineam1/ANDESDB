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
-- LABORATORIO DE NORMALIZACION -> YA NO VIVE AQUI
--
-- Las nueve tablas del laboratorio de 1FN, 2FN y 3FN se movieron a
-- una base SQLite que corre en el navegador:
--
--     Presentaciones/M3/base-datos/s9-normalizacion.db
--
-- En la presentacion, cada consulta trae un boton que la abre ahi.
-- No hace falta Supabase para ese bloque, y por eso ya no esta en
-- este guion: aqui abajo empieza lo unico que si necesita un motor
-- PostgreSQL de verdad, que es el DDL del restaurante.
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
