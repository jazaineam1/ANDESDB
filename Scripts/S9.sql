-- ============================================================
-- ANDESDB · Sesión 9 · DDL + PostgreSQL
-- Tutorial guiado por checkpoints
-- Convención: palabras SQL en MAYÚSCULA; objetos en minúscula.
--
-- IMPORTANTE:
-- 1. NO ejecutes todo de una vez.
-- 2. Ejecuta cada bloque cuando la presentación lo indique.
-- 3. Antes de cada prueba inválida, predice qué restricción debe actuar.
--
-- PRINCIPIO HEREDADO DE S6–S8:
-- DDL hace ejecutable una decisión; no aumenta la certeza de una regla.
-- ============================================================

-- ============================================================
-- CHECKPOINT 1 · ESPACIO DEL EQUIPO
-- Cambia 01 por el número de tu equipo.
-- ============================================================
CREATE SCHEMA IF NOT EXISTS abc_e01;
SET search_path TO abc_e01;

-- Reinicio del núcleo durante la clase.
DROP TABLE IF EXISTS linea_pedido CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS plato CASCADE;

-- ============================================================
-- CHECKPOINT 2 · PRIMERA TABLA: PLATO
-- ============================================================
CREATE TABLE plato (
    plato_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    precio_actual NUMERIC(10,2) NOT NULL,

    CONSTRAINT pk_plato PRIMARY KEY (plato_id),
    CONSTRAINT ck_plato_precio CHECK (precio_actual >= 0)
);

-- Prueba válida.
INSERT INTO plato (nombre, precio_actual)
VALUES ('Ajiaco', 28000)
RETURNING *;

-- Prueba inválida: debe fallar por ck_plato_precio.
-- INSERT INTO plato (nombre, precio_actual)
-- VALUES ('Plato imposible', -1000);

-- ============================================================
-- CHECKPOINT 3 · SEGUNDA TABLA: PEDIDO
-- ============================================================
CREATE TABLE pedido (
    pedido_id BIGINT GENERATED ALWAYS AS IDENTITY,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado TEXT NOT NULL DEFAULT 'abierto',

    CONSTRAINT pk_pedido PRIMARY KEY (pedido_id),
    CONSTRAINT ck_pedido_estado
        CHECK (estado IN ('abierto', 'en cocina', 'cerrado'))
);

-- Prueba de IDENTITY y DEFAULT.
INSERT INTO pedido DEFAULT VALUES
RETURNING *;

-- Prueba inválida: debe fallar por ck_pedido_estado.
-- INSERT INTO pedido (estado)
-- VALUES ('inventado');

-- ============================================================
-- CHECKPOINT 4 · TERCERA TABLA: LINEA_PEDIDO
-- Esta tabla materializa la relación entre PEDIDO y PLATO.
-- precio_unitario conserva el valor histórico cobrado.
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

    CONSTRAINT ck_linea_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT ck_linea_precio
        CHECK (precio_unitario >= 0)
);

-- ============================================================
-- CHECKPOINT 5 · DATO VÁLIDO Y RECONSTRUCCIÓN
-- ============================================================
INSERT INTO linea_pedido
    (pedido_id, plato_id, cantidad, precio_unitario)
VALUES
    (1, 1, 2, 28000)
RETURNING *;

-- Reconstrucción del total trabajada en S8.
SELECT pedido_id,
       SUM(cantidad * precio_unitario) AS total
FROM linea_pedido
GROUP BY pedido_id;

-- ============================================================
-- CHECKPOINT 6 · PREDICE EL ERROR ANTES DE EJECUTAR
-- Ejecuta las pruebas inválidas UNA POR UNA.
-- ============================================================

-- Debe fallar por NOT NULL: cantidad no puede faltar.
-- INSERT INTO linea_pedido
--     (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES
--     (1, 1, NULL, 28000);

-- Debe fallar por FOREIGN KEY: el pedido 999999 no existe.
-- INSERT INTO linea_pedido
--     (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES
--     (999999, 1, 1, 28000);

-- Debe fallar por CHECK: cantidad debe ser mayor que cero.
-- INSERT INTO linea_pedido
--     (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES
--     (1, 1, 0, 28000);

-- ============================================================
-- DECISIONES QUE NO SE IMPONEN POR INTUICIÓN
-- ============================================================

-- Si el negocio confirma que un plato no puede repetirse dentro
-- del mismo pedido, esta restricción sería defendible.
-- No la agregues sin esa decisión explícita.
-- ALTER TABLE linea_pedido
-- ADD CONSTRAINT uq_linea_pedido_pedido_plato
-- UNIQUE (pedido_id, plato_id);

-- Si el negocio confirma que dos platos no pueden tener el mismo nombre:
-- ALTER TABLE plato
-- ADD CONSTRAINT uq_plato_nombre UNIQUE (nombre);

-- DDL también puede cambiar estructura después de crearla.
-- ALTER TABLE pedido
-- ADD COLUMN observacion TEXT;

-- DROP no borra filas: elimina la tabla.
-- Borrado comentado para evitar accidentes.
-- DROP TABLE linea_pedido;
