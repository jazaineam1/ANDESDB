-- ============================================================
-- ANDESDB · Sesión 9 · DDL + PostgreSQL
-- Convención: palabras SQL en MAYÚSCULA; objetos en minúscula.
--
-- PRINCIPIO HEREDADO DE S6:
--   * regla confirmada != regla candidata != hipótesis
--   * una decisión de modelo debe declararse como tal
--   * DDL no aumenta la certeza de una afirmación
--
-- Este archivo implementa un RECORTE del modelo de S7–S8.
-- No elimina pago, mesero, inventario/ingredientes ni otras partes
-- que hoy quedan fuera del objetivo DDL.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS abc_e01;
SET search_path TO abc_e01;

DROP TABLE IF EXISTS linea_pedido CASCADE;
DROP TABLE IF EXISTS pedido_mesa CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS reserva CASCADE;
DROP TABLE IF EXISTS plato CASCADE;
DROP TABLE IF EXISTS mesa CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;

-- DECISIÓN DE MODELO: identidad técnica del cliente.
-- S6 NO confirmó que nombre o teléfono sean obligatorios al crear el cliente.
CREATE TABLE cliente (
    cliente_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT,
    telefono TEXT,
    CONSTRAINT pk_cliente PRIMARY KEY (cliente_id)
);

-- La capacidad de la mesa es necesaria para la regla 3 confirmada.
-- codigo UNIQUE es una DECISIÓN EXPLÍCITA DEL LABORATORIO, no una frase de S6.
CREATE TABLE mesa (
    mesa_id BIGINT GENERATED ALWAYS AS IDENTITY,
    codigo TEXT NOT NULL,
    puestos INTEGER NOT NULL,
    CONSTRAINT pk_mesa PRIMARY KEY (mesa_id),
    CONSTRAINT uq_mesa_codigo UNIQUE (codigo),
    CONSTRAINT ck_mesa_puestos CHECK (puestos > 0)
);

-- Catálogo del recorte. precio_actual representa el precio vigente,
-- distinto del precio histórico cobrado que guardaremos en linea_pedido.
CREATE TABLE plato (
    plato_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    precio_actual NUMERIC(10,2),
    CONSTRAINT pk_plato PRIMARY KEY (plato_id),
    CONSTRAINT ck_plato_precio
        CHECK (precio_actual IS NULL OR precio_actual >= 0)
);

-- REGLA 1 DE S6: candidata.
-- Por eso cliente/fecha/hora/personas NO son NOT NULL globalmente.
-- Una reserva pendiente puede estar incompleta.
-- REGLA 3: confirmada, pero comparar personas con mesa.puestos
-- requiere información de otra fila/tabla: no cabe en un CHECK simple.
CREATE TABLE reserva (
    reserva_id BIGINT GENERATED ALWAYS AS IDENTITY,
    cliente_id BIGINT,
    mesa_id BIGINT,
    fecha DATE,
    hora TIME,
    personas INTEGER,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    CONSTRAINT pk_reserva PRIMARY KEY (reserva_id),
    CONSTRAINT fk_reserva_cliente
        FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id),
    CONSTRAINT fk_reserva_mesa
        FOREIGN KEY (mesa_id) REFERENCES mesa(mesa_id),
    CONSTRAINT ck_reserva_personas
        CHECK (personas IS NULL OR personas > 0)
);

-- No inventamos pedido.reserva_id: S6 no confirmó esa relación.
CREATE TABLE pedido (
    pedido_id BIGINT GENERATED ALWAYS AS IDENTITY,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    estado TEXT NOT NULL DEFAULT 'abierto',
    CONSTRAINT pk_pedido PRIMARY KEY (pedido_id)
);

-- NUEVA EVIDENCIA DE S7: un pedido puede atender varias mesas.
CREATE TABLE pedido_mesa (
    pedido_id BIGINT NOT NULL,
    mesa_id BIGINT NOT NULL,
    CONSTRAINT pk_pedido_mesa PRIMARY KEY (pedido_id, mesa_id),
    CONSTRAINT fk_pedido_mesa_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedido(pedido_id),
    CONSTRAINT fk_pedido_mesa_mesa
        FOREIGN KEY (mesa_id) REFERENCES mesa(mesa_id)
);

-- DECISIÓN DE MODELO DE S8: linea_id como PK.
-- No imponemos UNIQUE(pedido_id, plato_id) porque nadie confirmó
-- que un plato solo pueda aparecer una vez por pedido.
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

-- ------------------------------------------------------------
-- DATOS VÁLIDOS
-- ------------------------------------------------------------
INSERT INTO cliente (nombre, telefono) VALUES
('Ana Pérez', '3001234567'),
('Luis Gómez', '3102223344');

INSERT INTO mesa (codigo, puestos) VALUES
('M1', 4), ('M2', 4), ('M3', 8);

INSERT INTO plato (nombre, precio_actual) VALUES
('Ajiaco', 28000), ('Bandeja paisa', 32000), ('Limonada', 7000);

INSERT INTO reserva (cliente_id, mesa_id, fecha, hora, personas, estado)
VALUES (1, 1, '2026-09-04', '20:00', 4, 'pendiente');

-- Esta fila DEBE poder existir: demuestra que la regla 1 sigue candidata
-- y que no convertimos “confirmar” en NOT NULL para todo estado.
INSERT INTO reserva (estado)
VALUES ('pendiente');

INSERT INTO pedido (estado)
VALUES ('abierto');

INSERT INTO pedido_mesa (pedido_id, mesa_id) VALUES
(1, 1), (1, 2);

INSERT INTO linea_pedido (pedido_id, plato_id, cantidad, precio_unitario) VALUES
(1, 1, 2, 28000),
(1, 3, 4, 7000);

-- Reconstrucción del total: reutiliza WITH + GROUP BY + JOIN.
WITH totales AS (
    SELECT pedido_id,
           SUM(cantidad * precio_unitario) AS total
    FROM linea_pedido
    GROUP BY pedido_id
)
SELECT p.pedido_id, t.total
FROM pedido p
JOIN totales t ON t.pedido_id = p.pedido_id;

-- ------------------------------------------------------------
-- PRUEBAS QUE DEBEN FALLAR: ejecutar UNA POR UNA.
-- ------------------------------------------------------------

-- A. NOT NULL · invariante del modelo: una mesa necesita capacidad.
-- INSERT INTO mesa (codigo, puestos)
-- VALUES ('M4', NULL);

-- B. UNIQUE · decisión explícita del laboratorio sobre mesa.codigo.
-- INSERT INTO mesa (codigo, puestos)
-- VALUES ('M1', 6);

-- C. FK · si informamos un cliente, debe existir.
-- INSERT INTO reserva (cliente_id, estado)
-- VALUES (999999, 'pendiente');

-- D. CHECK · decisión de dominio: no aceptamos cantidad cero.
-- INSERT INTO linea_pedido (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES (1, 2, 0, 32000);

-- E. CHECK · personas, si se informa, debe ser positiva.
-- INSERT INTO reserva (personas, estado)
-- VALUES (0, 'pendiente');

-- ------------------------------------------------------------
-- SIMULACIÓN DIDÁCTICA · NO EJECUTAR HASTA QUE EL DOCENTE DIGA:
-- “La dueña acaba de confirmar la regla 1”.
--
-- La regla habla de CONFIRMAR una reserva, no de crear un borrador.
-- Por eso una condición por estado es más fiel que cuatro NOT NULL globales.
-- ------------------------------------------------------------
-- ALTER TABLE reserva
-- ADD CONSTRAINT ck_reserva_confirmada_completa
-- CHECK (
--     estado <> 'confirmada'
--     OR (
--         fecha IS NOT NULL
--         AND hora IS NOT NULL
--         AND personas IS NOT NULL
--         AND cliente_id IS NOT NULL
--     )
-- );
--
-- Después de agregarla, esto debería fallar:
-- INSERT INTO reserva (estado)
-- VALUES ('confirmada');

-- Entorno de clase: ejecutamos este SQL de PostgreSQL desde el SQL Editor de Supabase.
-- Supabase es la interfaz de acceso; el objetivo técnico de la sesión es PostgreSQL.
-- No exponemos estas tablas a una app ni configuramos Data API/RLS.
