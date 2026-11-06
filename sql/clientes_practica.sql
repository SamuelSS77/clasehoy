-- Políticas RLS para la tabla EXISTENTE public.cliente_prueba
-- (columnas: id, nombre, correo, rol). Ejecutar COMPLETO en Supabase > SQL Editor.
-- Es seguro re-ejecutarlo: borra las políticas previas con estos nombres.
alter table public.cliente_prueba enable row level security;

drop policy if exists "cliente ve su perfil" on public.cliente_prueba;
drop policy if exists "cliente crea su perfil" on public.cliente_prueba;
drop policy if exists "cliente actualiza su perfil" on public.cliente_prueba;

create policy "cliente ve su perfil"
  on public.cliente_prueba for select to authenticated
  using (auth.uid() = id);

-- Quien se registra solo puede crear SU fila y siempre con rol 'cliente'
-- (así nadie puede registrarse a sí mismo como admin).
create policy "cliente crea su perfil"
  on public.cliente_prueba for insert to authenticated
  with check (auth.uid() = id and rol = 'cliente');

-- Puede editar su fila, pero no cambiarse el rol.
create policy "cliente actualiza su perfil"
  on public.cliente_prueba for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and rol = 'cliente');
