-- ============================================================
-- ANDESDB · El formulario de reservas · GUION DEL DOCENTE
-- PostgreSQL · Supabase
--
-- QUÉ HACE
--   Abre una puerta muy estrecha en la base del profesor para que
--   el formulario de la clase pueda escribir una reserva desde
--   cualquier navegador, y NADA MÁS.
--
-- CUÁNDO SE EJECUTA
--   Una sola vez, en el proyecto del profesor, DESPUÉS de haber
--   ejecutado Scripts/S9-restaurante-abc.sql.
--
-- LOS ESTUDIANTES NO EJECUTAN ESTE ARCHIVO. Ellos solo abren el
-- formulario y lo llenan.
--
-- ------------------------------------------------------------
-- LA IDEA DE SEGURIDAD, EN UNA FRASE
--
--   Se cierran las once tablas a cal y canto, y se abren tres
--   funciones. El navegador no puede tocar las tablas: solo puede
--   pedirle a la base que haga esas tres cosas concretas.
--
-- Por qué así y no dando permiso de INSERT sobre reserva:
--
--   · Una reserva necesita además un cliente. Con permiso suelto
--     habría que dar acceso a DOS tablas.
--   · Quien puede insertar en una tabla puede insertar cualquier
--     cosa. Aquí la función valida antes: el nombre no puede estar
--     vacío, las personas tienen que caber en la mesa, la fecha no
--     puede ser de la semana pasada.
--   · Y quien puede leer, lo lee todo. La función de lectura
--     devuelve el teléfono TAPADO, con los últimos tres dígitos.
--
-- La clave publishable que usa el formulario es pública por diseño
-- y va a viajar en el navegador de todo el mundo. Todo lo que se
-- puede hacer con ella es lo que digan estas tres funciones.
-- ============================================================


-- ============================================================
-- PASO 1 · CERRAR LAS ONCE TABLAS
--
-- Activar RLS sin escribir ninguna política significa «nadie pasa».
-- Es el único caso en que no poner una regla ES la regla.
--
-- El profesor sigue trabajando normal desde el SQL Editor: eso
-- entra con otro rol, que no está sujeto a estas restricciones.
-- ============================================================
ALTER TABLE cliente      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesero       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesa         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserva      ENABLE ROW LEVEL SECURITY;
ALTER TABLE plato        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingrediente  ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_mesa  ENABLE ROW LEVEL SECURITY;
ALTER TABLE linea_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE pago         ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 2 · LA PUERTA DE ENTRADA · registrar_reserva
--
-- SECURITY DEFINER quiere decir «esta función se ejecuta con los
-- permisos de quien la escribió», es decir, los del profesor. Por
-- eso puede escribir en unas tablas que están cerradas.
--
-- SET search_path = public es obligatorio en una función así: sin
-- eso, alguien podría fabricar una tabla con el mismo nombre en
-- otro esquema y hacer que la función escriba ahí.
--
-- Recibe el NÚMERO de mesa (el 1, el 2, el 3…), que es lo que ve
-- una persona, y no el mesa_id, que es cosa interna de la base.
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_reserva(
    p_nombre   TEXT,
    p_telefono TEXT,
    p_fecha    DATE,
    p_hora     TIME,
    p_personas INTEGER,
    p_mesa     INTEGER
)
RETURNS TABLE (reserva_id INTEGER, mesa INTEGER, puestos INTEGER, mensaje TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nombre   TEXT;
    v_telefono TEXT;
    v_mesa_id  INTEGER;
    v_puestos  INTEGER;
    v_cliente  INTEGER;
    v_reserva  INTEGER;
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
    IF p_personas IS NULL OR p_personas < 1 THEN
        RAISE EXCEPTION 'La reserva tiene que ser para una persona o más.';
    END IF;
    IF p_fecha IS NULL OR p_fecha < CURRENT_DATE THEN
        RAISE EXCEPTION 'No se puede reservar para una fecha que ya pasó.';
    END IF;
    IF p_fecha > CURRENT_DATE + 90 THEN
        RAISE EXCEPTION 'Solo aceptamos reservas con 90 días de antelación.';
    END IF;
    IF p_hora IS NULL OR p_hora < TIME '11:00' OR p_hora > TIME '22:00' THEN
        RAISE EXCEPTION 'El restaurante atiende de 11:00 a 22:00.';
    END IF;

    -- --- la mesa tiene que existir y tiene que caber ----------
    SELECT m.mesa_id, m.puestos
      INTO v_mesa_id, v_puestos
      FROM mesa m
     WHERE m.numero = p_mesa;

    IF v_mesa_id IS NULL THEN
        RAISE EXCEPTION 'No existe la mesa %. Elige una de la lista.', p_mesa;
    END IF;
    IF p_personas > v_puestos THEN
        RAISE EXCEPTION 'La mesa % tiene % puestos y pides para %. Elige una más grande.',
              p_mesa, v_puestos, p_personas;
    END IF;

    -- --- el cliente: si ya está, se reutiliza -----------------
    -- Esto es lo que enseña la 2FN: el cliente vive en su tabla y
    -- no se copia dentro de cada reserva.
    SELECT c.cliente_id INTO v_cliente
      FROM cliente c
     WHERE lower(c.nombre) = lower(v_nombre)
       AND c.telefono = v_telefono
     LIMIT 1;

    IF v_cliente IS NULL THEN
        INSERT INTO cliente (nombre, telefono)
        VALUES (v_nombre, v_telefono)
        RETURNING cliente.cliente_id INTO v_cliente;
    END IF;

    -- --- y por fin la reserva ---------------------------------
    INSERT INTO reserva (fecha, hora, personas, cliente_id, mesa_id)
    VALUES (p_fecha, p_hora, p_personas, v_cliente, v_mesa_id)
    RETURNING reserva.reserva_id INTO v_reserva;

    RETURN QUERY
    SELECT v_reserva,
           p_mesa,
           v_puestos,
           format('Reserva %s confirmada para %s personas en la mesa %s.',
                  v_reserva, p_personas, p_mesa);
END;
$$;


-- ============================================================
-- PASO 3 · LA VENTANA · listar_reservas
--
-- Lo que el formulario muestra en pantalla después de enviar.
--
-- El teléfono sale TAPADO: solo los tres últimos dígitos. Nadie
-- necesita el número entero de sus compañeros para ver que la
-- reserva llegó.
-- ============================================================
CREATE OR REPLACE FUNCTION public.listar_reservas()
RETURNS TABLE (
    reserva_id INTEGER,
    nombre     TEXT,
    telefono   TEXT,
    fecha      DATE,
    hora       TIME,
    personas   INTEGER,
    mesa       INTEGER,
    puestos    INTEGER,
    mesero     TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT r.reserva_id,
           c.nombre::TEXT,
           ('•••' || right(c.telefono, 3))::TEXT AS telefono,
           r.fecha,
           r.hora,
           r.personas,
           m.numero  AS mesa,
           m.puestos,
           COALESCE(me.nombre, 'sin asignar')::TEXT AS mesero
      FROM reserva r
      JOIN cliente c ON c.cliente_id = r.cliente_id
      JOIN mesa    m ON m.mesa_id    = r.mesa_id
      LEFT JOIN mesero me ON me.mesero_id = m.mesero_id
     ORDER BY r.reserva_id DESC
     LIMIT 200;
$$;


-- ============================================================
-- PASO 4 · LAS MESAS QUE SE PUEDEN ELEGIR
--
-- Para que el desplegable del formulario no se invente mesas.
-- ============================================================
CREATE OR REPLACE FUNCTION public.mesas_disponibles()
RETURNS TABLE (mesa INTEGER, puestos INTEGER, mesero TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT m.numero,
           m.puestos,
           COALESCE(me.nombre, 'sin asignar')::TEXT
      FROM mesa m
      LEFT JOIN mesero me ON me.mesero_id = m.mesero_id
     ORDER BY m.numero;
$$;


-- ============================================================
-- PASO 5 · LOS PERMISOS
--
-- anon es el rol con el que entra cualquiera que abra el
-- formulario. Se le quita todo y se le devuelven exactamente tres
-- permisos de ejecución.
--
-- RLS ya bloquea las filas sin políticas, pero revocar también los
-- privilegios de tabla deja la superficie pública explícitamente
-- cerrada: el navegador no puede usar /rest/v1/<tabla>.
-- ============================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- ============================================================
-- SOLO LAS TRES PUERTAS DEL FORMULARIO
--
-- REVOKE ... FROM PUBLIC es importante: al crear una función,
-- PostgreSQL se la deja ejecutar a todo el mundo por defecto.
-- ============================================================
REVOKE ALL ON FUNCTION public.registrar_reserva(TEXT, TEXT, DATE, TIME, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listar_reservas()    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mesas_disponibles()  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.registrar_reserva(TEXT, TEXT, DATE, TIME, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_reservas()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mesas_disponibles()  TO anon, authenticated;


-- ============================================================
-- COMPROBACIÓN 1 · LAS ONCE TABLAS ESTÁN CERRADAS
--
-- Las once deben decir «true» en rls. Si alguna dice «false», esa
-- tabla está abierta a cualquiera que tenga la clave publishable.
-- ============================================================
SELECT c.relname AS tabla,
       c.relrowsecurity AS rls,
       COUNT(p.polname) AS politicas
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;


-- ============================================================
-- COMPROBACIÓN 2 · LA PUERTA FUNCIONA
--
-- Debe devolver una fila con el número de reserva y el mensaje.
-- ============================================================
SELECT * FROM registrar_reserva(
    'Prueba del docente',
    '3000000000',
    CURRENT_DATE + 1,
    TIME '19:00',
    2,
    2
);


-- ============================================================
-- COMPROBACIÓN 3 · LA VENTANA FUNCIONA
--
-- Arriba del todo debe salir la reserva de prueba, con el teléfono
-- tapado.
-- ============================================================
SELECT * FROM listar_reservas() LIMIT 5;


-- ============================================================
-- SI HAY QUE EMPEZAR DE CERO
--
-- Estas líneas borran la prueba y las tres funciones. Quítales los
-- dos guiones para usarlas.
-- ============================================================
-- DELETE FROM reserva WHERE cliente_id IN (SELECT cliente_id FROM cliente WHERE nombre = 'Prueba del docente');
-- DELETE FROM cliente WHERE nombre = 'Prueba del docente';
-- DROP FUNCTION IF EXISTS public.registrar_reserva(TEXT, TEXT, DATE, TIME, INTEGER, INTEGER);
-- DROP FUNCTION IF EXISTS public.listar_reservas();
-- DROP FUNCTION IF EXISTS public.mesas_disponibles();
