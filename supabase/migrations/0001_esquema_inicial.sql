-- Migración inicial: crea todas las tablas del Módulo 0.
-- "usuarios" NO se crea aquí: la maneja automáticamente Supabase Auth
-- en su propio esquema interno (auth.users).

create extension if not exists postgis;

create table perfiles (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  edad int,
  ciudad text,
  creado_en timestamptz default now()
);

create table categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

create table preferencias (
  usuario_id uuid references auth.users(id) on delete cascade,
  categoria_id uuid references categorias(id) on delete cascade,
  primary key (usuario_id, categoria_id)
);

create table lugares (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  latitud double precision not null,
  longitud double precision not null,
  categoria_id uuid references categorias(id),
  descripcion text,
  creado_en timestamptz default now()
);

create table eventos (
  id uuid primary key default gen_random_uuid(),
  lugar_id uuid references lugares(id) on delete cascade,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null
);

create table publicaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users(id) on delete cascade,
  lugar_id uuid references lugares(id),
  texto text not null,
  creado_en timestamptz default now()
);

create table favoritos (
  usuario_id uuid references auth.users(id) on delete cascade,
  lugar_id uuid references lugares(id) on delete cascade,
  primary key (usuario_id, lugar_id)
);

create table chats (
  id uuid primary key default gen_random_uuid()
);

create table mensajes (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete cascade,
  contenido text not null,
  creado_en timestamptz default now()
);
