-- ============================================================
-- ANDESDB · Sesión 9 · DDL + Supabase/PostgreSQL
-- Convención: palabras SQL en MAYÚSCULA; objetos en minúscula.
-- Modelo alineado con S7–S8.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS abc_e01;
SET search_path TO abc_e01;

DROP TABLE IF EXISTS linea_pedido CASCADE;
DROP TABLE IF EXISTS pedido_mesa CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS reserva CASCADE;
DROP TABLE IF EXISTS mesa CASCADE;
DROP TABLE IF EXISTS plato CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;

CREATE TABLE cliente (
    cliente_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    CONSTRAINT pk_cliente PRIMARY KEY (cliente_id)
);

CREATE TABLE mesa (
    mesa_id BIGINT GENERATED ALWAYS AS IDENTITY,
    codigo TEXT NOT NULL,
    puestos INTEGER NOT NULL,
    CONSTRAINT pk_mesa PRIMARY KEY (mesa_id),
    -- Decisión de diseño del laboratorio: cada mesa usa un código único.
    CONSTRAINT uq_mesa_codigo UNIQUE (codigo),
    CONSTRAINT ck_mesa_puestos CHECK (puestos > 0)
);

CREATE TABLE plato (
    plato_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    precio_actual NUMERIC(10,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_plato PRIMARY KEY (plato_id),
    CONSTRAINT ck_plato_precio CHECK (precio_actual >= 0)
);

CREATE TABLE reserva (
    reserva_id BIGINT GENERATED ALWAYS AS IDENTITY,
    cliente_id BIGINT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    personas INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    CONSTRAINT pk_reserva PRIMARY KEY (reserva_id),
    CONSTRAINT fk_reserva_cliente
        FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id),
    CONSTRAINT ck_reserva_personas CHECK (personas > 0),
    CONSTRAINT ck_reserva_estado
        CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'cumplida'))
);

CREATE TABLE pedido (
    pedido_id BIGINT GENERATED ALWAYS AS IDENTITY,
    reserva_id BIGINT,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    estado TEXT NOT NULL DEFAULT 'abierto',
    CONSTRAINT pk_pedido PRIMARY KEY (pedido_id),
    CONSTRAINT fk_pedido_reserva
        FOREIGN KEY (reserva_id) REFERENCES reserva(reserva_id),
    CONSTRAINT ck_pedido_estado
        CHECK (estado IN ('abierto', 'cerrado', 'cancelado'))
);

CREATE TABLE pedido_mesa (
    pedido_id BIGINT NOT NULL,
    mesa_id BIGINT NOT NULL,
    CONSTRAINT pk_pedido_mesa PRIMARY KEY (pedido_id, mesa_id),
    CONSTRAINT fk_pedido_mesa_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedido(pedido_id),
    CONSTRAINT fk_pedido_mesa_mesa
        FOREIGN KEY (mesa_id) REFERENCES mesa(mesa_id)
);

CREATE TABLE linea_pedido (
    linea_id BIGINT GENERATED ALWAYS AS IDENTITY,
    pedido_id BIGINT NOT NULL,
    plato_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    CONSTRAINT pk_linea_pedido PRIMARY KEY (linea_id),
    CONSTRAINT fk_linea_pedido_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedido(pedido_id),
    CONSTRAINT fk_linea_pedido_plato
        FOREIGN KEY (plato_id) REFERENCES plato(plato_id),
    CONSTRAINT ck_linea_cantidad CHECK (cantidad > 0),
    CONSTRAINT ck_linea_precio CHECK (precio_unitario >= 0)
);

INSERT INTO cliente (nombre, telefono) VALUES
('Ana Pérez', '3001234567'),
('Luis Gómez', '3102223344');

INSERT INTO mesa (codigo, puestos) VALUES
('M1', 4), ('M2', 4), ('M3', 8);

INSERT INTO plato (nombre, precio_actual) VALUES
('Ajiaco', 28000), ('Bandeja paisa', 32000), ('Limonada', 7000);

INSERT INTO reserva (cliente_id, fecha, hora, personas, estado)
VALUES (1, '2026-09-04', '20:00', 4, 'confirmada');

INSERT INTO pedido (reserva_id, estado)
VALUES (1, 'abierto');

INSERT INTO pedido_mesa (pedido_id, mesa_id) VALUES
(1, 1), (1, 2);

INSERT INTO linea_pedido (pedido_id, plato_id, cantidad, precio_unitario) VALUES
(1, 1, 2, 28000), (1, 3, 4, 7000);

WITH totales AS (
    SELECT pedido_id,
           SUM(cantidad * precio_unitario) AS total
    FROM linea_pedido
    GROUP BY pedido_id
)
SELECT p.pedido_id, t.total
FROM pedido p
JOIN totales t ON t.pedido_id = p.pedido_id;

-- PRUEBAS QUE DEBEN FALLAR: ejecuta una por una.

-- A. NOT NULL: NULL no es lo mismo que ''.
-- INSERT INTO cliente (nombre, telefono)
-- VALUES (NULL, '3999999999');

-- B. UNIQUE sobre mesa.codigo.
-- INSERT INTO mesa (codigo, puestos)
-- VALUES ('M1', 6);

-- C. FK huérfana.
-- INSERT INTO reserva (cliente_id, fecha, hora, personas)
-- VALUES (999999, '2026-09-04', '20:00', 4);

-- D. CHECK personas.
-- INSERT INTO reserva (cliente_id, fecha, hora, personas)
-- VALUES (1, '2026-09-04', '21:00', 0);

-- E. CHECK cantidad.
-- INSERT INTO linea_pedido (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES (1, 2, 0, 32000);

ALTER TABLE reserva
ADD CONSTRAINT ck_reserva_personas_max
CHECK (personas <= 20);

-- Debe fallar después del ALTER.
-- INSERT INTO reserva (cliente_id, fecha, hora, personas)
-- VALUES (1, '2026-09-05', '20:00', 25);

-- Nota Supabase: hoy usamos SQL Editor y un schema de clase.
-- No exponemos estas tablas a una app ni configuramos Data API/RLS.
