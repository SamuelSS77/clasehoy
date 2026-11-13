-- =============================================================
-- ROUGH STREET // Arreglo completo de public.cliente_prueba
-- Error que corrige:
--   new row violates row-level security policy for table "cliente_prueba"
--
-- Ejecutar COMPLETO en Supabase > SQL Editor (es seguro re-ejecutarlo).
-- Si algo falla, Supabase deshace TODO: copia el error y revísalo.
-- =============================================================


-- -------------------------------------------------------------
-- 1) FUNCIÓN crear_mi_perfil_cliente(nombre)
--    La llama la página (db.rpc) con la sesión iniciada. Corre como
--    "security definer", así que NO depende de las políticas RLS, pero
--    solo puede crear la fila del propio usuario (auth.uid()) y siempre
--    con rol 'cliente'.
-- -------------------------------------------------------------
create or replace function public.crear_mi_perfil_cliente(p_nombre text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := auth.uid();
  v_correo text;
  v_es_admin boolean := false;
begin
  if v_id is null then
    raise exception 'Debes iniciar sesión para crear tu perfil';
  end if;

  -- Una cuenta de administrador no puede volverse cliente
  if to_regclass('public.admin_prueba') is not null then
    execute 'select exists (select 1 from public.admin_prueba where id = $1)'
      into v_es_admin using v_id;
    if v_es_admin then
      raise exception 'Esa cuenta es de administrador';
    end if;
  end if;

  select email into v_correo from auth.users where id = v_id;

  insert into public.cliente_prueba (id, nombre, correo, rol)
  values (v_id, coalesce(nullif(trim(p_nombre), ''), split_part(v_correo, '@', 1)), v_correo, 'cliente')
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.crear_mi_perfil_cliente(text) from public, anon;
grant execute on function public.crear_mi_perfil_cliente(text) to authenticated;


-- -------------------------------------------------------------
-- 2) TRIGGER: al registrarse un cliente (signUp con tipo = 'cliente'),
--    la base de datos crea su perfil sola, aunque no haya sesión.
-- -------------------------------------------------------------
create or replace function public.crear_perfil_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ->> 'tipo' = 'cliente' then
    insert into public.cliente_prueba (id, nombre, correo, rol)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
      new.email,
      'cliente'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario_cliente on auth.users;

create trigger al_crear_usuario_cliente
  after insert on auth.users
  for each row execute function public.crear_perfil_cliente();


-- -------------------------------------------------------------
-- 3) POLÍTICAS de cliente_prueba (para LEER y EDITAR el perfil).
--    Se borran todas las que existan y se crean las correctas.
-- -------------------------------------------------------------
alter table public.cliente_prueba enable row level security;

do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'cliente_prueba'
  loop
    execute format('drop policy %I on public.cliente_prueba', p.policyname);
  end loop;
end $$;

create policy "cliente ve su perfil"
  on public.cliente_prueba for select to authenticated
  using (auth.uid() = id);

create policy "cliente crea su perfil"
  on public.cliente_prueba for insert to authenticated
  with check (auth.uid() = id and rol = 'cliente');

create policy "cliente actualiza su perfil"
  on public.cliente_prueba for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and rol = 'cliente');

grant select, insert, update on public.cliente_prueba to authenticated;


-- -------------------------------------------------------------
-- 4) COMPROBAR: debe mostrar las 3 políticas y la función
-- -------------------------------------------------------------
select 'politica' as tipo, policyname as nombre, cmd as detalle
from pg_policies
where schemaname = 'public' and tablename = 'cliente_prueba'
union all
select 'funcion', proname, 'ok'
from pg_proc
where proname in ('crear_mi_perfil_cliente', 'crear_perfil_cliente');
