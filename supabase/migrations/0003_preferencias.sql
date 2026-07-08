-- Módulo 2: Preferencias
-- 1) Llena el catálogo de categorías (si aún no existen).
-- 2) Categorías es un catálogo de solo lectura: cualquiera autenticado
--    puede verlo, pero nadie puede modificarlo desde la app.
-- 3) Preferencias: cada usuario solo ve/agrega/quita las suyas.

insert into categorias (nombre) values
  ('Aire libre'),
  ('Gastronomía'),
  ('Arte y cultura'),
  ('Vida nocturna'),
  ('Deporte'),
  ('Música en vivo'),
  ('Planes en familia'),
  ('Bienestar y relax'),
  ('Compras'),
  ('Cine y series')
on conflict (nombre) do nothing;

alter table categorias enable row level security;

drop policy if exists "ver_categorias" on categorias;
create policy "ver_categorias"
  on categorias for select
  to authenticated
  using (true);

alter table preferencias enable row level security;

drop policy if exists "ver_propias_preferencias" on preferencias;
create policy "ver_propias_preferencias"
  on preferencias for select
  using (auth.uid() = usuario_id);

drop policy if exists "agregar_propias_preferencias" on preferencias;
create policy "agregar_propias_preferencias"
  on preferencias for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "quitar_propias_preferencias" on preferencias;
create policy "quitar_propias_preferencias"
  on preferencias for delete
  using (auth.uid() = usuario_id);
