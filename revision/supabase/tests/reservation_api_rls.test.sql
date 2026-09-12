begin;

select plan(20);

select ok((select relrowsecurity from pg_class where oid = 'public.cliente'::regclass), 'cliente tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.mesero'::regclass), 'mesero tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.mesa'::regclass), 'mesa tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.reserva'::regclass), 'reserva tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.plato'::regclass), 'plato tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.ingrediente'::regclass), 'ingrediente tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.receta'::regclass), 'receta tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.pedido'::regclass), 'pedido tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.pedido_mesa'::regclass), 'pedido_mesa tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.linea_pedido'::regclass), 'linea_pedido tiene RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.pago'::regclass), 'pago tiene RLS');

select ok(
  not has_table_privilege('anon', 'public.reserva', 'select,insert,update,delete'),
  'anon no tiene acceso directo a reserva'
);
select ok(
  not has_table_privilege('anon', 'public.cliente', 'select,insert,update,delete'),
  'anon no tiene acceso directo a cliente'
);
select ok(
  not has_table_privilege('authenticated', 'public.reserva', 'select,insert,update,delete'),
  'authenticated no hereda una ruta directa a reserva'
);

select ok(
  has_function_privilege('anon', 'public.mesas_disponibles()', 'execute'),
  'anon puede consultar mesas por la función permitida'
);
select ok(
  has_function_privilege('anon', 'public.listar_reservas()', 'execute'),
  'anon puede listar la vista segura por la función permitida'
);
select ok(
  has_function_privilege(
    'anon',
    'public.registrar_reserva(text,text,date,time without time zone,integer,integer)',
    'execute'
  ),
  'anon puede registrar solo por la función permitida'
);
select ok(
  not exists (
    select 1 from pg_proc p cross join lateral aclexplode(p.proacl) a
    where p.oid = 'public.mesas_disponibles()'::regprocedure
      and a.grantee = 0 and a.privilege_type = 'EXECUTE'
  ),
  'PUBLIC no conserva ejecución sobre mesas_disponibles'
);
select ok(
  not exists (
    select 1 from pg_proc p cross join lateral aclexplode(p.proacl) a
    where p.oid = 'public.listar_reservas()'::regprocedure
      and a.grantee = 0 and a.privilege_type = 'EXECUTE'
  ),
  'PUBLIC no conserva ejecución sobre listar_reservas'
);
select ok(
  not exists (
    select 1 from pg_proc p cross join lateral aclexplode(p.proacl) a
    where p.oid = 'public.registrar_reserva(text,text,date,time without time zone,integer,integer)'::regprocedure
      and a.grantee = 0 and a.privilege_type = 'EXECUTE'
  ),
  'PUBLIC no conserva ejecución sobre registrar_reserva'
);

select * from finish();
rollback;
