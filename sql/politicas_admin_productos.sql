-- =============================================================
-- ROUGH STREET // Políticas RLS de public."MITABLA1"
-- Público: solo LEER.  Admin (rol = 'admin' en cliente_prueba): todo.
-- Ejecutar en Supabase > SQL Editor (es seguro re-ejecutarlo).
-- =============================================================
alter table public."MITABLA1" enable row level security;

drop policy if exists "publico lee productos"  on public."MITABLA1";
drop policy if exists "admin inserta productos" on public."MITABLA1";
drop policy if exists "admin edita productos"   on public."MITABLA1";
drop policy if exists "admin borra productos"   on public."MITABLA1";

create policy "publico lee productos"
  on public."MITABLA1" for select to anon, authenticated
  using (true);

create policy "admin inserta productos"
  on public."MITABLA1" for insert to authenticated
  with check (exists (select 1 from public.cliente_prueba c where c.id = auth.uid() and c.rol = 'admin'));

create policy "admin edita productos"
  on public."MITABLA1" for update to authenticated
  using      (exists (select 1 from public.cliente_prueba c where c.id = auth.uid() and c.rol = 'admin'))
  with check (exists (select 1 from public.cliente_prueba c where c.id = auth.uid() and c.rol = 'admin'));

create policy "admin borra productos"
  on public."MITABLA1" for delete to authenticated
  using (exists (select 1 from public.cliente_prueba c where c.id = auth.uid() and c.rol = 'admin'));

-- Para volver admin a tu usuario (cambia el correo):
-- update public.cliente_prueba set rol = 'admin' where correo = 'tu-correo@ejemplo.com';

-- Para revisar qué políticas quedaron:
-- select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'MITABLA1';
