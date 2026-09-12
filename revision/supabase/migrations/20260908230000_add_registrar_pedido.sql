-- ============================================================
-- ANDESDB · El carrito que se convirtió en venta · GUION DEL DOCENTE
-- PostgreSQL · Supabase · sesión 11
--
-- QUÉ HACE
--   Abre DOS puertas más, tan estrechas como registrar_reserva(),
--   para que carrito-abc.html pueda convertir un carrito (que vive
--   como documento en MongoDB Atlas) en un pedido real: pedido +
--   pedido_mesa + linea_pedido + pago, en una sola transacción, y
--   mostrar los pedidos de toda la clase.
--
-- CUÁNDO SE EJECUTA
--   Una sola vez, en el MISMO proyecto de Scripts/S9-restaurante-abc.sql
--   y Scripts/S9-formulario-docente.sql, DESPUÉS de esos dos.
--
-- LOS ESTUDIANTES NO EJECUTAN ESTE ARCHIVO. Ellos solo usan
-- carrito-abc.html.
--
-- ------------------------------------------------------------
-- ⚠ ESTA MIGRACIÓN SÍ TOCA EL ESQUEMA COMPARTIDO DE S9 — avísale
-- a quien mantenga el curso antes de aplicarla.
--
--   El guion original de S9 (Scripts/S9-restaurante-abc.sql) no le
--   da a `pedido` una columna `cliente_id`: un pedido de mesero no
--   necesita saber el nombre de quién come. Pero un pedido que nace
--   de un carrito en línea SÍ necesita saber quién pagó — el mismo
--   argumento por el que `reserva` sí tiene `cliente_id` desde el
--   principio. El PASO 1 de abajo agrega esa columna, NULLABLE y
--   solo con REFERENCES (no rompe ninguna fila existente ni ninguna
--   consulta de las sesiones 7-10, que nunca la usaron).
--
-- ------------------------------------------------------------
-- POR QUÉ EL PRECIO NUNCA VIENE DEL NAVEGADOR
--
--   El carrito en Atlas guarda plato_id y cantidad, pero NUNCA un
--   precio: el precio que de verdad se cobra sale de
--   plato.precio_actual en el instante de pagar, aquí adentro. Si
--   el precio viniera del navegador, cualquiera podría editar el
--   fetch() y pagar lo que quisiera. Esto es la misma idea de
--   "precio_unitario NO es plato.precio_actual" del guion de S9,
--   aplicada como regla de seguridad y no solo de diseño.
--
-- POR QUÉ UNA FUNCIÓN Y NO cuatro INSERT sueltos desde el navegador
--
--   pedido + pedido_mesa + linea_pedido + pago son CUATRO tablas.
--   Si el navegador escribiera cada una por separado, un corte de
--   red a la mitad dejaría un pedido sin pago, o un pago sin líneas.
--   Aquí es una sola función PL/pgSQL: si algo falla a mitad de
--   camino, PostgreSQL revierte TODO (ver EXCEPTION al final).
-- ============================================================


-- ============================================================
-- PASO 1 · EL PEDIDO NECESITA SABER QUIÉN LO HIZO
--
-- Aditivo y seguro de re-ejecutar: IF NOT EXISTS no falla si ya
-- se aplicó antes.
-- ============================================================
ALTER TABLE pedido ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES cliente(cliente_id);


-- ============================================================
-- PASO 2 · BORRAR LAS VERSIONES ANTERIORES, SI EXISTEN
--
-- Mismo motivo que en S9-formulario-docente.sql: CREATE OR REPLACE
-- no puede cambiar el tipo de retorno. Se borran antes para que
-- este guion se pueda volver a ejecutar siempre.
-- ============================================================
DROP FUNCTION IF EXISTS public.registrar_pedido(TEXT, TEXT, INTEGER, JSONB);
DROP FUNCTION IF EXISTS public.listar_pedidos();


-- ============================================================
-- PASO 3 · LA PUERTA DE ENTRADA · registrar_pedido
--
-- p_lineas llega como JSONB porque eso es lo que carrito-abc.html
-- ya tiene en la mano: el arreglo de líneas del documento que leyó
-- de MongoDB Atlas, tal cual, sin transformarlo antes de enviarlo.
-- Forma esperada: [{"plato_id": 1, "cantidad": 2}, {"plato_id": 4, "cantidad": 1}]
--
-- Recibe el NÚMERO de mesa (el que ve una persona), igual que
-- registrar_reserva.
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_pedido(
    p_nombre   TEXT,
    p_telefono TEXT,
    p_mesa     INTEGER,
    p_lineas   JSONB
)
RETURNS TABLE (
    pedido_id      INTEGER,
    mesa           INTEGER,
    total          NUMERIC,
    cliente_accion TEXT,
    mensaje        TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nombre         TEXT;
    v_telefono       TEXT;
    v_mesa_id        INTEGER;
    v_cliente        INTEGER;
    v_cliente_accion TEXT := 'reutilizado';
    v_pedido         INTEGER;
    v_linea          JSONB;
    v_plato_id       INTEGER;
    v_cantidad       INTEGER;
    v_precio         NUMERIC(10,2);
    v_total          NUMERIC(10,2) := 0;
    v_num_lineas     INTEGER := 0;
BEGIN
    -- --- limpiar lo que llega del navegador -------------------
    v_nombre   := btrim(COALESCE(p_nombre, ''));
    v_telefono := btrim(COALESCE(p_telefono, ''));

    -- --- validar, con mensajes que se entiendan ---------------
    IF length(v_nombre) < 3 THEN
        RAISE EXCEPTION 'Escribe tu nombre completo (al menos 3 letras).';
    END IF;
    IF length(v_nombre) > 100 THEN
        RAISE EXCEPTION 'Ese nombre es demasiado largo: máximo 100 caracteres.';
    END IF;
    IF v_telefono !~ '^[0-9+() -]{7,20}$' THEN
        RAISE EXCEPTION 'El teléfono solo puede llevar números, y entre 7 y 20 caracteres.';
    END IF;
    IF p_lineas IS NULL OR jsonb_typeof(p_lineas) <> 'array' OR jsonb_array_length(p_lineas) = 0 THEN
        RAISE EXCEPTION 'El carrito está vacío. Agrega al menos un plato antes de pagar.';
    END IF;
    IF jsonb_array_length(p_lineas) > 30 THEN
        RAISE EXCEPTION 'Ese carrito tiene demasiadas líneas distintas (máximo 30).';
    END IF;

    -- --- la mesa tiene que existir -----------------------------
    SELECT m.mesa_id INTO v_mesa_id FROM mesa m WHERE m.numero = p_mesa;
    IF v_mesa_id IS NULL THEN
        RAISE EXCEPTION 'No existe la mesa %. Elige una de la lista.', p_mesa;
    END IF;

    -- --- el cliente: si ya está, se reutiliza -------------------
    -- Igual que en registrar_reserva: el cliente vive en su tabla,
    -- no se copia dentro de cada pedido.
    SELECT c.cliente_id INTO v_cliente
      FROM cliente c
     WHERE lower(c.nombre) = lower(v_nombre)
       AND c.telefono = v_telefono
     LIMIT 1;

    IF v_cliente IS NULL THEN
        INSERT INTO cliente (nombre, telefono)
        VALUES (v_nombre, v_telefono)
        RETURNING cliente.cliente_id INTO v_cliente;
        v_cliente_accion := 'creado';
    END IF;

    -- --- el pedido nace, sin total: el total se reconstruye ----
    -- (estado usa el DEFAULT 'abierto' de la tabla de S9;
    --  cliente_id es la columna que agregó el PASO 1)
    INSERT INTO pedido (cliente_id)
    VALUES (v_cliente)
    RETURNING pedido.pedido_id INTO v_pedido;

    -- --- la mesa del pedido, vía la tabla puente ----------------
    INSERT INTO pedido_mesa (pedido_id, mesa_id)
    VALUES (v_pedido, v_mesa_id);

    -- --- una línea por cada plato del carrito --------------------
    -- El precio SIEMPRE sale de plato.precio_actual, nunca de lo
    -- que mandó el navegador: ver la nota de arriba del archivo.
    FOR v_linea IN SELECT * FROM jsonb_array_elements(p_lineas)
    LOOP
        v_num_lineas := v_num_lineas + 1;

        BEGIN
            v_plato_id := (v_linea->>'plato_id')::INTEGER;
            v_cantidad := (v_linea->>'cantidad')::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'La línea % del carrito no tiene un plato_id o una cantidad numérica válida.', v_num_lineas;
        END;

        IF v_cantidad IS NULL OR v_cantidad < 1 OR v_cantidad > 50 THEN
            RAISE EXCEPTION 'La cantidad del plato % tiene que estar entre 1 y 50.', v_plato_id;
        END IF;

        SELECT p.precio_actual INTO v_precio
          FROM plato p
         WHERE p.plato_id = v_plato_id;

        IF v_precio IS NULL THEN
            RAISE EXCEPTION 'El plato % ya no existe en la carta. Quítalo del carrito e inténtalo de nuevo.', v_plato_id;
        END IF;

        INSERT INTO linea_pedido (cantidad, precio_unitario, pedido_id, plato_id)
        VALUES (v_cantidad, v_precio, v_pedido, v_plato_id);

        v_total := v_total + (v_cantidad * v_precio);
    END LOOP;

    -- --- el pago, por el total reconstruido ---------------------
    -- pedido no tiene columna total (ver PASO 0 del guion de S9):
    -- se reconstruye sumando líneas, igual que la Comprobación 2.
    INSERT INTO pago (monto, pedido_id)
    VALUES (v_total, v_pedido);

    UPDATE pedido SET estado = 'cerrado' WHERE pedido.pedido_id = v_pedido;

    RETURN QUERY
    SELECT v_pedido,
           p_mesa,
           v_total,
           v_cliente_accion,
           format('Pedido %s confirmado en la mesa %s por $%s.',
                  v_pedido, p_mesa, to_char(v_total, 'FM999G999G999'));
END;
$$;


-- ============================================================
-- PASO 4 · LA VENTANA · listar_pedidos
--
-- Lo que carrito-abc.html muestra después de pagar: los pedidos
-- de toda la clase, más recientes primero. Mismo patrón de
-- listar_reservas(): SECURITY DEFINER, teléfono no expuesto en
-- absoluto (aquí ni tapado: no hace falta para verificar la venta).
-- ============================================================
CREATE OR REPLACE FUNCTION public.listar_pedidos()
RETURNS TABLE (
    pedido_id INTEGER,
    nombre    TEXT,
    mesa      INTEGER,
    total     NUMERIC,
    creado_en TIMESTAMP
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT pe.pedido_id,
           c.nombre::TEXT,
           m.numero AS mesa,
           COALESCE(t.total, 0)::NUMERIC AS total,
           pe.creado_en
      FROM pedido pe
      LEFT JOIN cliente c ON c.cliente_id = pe.cliente_id
      LEFT JOIN pedido_mesa pm ON pm.pedido_id = pe.pedido_id
      LEFT JOIN mesa m ON m.mesa_id = pm.mesa_id
      LEFT JOIN (
            SELECT lp.pedido_id, SUM(lp.cantidad * lp.precio_unitario) AS total
              FROM linea_pedido lp
             GROUP BY lp.pedido_id
      ) t ON t.pedido_id = pe.pedido_id
     WHERE pe.estado = 'cerrado'
     ORDER BY pe.pedido_id DESC
     LIMIT 200;
$$;


-- ============================================================
-- PASO 5 · LOS PERMISOS
--
-- Mismo patrón exacto que S9-formulario-docente.sql: REVOKE ALL
-- primero (PostgreSQL da EXECUTE a PUBLIC por defecto al crear una
-- función), y GRANT solo lo necesario después.
-- ============================================================
REVOKE ALL ON FUNCTION public.registrar_pedido(TEXT, TEXT, INTEGER, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listar_pedidos() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.registrar_pedido(TEXT, TEXT, INTEGER, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_pedidos() TO anon, authenticated;

ALTER FUNCTION public.registrar_pedido(TEXT, TEXT, INTEGER, JSONB)
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.listar_pedidos()
  SET search_path = pg_catalog, public;


-- ============================================================
-- COMPROBACIÓN 1 · LA COLUMNA NUEVA EXISTE Y ES OPCIONAL
-- ============================================================
SELECT column_name, is_nullable, data_type
  FROM information_schema.columns
 WHERE table_name = 'pedido' AND column_name = 'cliente_id';


-- ============================================================
-- COMPROBACIÓN 2 · LA PUERTA FUNCIONA
--
-- Debe devolver una fila con el pedido_id, el total y el mensaje.
-- Usa el plato_id 1 (Ajiaco, 28.000) y el 4 (Limonada de coco, 9.000)
-- de Scripts/S9-restaurante-abc.sql: el total esperado es 65.000
-- (2 × 28.000 + 1 × 9.000).
-- ============================================================
SELECT * FROM registrar_pedido(
    'Prueba del docente',
    '3000000000',
    1,
    '[{"plato_id": 1, "cantidad": 2}, {"plato_id": 4, "cantidad": 1}]'::JSONB
);


-- ============================================================
-- COMPROBACIÓN 3 · LA VENTANA MUESTRA EL PEDIDO DE PRUEBA
-- ============================================================
SELECT * FROM listar_pedidos() LIMIT 5;


-- ============================================================
-- COMPROBACIÓN 4 · EL PRECIO QUEDÓ CONGELADO, NO REFERENCIADO
--
-- Sube el precio del ajiaco y confirma que la línea de la prueba
-- de arriba SIGUE en 28.000: linea_pedido.precio_unitario es una
-- copia, no una referencia a plato.precio_actual.
-- ============================================================
-- UPDATE plato SET precio_actual = 29500 WHERE plato_id = 1;
-- SELECT plato_id, precio_unitario FROM linea_pedido ORDER BY linea_id DESC LIMIT 5;
-- UPDATE plato SET precio_actual = 28000 WHERE plato_id = 1; -- deshacer la prueba


-- ============================================================
-- SI HAY QUE EMPEZAR DE CERO
--
-- Borra el pedido de prueba y sus dependencias, en el orden correcto.
-- ============================================================
-- DELETE FROM pago WHERE pedido_id IN (SELECT pedido_id FROM pedido WHERE cliente_id IN (SELECT cliente_id FROM cliente WHERE nombre = 'Prueba del docente'));
-- DELETE FROM linea_pedido WHERE pedido_id IN (SELECT pedido_id FROM pedido WHERE cliente_id IN (SELECT cliente_id FROM cliente WHERE nombre = 'Prueba del docente'));
-- DELETE FROM pedido_mesa WHERE pedido_id IN (SELECT pedido_id FROM pedido WHERE cliente_id IN (SELECT cliente_id FROM cliente WHERE nombre = 'Prueba del docente'));
-- DELETE FROM pedido WHERE cliente_id IN (SELECT cliente_id FROM cliente WHERE nombre = 'Prueba del docente');
-- DELETE FROM cliente WHERE nombre = 'Prueba del docente';
-- DROP FUNCTION IF EXISTS public.registrar_pedido(TEXT, TEXT, INTEGER, JSONB);
-- DROP FUNCTION IF EXISTS public.listar_pedidos();
