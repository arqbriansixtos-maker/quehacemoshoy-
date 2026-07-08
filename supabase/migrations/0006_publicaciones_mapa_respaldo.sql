-- Migración de respaldo (documentación).
-- Estos cambios ya existen en la base de datos en vivo (se aplicaron
-- directo desde el SQL Editor de Supabase). Este archivo los documenta
-- en el repositorio para que el proyecto se pueda recrear desde cero
-- si algún día hace falta. Es seguro volver a ejecutarlo aunque ya
-- exista todo: usa "if not exists" y "or replace" en cada paso.

-- 1) Emoji por categoría (para los pines del mapa)
alter table categorias add column if not exists emoji text;

update categorias set emoji = case nombre
  when 'Aire libre' then '🌳'
  when 'Gastronomía' then '🍽️'
  when 'Arte y cultura' then '🎨'
  when 'Vida nocturna' then '🌙'
  when 'Deporte' then '⚽'
  when 'Música en vivo' then '🎵'
  when 'Planes en familia' then '👨‍👩‍👧‍👦'
  when 'Bienestar y relax' then '🧘'
  when 'Compras' then '🛍️'
  when 'Cine y series' then '🎬'
  else '📍'
end
where emoji is null;

-- 2) Vista pública y segura de perfiles: solo nombre, nunca edad ni ciudad.
-- "security_invoker = false" hace que la vista pueda leer todos los
-- perfiles (ignorando el RLS de "perfiles"), pero como la vista solo
-- expone dos columnas, nunca revela datos sensibles de otros usuarios.
create or replace view perfiles_publicos
with (security_invoker = false) as
select usuario_id, nombre from perfiles;

grant select on perfiles_publicos to authenticated;

-- 3) Publicaciones libres: con categoría, ubicación propia y fecha
alter table publicaciones add column if not exists categoria_id uuid references categorias(id);
alter table publicaciones add column if not exists latitud double precision;
alter table publicaciones add column if not exists longitud double precision;
alter table publicaciones add column if not exists creado_en timestamptz default now();

alter table publicaciones enable row level security;

drop policy if exists "ver_publicaciones" on publicaciones;
create policy "ver_publicaciones"
  on publicaciones for select
  to authenticated
  using (true);

drop policy if exists "crear_publicacion_propia" on publicaciones;
create policy "crear_publicacion_propia"
  on publicaciones for insert
  with check (auth.uid() = usuario_id);
