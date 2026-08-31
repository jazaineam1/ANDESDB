-- ============================================================
-- CÓMO LEER LA SINTAXIS DE ESTA SESIÓN
-- Palabras del lenguaje SQL: MAYÚSCULA.
-- Nombres de tablas y columnas: minúscula.
--
-- Patrón general:
-- CREATE TABLE nombre_tabla (
--     columna TIPO_DE_DATO RESTRICCIONES,
--     CONSTRAINT nombre_regla TIPO_RESTRICCION (...)
-- );
-- ============================================================

-- ============================================================
-- ANDESDB · Sesión 9
-- DDL + Supabase/PostgreSQL
-- Restaurante ABC: del modelo a una base real
-- ============================================================

-- RECOMENDADO EN CLASE:
-- Cambia abc_e01 por el código de tu equipo: abc_e02, abc_e03, etc.
CREATE SCHEMA IF NOT EXISTS abc_e01;
SET search_path TO abc_e01;

-- Limpieza para poder repetir el laboratorio.
DROP TABLE IF EXISTS linea_pedido CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS reserva_mesa CASCADE;
DROP TABLE IF EXISTS reserva CASCADE;
DROP TABLE IF EXISTS mesa CASCADE;
DROP TABLE IF EXISTS plato CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;

-- ============================================================
-- 1. Tablas base
-- ============================================================

CREATE TABLE cliente (
    cliente_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    telefono TEXT,

    CONSTRAINT pk_cliente PRIMARY KEY (cliente_id),
    CONSTRAINT uq_cliente_telefono UNIQUE (telefono)
);

CREATE TABLE mesa (
    mesa_id BIGINT GENERATED ALWAYS AS IDENTITY,
    codigo TEXT NOT NULL,
    puestos INTEGER NOT NULL,

    CONSTRAINT pk_mesa PRIMARY KEY (mesa_id),
    CONSTRAINT uq_mesa_codigo UNIQUE (codigo),
    CONSTRAINT ck_mesa_puestos CHECK (puestos > 0)
);

CREATE TABLE plato (
    plato_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    precio_actual NUMERIC(10,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_plato PRIMARY KEY (plato_id),
    CONSTRAINT uq_plato_nombre UNIQUE (nombre),
    CONSTRAINT ck_plato_precio CHECK (precio_actual >= 0)
);

-- ============================================================
-- 2. Reserva: FK + NOT NULL + CHECK
-- ============================================================

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

-- ============================================================
-- 3. Tabla puente: una reserva puede usar una o varias mesas
-- ============================================================

CREATE TABLE reserva_mesa (
    reserva_id BIGINT NOT NULL,
    mesa_id BIGINT NOT NULL,

    CONSTRAINT pk_reserva_mesa PRIMARY KEY (reserva_id, mesa_id),
    CONSTRAINT fk_reserva_mesa_reserva
        FOREIGN KEY (reserva_id) REFERENCES reserva(reserva_id),
    CONSTRAINT fk_reserva_mesa_mesa
        FOREIGN KEY (mesa_id) REFERENCES mesa(mesa_id)
);

-- ============================================================
-- 4. Pedido y línea de pedido
-- ============================================================

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

CREATE TABLE linea_pedido (
    pedido_id BIGINT NOT NULL,
    plato_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,

    CONSTRAINT pk_linea_pedido PRIMARY KEY (pedido_id, plato_id),
    CONSTRAINT fk_linea_pedido_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedido(pedido_id),
    CONSTRAINT fk_linea_pedido_plato
        FOREIGN KEY (plato_id) REFERENCES plato(plato_id),
    CONSTRAINT ck_linea_cantidad CHECK (cantidad > 0),
    CONSTRAINT ck_linea_precio CHECK (precio_unitario >= 0)
);

-- ============================================================
-- 5. INSERT válidos
-- ============================================================

INSERT INTO cliente (nombre, telefono) VALUES
('Ana Pérez', '3001234567'),
('Luis Gómez', '3102223344');

INSERT INTO mesa (codigo, puestos) VALUES
('M1', 4),
('M2', 4),
('M3', 8);

INSERT INTO plato (nombre, precio_actual) VALUES
('Ajiaco', 28000),
('Bandeja paisa', 32000),
('Limonada', 7000);

INSERT INTO reserva (cliente_id, fecha, hora, personas, estado)
VALUES (1, '2026-09-04', '20:00', 4, 'confirmada');

INSERT INTO reserva_mesa (reserva_id, mesa_id) VALUES
(1, 1),
(1, 2);

INSERT INTO pedido (reserva_id, estado) VALUES
(1, 'abierto');

INSERT INTO linea_pedido (pedido_id, plato_id, cantidad, precio_unitario) VALUES
(1, 1, 2, 28000),
(1, 3, 4, 7000);

-- Consulta de reconstrucción: no guardamos pedido.total.
SELECT
    p.pedido_id,
    SUM(lp.cantidad * lp.precio_unitario) AS total_calculado
FROM pedido p
JOIN linea_pedido lp ON lp.pedido_id = p.pedido_id
GROUP BY p.pedido_id;

-- ============================================================
-- 6. Pruebas que DEBEN FALLAR
-- Ejecuta una por una, no todas al mismo tiempo.
-- ============================================================

-- A. NOT NULL: debe fallar porque nombre es obligatorio.
-- INSERT INTO cliente (nombre, telefono) VALUES (NULL, '3999999999');

-- B. UNIQUE: debe fallar porque el teléfono ya existe.
-- INSERT INTO cliente (nombre, telefono) VALUES ('Cliente duplicado', '3001234567');

-- C. FK huérfana: debe fallar porque no existe cliente 999999.
-- INSERT INTO reserva (cliente_id, fecha, hora, personas)
-- VALUES (999999, '2026-09-04', '20:00', 4);

-- D. CHECK: debe fallar porque personas no puede ser 0.
-- INSERT INTO reserva (cliente_id, fecha, hora, personas)
-- VALUES (1, '2026-09-04', '21:00', 0);

-- E. CHECK: debe fallar porque cantidad debe ser positiva.
-- INSERT INTO linea_pedido (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES (1, 2, 0, 32000);

-- ============================================================
-- 7. ALTER TABLE: una regla aparece tarde
-- ============================================================

ALTER TABLE reserva
ADD CONSTRAINT ck_reserva_personas_max
CHECK (personas <= 20);

-- Esta debe fallar después del ALTER.
-- INSERT INTO reserva (cliente_id, fecha, hora, personas)
-- VALUES (1, '2026-09-05', '20:00', 25);

-- ============================================================
-- 8. Nota Supabase
-- ============================================================
-- Para una app real en Supabase, revisa permisos y Row Level Security.
-- En esta sesión usamos SQL Editor para aprender DDL, no para exponer API pública.
