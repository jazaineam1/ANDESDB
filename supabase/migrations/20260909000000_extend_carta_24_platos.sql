-- ============================================================
-- ANDESDB · La carta crece a 24 platos · GUION DEL DOCENTE
-- PostgreSQL · Supabase · sesión 11
--
-- QUÉ HACE
--   La carta que se siembra en Firestore/MongoDB Atlas para la
--   sesión 11 (assets/Supabase/carta-abc.json) creció de 8 a 24
--   platos. La tabla relacional plato, sembrada por
--   Scripts/S9-restaurante-abc.sql, seguía teniendo solo 8 filas.
--
--   registrar_pedido() busca el precio en plato.precio_actual por
--   plato_id (ver supabase/migrations/20260908230000_add_registrar_pedido.sql,
--   sección "POR QUÉ EL PRECIO NUNCA VIENE DEL NAVEGADOR"): sin este
--   guion, pagar cualquier plato del 9 al 24 fallaba con "El plato %
--   ya no existe en la carta."
--
-- CUÁNDO SE EJECUTA
--   Una sola vez, DESPUÉS de Scripts/S9-restaurante-abc.sql y de
--   supabase/migrations/20260908230000_add_registrar_pedido.sql.
--   Es idempotente (ON CONFLICT ... DO UPDATE): se puede correr de
--   nuevo sin duplicar filas.
--
-- LOS ESTUDIANTES NO EJECUTAN ESTE ARCHIVO.
--
-- Los plato_id 9-24 y sus precios deben coincidir EXACTAMENTE con
-- assets/Supabase/carta-abc.json — ese archivo es la fuente de
-- verdad de nombres y descripciones para Firestore/Atlas; aquí solo
-- se replica lo mínimo que la venta relacional necesita: id, nombre
-- y el precio que de verdad se cobra.
-- ============================================================

INSERT INTO plato (plato_id, nombre, precio_actual) VALUES
    (9,  'Empanadas de pipián', 8500.00),
    (10, 'Patacones con hogao', 10000.00),
    (11, 'Cazuela de mariscos', 42000.00),
    (12, 'Trucha al ajillo', 39000.00),
    (13, 'Lomo al trapo', 48000.00),
    (14, 'Pollo sudado', 27000.00),
    (15, 'Ensalada campesina', 18000.00),
    (16, 'Sopa de guineo', 16000.00),
    (17, 'Jugo de lulo', 7000.00),
    (18, 'Chocolate santafereño', 8500.00),
    (19, 'Café colombiano', 6000.00),
    (20, 'Avena casera', 7500.00),
    (21, 'Brevas con arequipe', 12000.00),
    (22, 'Oblea bogotana', 9000.00),
    (23, 'Helado de curuba', 10000.00),
    (24, 'Pan de bono recién horneado', 5000.00)
ON CONFLICT (plato_id) DO UPDATE
    SET nombre = EXCLUDED.nombre, precio_actual = EXCLUDED.precio_actual;

-- El guion original de S9 inserta con plato_id explícito (no deja que
-- SERIAL lo asigne); sin esto, el próximo INSERT sin id explícito
-- volvería a intentar plato_id 9 y chocaría con la fila que ya existe.
SELECT setval(pg_get_serial_sequence('plato', 'plato_id'), (SELECT max(plato_id) FROM plato));

-- ============================================================
-- COMPROBACIÓN · LOS 24 PLATOS ESTÁN, Y LA PUERTA LOS ACEPTA
-- ============================================================
SELECT count(*) AS total_platos, min(plato_id) AS minimo, max(plato_id) AS maximo FROM plato;

-- Debe devolver un pedido confirmado por $52.000 (2 × pan de bono a
-- 5.000 + 1 × cazuela de mariscos a 42.000).
SELECT * FROM registrar_pedido(
    'Prueba del docente · carta extendida',
    '3000000000',
    1,
    '[{"plato_id": 24, "cantidad": 2}, {"plato_id": 11, "cantidad": 1}]'::JSONB
);

-- Borra el pedido de prueba de arriba antes de la clase:
-- DELETE FROM pago WHERE pedido_id IN (SELECT pedido_id FROM pedido WHERE cliente_id IN (SELECT cliente_id FROM cliente WHERE nombre = 'Prueba del docente · carta extendida'));
-- DELETE FROM linea_pedido WHERE pedido_id IN (SELECT pedido_id FROM pedido WHERE cliente_id IN (SELECT cliente_id FROM cliente WHERE nombre = 'Prueba del docente · carta extendida'));
-- DELETE FROM pedido_mesa WHERE pedido_id IN (SELECT pedido_id FROM pedido WHERE cliente_id IN (SELECT cliente_id FROM cliente WHERE nombre = 'Prueba del docente · carta extendida'));
-- DELETE FROM pedido WHERE cliente_id IN (SELECT cliente_id FROM cliente WHERE nombre = 'Prueba del docente · carta extendida');
-- DELETE FROM cliente WHERE nombre = 'Prueba del docente · carta extendida';
