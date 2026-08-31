-- ============================================================
-- ANDESDB · Sesión 9
-- DDL + Supabase/PostgreSQL
-- Restaurante ABC: del modelo a una base real
-- ============================================================

-- RECOMENDADO EN CLASE:
-- Cambia abc_e01 por el código de tu equipo: abc_e02, abc_e03, etc.
create schema if not exists abc_e01;
set search_path to abc_e01;

-- Limpieza para poder repetir el laboratorio.
drop table if exists linea_pedido cascade;
drop table if exists pedido cascade;
drop table if exists reserva_mesa cascade;
drop table if exists reserva cascade;
drop table if exists mesa cascade;
drop table if exists plato cascade;
drop table if exists cliente cascade;

-- ============================================================
-- 1. Tablas base
-- ============================================================

create table cliente (
    cliente_id bigint generated always as identity,
    nombre text not null,
    telefono text,

    constraint pk_cliente primary key (cliente_id),
    constraint uq_cliente_telefono unique (telefono)
);

create table mesa (
    mesa_id bigint generated always as identity,
    codigo text not null,
    puestos integer not null,

    constraint pk_mesa primary key (mesa_id),
    constraint uq_mesa_codigo unique (codigo),
    constraint ck_mesa_puestos check (puestos > 0)
);

create table plato (
    plato_id bigint generated always as identity,
    nombre text not null,
    precio_actual numeric(10,2) not null,
    activo boolean not null default true,

    constraint pk_plato primary key (plato_id),
    constraint uq_plato_nombre unique (nombre),
    constraint ck_plato_precio check (precio_actual >= 0)
);

-- ============================================================
-- 2. Reserva: FK + NOT NULL + CHECK
-- ============================================================

create table reserva (
    reserva_id bigint generated always as identity,
    cliente_id bigint not null,
    fecha date not null,
    hora time not null,
    personas integer not null,
    estado text not null default 'pendiente',

    constraint pk_reserva primary key (reserva_id),
    constraint fk_reserva_cliente
        foreign key (cliente_id) references cliente(cliente_id),
    constraint ck_reserva_personas check (personas > 0),
    constraint ck_reserva_estado
        check (estado in ('pendiente', 'confirmada', 'cancelada', 'cumplida'))
);

-- ============================================================
-- 3. Tabla puente: una reserva puede usar una o varias mesas
-- ============================================================

create table reserva_mesa (
    reserva_id bigint not null,
    mesa_id bigint not null,

    constraint pk_reserva_mesa primary key (reserva_id, mesa_id),
    constraint fk_reserva_mesa_reserva
        foreign key (reserva_id) references reserva(reserva_id),
    constraint fk_reserva_mesa_mesa
        foreign key (mesa_id) references mesa(mesa_id)
);

-- ============================================================
-- 4. Pedido y línea de pedido
-- ============================================================

create table pedido (
    pedido_id bigint generated always as identity,
    reserva_id bigint,
    creado_en timestamp not null default now(),
    estado text not null default 'abierto',

    constraint pk_pedido primary key (pedido_id),
    constraint fk_pedido_reserva
        foreign key (reserva_id) references reserva(reserva_id),
    constraint ck_pedido_estado
        check (estado in ('abierto', 'cerrado', 'cancelado'))
);

create table linea_pedido (
    pedido_id bigint not null,
    plato_id bigint not null,
    cantidad integer not null,
    precio_unitario numeric(10,2) not null,

    constraint pk_linea_pedido primary key (pedido_id, plato_id),
    constraint fk_linea_pedido_pedido
        foreign key (pedido_id) references pedido(pedido_id),
    constraint fk_linea_pedido_plato
        foreign key (plato_id) references plato(plato_id),
    constraint ck_linea_cantidad check (cantidad > 0),
    constraint ck_linea_precio check (precio_unitario >= 0)
);

-- ============================================================
-- 5. Inserts válidos
-- ============================================================

insert into cliente (nombre, telefono) values
('Ana Pérez', '3001234567'),
('Luis Gómez', '3102223344');

insert into mesa (codigo, puestos) values
('M1', 4),
('M2', 4),
('M3', 8);

insert into plato (nombre, precio_actual) values
('Ajiaco', 28000),
('Bandeja paisa', 32000),
('Limonada', 7000);

insert into reserva (cliente_id, fecha, hora, personas, estado)
values (1, '2026-09-04', '20:00', 4, 'confirmada');

insert into reserva_mesa (reserva_id, mesa_id) values
(1, 1),
(1, 2);

insert into pedido (reserva_id, estado) values
(1, 'abierto');

insert into linea_pedido (pedido_id, plato_id, cantidad, precio_unitario) values
(1, 1, 2, 28000),
(1, 3, 4, 7000);

-- Consulta de reconstrucción: no guardamos pedido.total.
select
    p.pedido_id,
    sum(lp.cantidad * lp.precio_unitario) as total_calculado
from pedido p
join linea_pedido lp on lp.pedido_id = p.pedido_id
group by p.pedido_id;

-- ============================================================
-- 6. Pruebas que DEBEN FALLAR
-- Ejecuta una por una, no todas al mismo tiempo.
-- ============================================================

-- A. NOT NULL: debe fallar porque nombre es obligatorio.
-- insert into cliente (nombre, telefono) values (null, '3999999999');

-- B. UNIQUE: debe fallar porque el teléfono ya existe.
-- insert into cliente (nombre, telefono) values ('Cliente duplicado', '3001234567');

-- C. FK huérfana: debe fallar porque no existe cliente 999999.
-- insert into reserva (cliente_id, fecha, hora, personas)
-- values (999999, '2026-09-04', '20:00', 4);

-- D. CHECK: debe fallar porque personas no puede ser 0.
-- insert into reserva (cliente_id, fecha, hora, personas)
-- values (1, '2026-09-04', '21:00', 0);

-- E. CHECK: debe fallar porque cantidad debe ser positiva.
-- insert into linea_pedido (pedido_id, plato_id, cantidad, precio_unitario)
-- values (1, 2, 0, 32000);

-- ============================================================
-- 7. ALTER TABLE: una regla aparece tarde
-- ============================================================

alter table reserva
add constraint ck_reserva_personas_max
check (personas <= 20);

-- Esta debe fallar después del ALTER.
-- insert into reserva (cliente_id, fecha, hora, personas)
-- values (1, '2026-09-05', '20:00', 25);

-- ============================================================
-- 8. Nota Supabase
-- ============================================================
-- Para una app real en Supabase, revisa permisos y Row Level Security.
-- En esta sesión usamos SQL Editor para aprender DDL, no para exponer API pública.
