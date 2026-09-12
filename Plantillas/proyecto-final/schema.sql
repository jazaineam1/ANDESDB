-- Proyecto final ANDESDB · plantilla de DDL
-- No es una solución. Completa las decisiones y justifica cada constraint.

CREATE SCHEMA IF NOT EXISTS proyecto_final;
SET search_path TO proyecto_final;

-- Antes de escribir CREATE TABLE, completa en decisiones.md:
-- 1) una fila de casos = ...
-- 2) una fila de eventos = ...
-- 3) un documento de evidencias = ...

-- ================================================================
-- TODO 1 · CASOS
-- Decide tipos, obligatoriedad y dominios.
-- Debes poder justificar al menos:
--   PRIMARY KEY
--   NOT NULL donde corresponda
--   CHECK para dominios que realmente sean reglas
-- ================================================================

-- CREATE TABLE casos (
--   ...
-- );

-- ================================================================
-- TODO 2 · EVENTOS
-- Recuerda: una fila = un evento asociado a un caso.
-- Los datos técnicos son opcionales según el canal.
-- No declares NOT NULL sobre os/navegador/ip sin explicar qué ocurriría
-- con los eventos de canal Telefono.
-- ================================================================

-- CREATE TABLE eventos (
--   ...
--   FOREIGN KEY (...) REFERENCES casos(...)
-- );

-- ================================================================
-- TODO 3 · EVIDENCIAS
-- El archivo fuente es JSON. Decide y documenta una opción:
-- A) normalizar metadatos en relacional;
-- B) conservar documento;
-- C) arquitectura híbrida: metadatos + object storage;
-- D) otra alternativa defendible.
-- Si eliges relacional, escribe aquí el DDL necesario.
-- ================================================================

-- CREATE TABLE evidencias (
--   ...
-- );

-- ================================================================
-- TODO 4 · ÍNDICES / DECISIONES FÍSICAS (solo si las justificas)
-- No añadas índices por costumbre. Relaciónalos con una consulta real.
-- ================================================================

-- CREATE INDEX ...;
