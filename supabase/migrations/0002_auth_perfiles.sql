-- Módulo 1: Autenticación + Perfil
-- Este archivo hace dos cosas:
-- 1) Crea un "robot" que genera automáticamente la fila en "perfiles"
--    cada vez que alguien se registra.
-- 2) Define las reglas de seguridad: cada usuario solo puede ver
--    y editar su propio perfil.

-- 1) El robot automático
create or replace function public.crear_perfil_automatico()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.perfiles (usuario_id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario nuevo')
  );
  return new;
end;
$$;

-- Conecta el robot al momento exacto en que se crea un usuario
drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_automatico();

-- 2) Reglas de seguridad (RLS) sobre la tabla perfiles
alter table perfiles enable row level security;

drop policy if exists "ver_propio_perfil" on perfiles;
create policy "ver_propio_perfil"
  on perfiles for select
  using (auth.uid() = usuario_id);

drop policy if exists "editar_propio_perfil" on perfiles;
create policy "editar_propio_perfil"
  on perfiles for update
  using (auth.uid() = usuario_id);
