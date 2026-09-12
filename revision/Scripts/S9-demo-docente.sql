-- ============================================================
-- ANDESDB · Sesión 9 · BASE DE DEMOSTRACIÓN PÚBLICA
--
-- ESTO LO EJECUTA EL DOCENTE, UNA SOLA VEZ, EN SU PROYECTO.
-- Los estudiantes NO ejecutan este archivo: solo consultan la
-- base que crea, desde la barra de direcciones del navegador.
--
-- Para qué sirve: que el curso toque una base de Supabase de
-- verdad en el minuto 14, mientras su propio proyecto todavía
-- se está aprovisionando. Sin instalar nada y sin crear cuenta.
--
-- Qué queda expuesto: una tabla de solo lectura con el menú de
-- un restaurante. Nada más. No hay datos de personas, no hay
-- escritura, y la clave que se reparte es la "publishable"
-- (anon), que está diseñada para viajar en el navegador.
-- ============================================================

-- ------------------------------------------------------------
-- 1 · La tabla. Va en `public` a propósito: es el único schema
--     que PostgREST expone sin tocar la configuración del
--     proyecto, y en una clase en vivo eso importa más que la
--     pulcritud del nombre.
-- ------------------------------------------------------------
DROP TABLE IF EXISTS public.demo_menu;

CREATE TABLE public.demo_menu (
    plato       TEXT    PRIMARY KEY,
    categoria   TEXT    NOT NULL,
    precio      INTEGER NOT NULL,
    disponible  BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.demo_menu (plato, categoria, precio, disponible) VALUES
('Ajiaco santafereño', 'Sopa',     28000, TRUE),
('Sancocho de gallina','Sopa',     26000, TRUE),
('Bandeja paisa',      'Fuerte',   34000, TRUE),
('Trucha al ajillo',   'Fuerte',   31000, FALSE),
('Tamal tolimense',    'Fuerte',   22000, TRUE),
('Limonada de coco',   'Bebida',    9000, TRUE),
('Jugo de lulo',       'Bebida',    7000, TRUE),
('Postre de natas',    'Postre',   11000, TRUE);

-- ------------------------------------------------------------
-- 2 · Solo lectura, y solo esta tabla.
--     RLS encendida + una única política de SELECT para el rol
--     anónimo. Sin política de INSERT, UPDATE ni DELETE, así que
--     cualquier intento de escribir desde fuera se rechaza.
-- ------------------------------------------------------------
ALTER TABLE public.demo_menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS demo_menu_lectura_publica ON public.demo_menu;

CREATE POLICY demo_menu_lectura_publica
    ON public.demo_menu
    FOR SELECT
    TO anon
    USING (TRUE);

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.demo_menu TO anon;

-- ------------------------------------------------------------
-- 3 · Comprobación antes de clase.
--     Debe devolver 8 filas aquí, en el SQL Editor.
-- ------------------------------------------------------------
SELECT COUNT(*) AS platos_publicados FROM public.demo_menu;

-- ------------------------------------------------------------
-- 4 · Y la comprobación que de verdad importa: pega esto en el
--     navegador, sin haber iniciado sesión (ventana de
--     incógnito). Si devuelve JSON, la clase funciona.
--
--     https://TU-REF.supabase.co/rest/v1/demo_menu?select=*&apikey=TU_CLAVE_PUBLISHABLE
--
--     TU-REF        · Settings → General → Reference ID
--     TU_CLAVE      · Settings → API Keys → publishable / anon
--
--     Esa línea entera es la que se pega en el chat de la clase.
--     NO se guarda en el repositorio: el repositorio es público.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 5 · Para retirarla cuando termine el curso.
-- ------------------------------------------------------------
-- DROP TABLE IF EXISTS public.demo_menu;
