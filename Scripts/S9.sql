-- ============================================================
-- ANDESDB · Sesión 9 · DDL + PostgreSQL
-- Tutorial guiado por checkpoints
-- Convención: palabras SQL en MAYÚSCULA; objetos en minúscula.
--
-- IMPORTANTE:
-- 1. NO ejecutes todo de una vez.
-- 2. Ejecuta cada bloque cuando la presentación lo indique.
-- 3. Después de cada CREATE TABLE, verifica el objeto.
-- 4. Las pruebas inválidas se ejecutan UNA POR UNA.
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

-- Si necesitas reiniciar el núcleo durante la clase:
DROP TABLE IF EXISTS linea_pedido CASCADE;
DROP TABLE IF EXISTS plato CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;

-- ============================================================
-- CHECKPOINT 2 · PRIMERA TABLA: PEDIDO
-- Qué observar:
--   * IDENTITY genera el identificador.
--   * PRIMARY KEY define la identidad de la fila.
--   * DEFAULT rellena valores omitidos.
-- ============================================================
CREATE TABLE pedido (
    pedido_id BIGINT GENERATED ALWAYS AS IDENTITY,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    estado TEXT NOT NULL DEFAULT 'abierto',
    CONSTRAINT pk_pedido PRIMARY KEY (pedido_id)
);

-- ============================================================
-- CHECKPOINT 3 · PRUEBA DE IDENTITY Y DEFAULT
-- Ejecuta el INSERT y luego el SELECT.
-- Debes ver pedido_id, creado_en y estado aunque no los escribiste.
-- ============================================================
INSERT INTO pedido DEFAULT VALUES;

SELECT *
FROM pedido;

-- ============================================================
-- CHECKPOINT 4 · SEGUNDA TABLA: PLATO
-- precio_actual representa el precio vigente del catálogo.
-- El CHECK dice: si hay precio, no puede ser negativo.
-- ============================================================
CREATE TABLE plato (
    plato_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    precio_actual NUMERIC(10,2),
    CONSTRAINT pk_plato PRIMARY KEY (plato_id),
    CONSTRAINT ck_plato_precio
        CHECK (precio_actual IS NULL OR precio_actual >= 0)
);

-- ============================================================
-- CHECKPOINT 5 · PRUEBA QUE DEBE FALLAR
-- Ejecuta SOLO este INSERT cuando lo indique el docente.
-- Debe fallar por ck_plato_precio.
-- ============================================================
-- INSERT INTO plato (nombre, precio_actual)
-- VALUES ('Prueba', -100);

-- ============================================================
-- CHECKPOINT 6 · TERCERA TABLA: LINEA_PEDIDO
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
-- CHECKPOINT 7 · DATOS VÁLIDOS
-- Ejecuta en este orden.
-- ============================================================
INSERT INTO plato (nombre, precio_actual) VALUES
('Ajiaco', 28000),
('Limonada', 7000);

INSERT INTO linea_pedido
    (pedido_id, plato_id, cantidad, precio_unitario)
VALUES
    (1, 1, 2, 28000),
    (1, 2, 4, 7000);

SELECT *
FROM linea_pedido;

-- Reconstrucción del total trabajada en S8.
WITH totales AS (
    SELECT pedido_id,
           SUM(cantidad * precio_unitario) AS total
    FROM linea_pedido
    GROUP BY pedido_id
)
SELECT p.pedido_id,
       p.estado,
       t.total
FROM pedido p
JOIN totales t
  ON t.pedido_id = p.pedido_id;

-- ============================================================
-- CHECKPOINT 8 · PRUEBA DE FOREIGN KEY
-- Debe fallar: el pedido 999999 no existe.
-- Busca el nombre fk_linea_pedido_pedido en el error.
-- ============================================================
-- INSERT INTO linea_pedido
--     (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES
--     (999999, 1, 1, 28000);

-- ============================================================
-- CHECKPOINT 9 · PRUEBA DE CHECK
-- Debe fallar por ck_linea_cantidad.
-- ============================================================
-- INSERT INTO linea_pedido
--     (pedido_id, plato_id, cantidad, precio_unitario)
-- VALUES
--     (1, 1, 0, 28000);

-- ============================================================
-- FIN DEL NÚCLEO OBLIGATORIO
-- Si puedes explicar por qué fallan los checkpoints 8 y 9,
-- el objetivo principal de la sesión está cumplido.
--
-- NO continúes a la extensión si todavía no puedes explicar:
--   PRIMARY KEY / FOREIGN KEY / NOT NULL / CHECK / DEFAULT.
-- ============================================================


-- ============================================================
-- EXTENSIÓN GUIADA · SOLO SI EL NÚCLEO TERMINÓ
-- Cliente + mesa + reserva
--
-- Esta extensión recupera reglas del Restaurante ABC sin asumir que
-- todo el modelo de S7 quedó terminado.
-- ============================================================

DROP TABLE IF EXISTS reserva CASCADE;
DROP TABLE IF EXISTS mesa CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;

-- DECISIÓN DE MODELO: identidad técnica del cliente.
-- No imponemos nombre o teléfono como obligatorios por una regla que
-- el negocio no confirmó para la creación de todo cliente.
CREATE TABLE cliente (
    cliente_id BIGINT GENERATED ALWAYS AS IDENTITY,
    nombre TEXT,
    telefono TEXT,
    CONSTRAINT pk_cliente PRIMARY KEY (cliente_id)
);

-- La capacidad es necesaria para representar la regla 3.
-- codigo UNIQUE es una DECISIÓN EXPLÍCITA DEL EJERCICIO, no una regla
-- que debamos atribuir a la dueña.
CREATE TABLE mesa (
    mesa_id BIGINT GENERATED ALWAYS AS IDENTITY,
    codigo TEXT NOT NULL,
    puestos INTEGER NOT NULL,
    CONSTRAINT pk_mesa PRIMARY KEY (mesa_id),
    CONSTRAINT uq_mesa_codigo UNIQUE (codigo),
    CONSTRAINT ck_mesa_puestos CHECK (puestos > 0)
);

-- REGLA 1: sigue CANDIDATA.
-- La frase habla de CONFIRMAR una reserva, no necesariamente de crearla.
-- Por eso fecha, hora, personas y cliente NO son NOT NULL globales.
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
        FOREIGN KEY (cliente_id)
        REFERENCES cliente(cliente_id),

    CONSTRAINT fk_reserva_mesa
        FOREIGN KEY (mesa_id)
        REFERENCES mesa(mesa_id),

    CONSTRAINT ck_reserva_personas
        CHECK (personas IS NULL OR personas > 0)
);

-- Datos válidos de la extensión.
INSERT INTO cliente (nombre, telefono) VALUES
('Ana Pérez', '3001234567'),
('Luis Gómez', '3102223344');

INSERT INTO mesa (codigo, puestos) VALUES
('M1', 4),
('M2', 2);

INSERT INTO reserva
    (cliente_id, mesa_id, fecha, hora, personas, estado)
VALUES
    (1, 1, '2026-09-04', '20:00', 4, 'pendiente');

-- Esta fila DEBE poder entrar con el modelo actual.
-- Demuestra que no convertimos silenciosamente R1 candidata en cuatro NOT NULL.
INSERT INTO reserva (estado)
VALUES ('pendiente');

-- PRUEBA FK · debe fallar si se ejecuta.
-- INSERT INTO reserva (cliente_id, estado)
-- VALUES (999999, 'pendiente');

-- PRUEBA CHECK · debe fallar si se ejecuta.
-- INSERT INTO reserva (personas, estado)
-- VALUES (0, 'pendiente');

-- ============================================================
-- SIMULACIÓN DIDÁCTICA · NO EJECUTAR HASTA QUE EL DOCENTE DIGA:
-- “Supongamos que la dueña acaba de confirmar la regla 1”.
--
-- Solo entonces tendría sentido endurecer el estado CONFIRMADA:
-- ============================================================
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

-- ============================================================
-- CONTINUACIÓN DEL MODELO COMPLETO · NO ES PARTE DEL NÚCLEO DE S9
--
-- La evidencia posterior de S7 sobre juntar mesas por pedido se puede
-- retomar en otra actividad mediante pedido_mesa. No se introduce aquí
-- como prerrequisito porque el objetivo de esta sesión es dominar DDL.
-- ============================================================

-- Entorno de clase:
-- Este SQL se ejecuta en PostgreSQL desde el SQL Editor de Supabase.
-- Supabase es la interfaz de acceso; PostgreSQL es el motor y el objetivo.
