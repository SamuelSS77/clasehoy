-- Ejecutar en Supabase > SQL Editor

create table if not exists public.estudiantes (
  id         bigint generated always as identity primary key,
  nombre     text    not null,
  correo     text    not null,
  curso      text    not null,
  edad       int     not null,
  created_at timestamptz default now()
);

-- Habilitar Row Level Security
alter table public.estudiantes enable row level security;

-- Políticas abiertas para pruebas (rol anon).
-- ⚠️ En producción, restringe estas políticas a usuarios autenticados.
create policy "Lectura publica"   on public.estudiantes for select using (true);
create policy "Insercion publica" on public.estudiantes for insert with check (true);
create policy "Edicion publica"   on public.estudiantes for update using (true);
create policy "Borrado publico"   on public.estudiantes for delete using (true);
