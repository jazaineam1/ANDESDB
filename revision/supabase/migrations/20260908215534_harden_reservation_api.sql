-- ANDESDB · Reserva compartida · endurecimiento de la API pública
--
-- Alcance: proyecto compartido del formulario, esquema public.
-- No crea tablas ni funciones. Verifica primero que las tres funciones
-- auditadas ya existen y que son SECURITY DEFINER; si no, se detiene sin
-- cambiar permisos. Así no se "arregla" una falta de permisos abriendo tablas.
--
-- Aplicar únicamente después de revisar la definición vigente de las funciones
-- y ejecutar supabase/tests/reservation_api_rls.test.sql en un entorno seguro.

begin;

do $$
declare
  tabla text;
  funcion regprocedure;
begin
  foreach tabla in array array[
    'cliente', 'mesero', 'mesa', 'reserva', 'plato', 'ingrediente',
    'receta', 'pedido', 'pedido_mesa', 'linea_pedido', 'pago'
  ] loop
    if to_regclass(format('public.%I', tabla)) is null then
      raise exception 'Falta public.%; la migración no se aplicó.', tabla;
    end if;
  end loop;

  foreach funcion in array array[
    to_regprocedure('public.mesas_disponibles()'),
    to_regprocedure('public.listar_reservas()'),
    to_regprocedure('public.registrar_reserva(text,text,date,time without time zone,integer,integer)')
  ] loop
    if funcion is null then
      raise exception 'Falta una función RPC esperada; la migración no se aplicó.';
    end if;

    if not (select prosecdef from pg_proc where oid = funcion) then
      raise exception 'La función % no es SECURITY DEFINER. Revise su implementación antes de cambiar privilegios.', funcion;
    end if;
  end loop;
end
$$;

-- Las tablas no son una API del navegador. RLS y los GRANT se mantienen
-- juntos: RLS decide filas y los GRANT eliminan el camino directo.
alter table public.cliente       enable row level security;
alter table public.mesero        enable row level security;
alter table public.mesa          enable row level security;
alter table public.reserva       enable row level security;
alter table public.plato         enable row level security;
alter table public.ingrediente   enable row level security;
alter table public.receta        enable row level security;
alter table public.pedido        enable row level security;
alter table public.pedido_mesa   enable row level security;
alter table public.linea_pedido  enable row level security;
alter table public.pago          enable row level security;

revoke all on table public.cliente, public.mesero, public.mesa,
  public.reserva, public.plato, public.ingrediente, public.receta,
  public.pedido, public.pedido_mesa, public.linea_pedido, public.pago
  from anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;

-- Las funciones son la única puerta de la aplicación. PUBLIC recibe EXECUTE
-- por defecto en PostgreSQL; se revoca de forma explícita antes de otorgar
-- solo lo que necesita el formulario sin autenticación.
revoke execute on function public.mesas_disponibles() from public;
revoke execute on function public.listar_reservas() from public;
revoke execute on function public.registrar_reserva(
  text, text, date, time without time zone, integer, integer
) from public;

grant execute on function public.mesas_disponibles() to anon;
grant execute on function public.listar_reservas() to anon;
grant execute on function public.registrar_reserva(
  text, text, date, time without time zone, integer, integer
) to anon;

-- SECURITY DEFINER necesita una ruta determinista para no resolver objetos
-- manipulados por el llamador. No cambia el cuerpo ni convierte una función
-- invocadora en privilegiada: la precondición anterior exige que ya lo sea.
alter function public.mesas_disponibles()
  set search_path = pg_catalog, public;
alter function public.listar_reservas()
  set search_path = pg_catalog, public;
alter function public.registrar_reserva(
  text, text, date, time without time zone, integer, integer
) set search_path = pg_catalog, public;

commit;
