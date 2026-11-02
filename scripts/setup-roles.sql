-- ========================================================
-- SCRIPT COMPLETO: TABLAS, ROLES, RPC, BUCKET Y CATEGORÍAS
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- ========================================================

-- 1. Crear tabla de productos con soporte para código (SKU)
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric not null default 0,
  image_url text,
  category text not null default 'Ramos',
  is_available boolean not null default true,
  is_customizable boolean default false,
  description text,
  includes_shipping boolean default false,
  preparation_time text default '2 a 4 horas',
  code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Asegurar columna code si la tabla ya existía
alter table public.products add column if not exists code text;

-- 2. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Insertar categorías base por defecto
INSERT INTO categories (name, slug) VALUES
  ('Todos', 'todos'),
  ('Ramos', 'ramos'),
  ('Cajas y Arreglos', 'cajas-y-arreglos'),
  ('Peluches y Globos', 'peluches-y-globos'),
  ('Condolencias', 'condolencias')
ON CONFLICT (slug) DO NOTHING;

-- 4. Habilitar RLS en categories y productos
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

drop policy if exists "Lectura pública de categorías" on categories;
create policy "Lectura pública de categorías" on categories for select using (true);

drop policy if exists "Escritura admin categorías" on categories;
create policy "Escritura admin categorías" on categories
  for all to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_roles.id = auth.uid()
      and user_roles.role in ('admin', 'superadmin')
    )
  )
  with check (
    exists (
      select 1 from user_roles
      where user_roles.id = auth.uid()
      and user_roles.role in ('admin', 'superadmin')
    )
  );

-- 5. Crear tabla de roles de usuario vinculada a auth.users
create table if not exists public.user_roles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text check (role in ('admin', 'superadmin')) default 'admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Habilitar Row Level Security (RLS) en user_roles
alter table user_roles enable row level security;

-- 7. Funciones SECURITY DEFINER para evitar recursión infinita en políticas RLS
create or replace function public.is_superadmin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.user_roles
    where id = auth.uid() and role = 'superadmin'
  );
end;
$$;

create or replace function public.is_admin_or_superadmin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.user_roles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
end;
$$;

-- 8. Políticas RLS para user_roles
drop policy if exists "Leer rol propio" on user_roles;
create policy "Leer rol propio" on user_roles
  for select to authenticated
  using (auth.uid() = id or public.is_superadmin());

drop policy if exists "Superadmin gestión total de roles" on user_roles;
create policy "Superadmin gestión total de roles" on user_roles
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- 9. Habilitar RLS en products y aplicar políticas
alter table products enable row level security;

drop policy if exists "Lectura pública de productos" on products;
create policy "Lectura pública de productos" on products
  for select using (true);

drop policy if exists "Escritura admin productos" on products;
create policy "Escritura admin productos" on products
  for all to authenticated
  using (public.is_admin_or_superadmin())
  with check (public.is_admin_or_superadmin());

-- 10. Función RPC para listar usuarios y sus roles
create or replace function public.get_users_with_roles()
returns table (
  id uuid,
  email text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    u.id,
    u.email::text,
    coalesce(r.role, 'admin')::text,
    u.created_at
  from auth.users u
  left join public.user_roles r on u.id = r.id;
end;
$$;

-- 11. Función RPC para actualizar o asignar rol a un usuario
create or replace function public.set_user_role(target_user_id uuid, new_role text, target_email text)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_roles (id, email, role)
  values (target_user_id, target_email, new_role)
  on conflict (id) 
  do update set role = new_role, email = target_email;
end;
$$;

-- 12. Creación automática del bucket 'catalog-images'
insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Lectura pública de catalog-images" on storage.objects;
create policy "Lectura pública de catalog-images"
on storage.objects for select
to public
using (bucket_id = 'catalog-images');

drop policy if exists "Subida autenticada a catalog-images" on storage.objects;
create policy "Subida autenticada a catalog-images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'catalog-images');

-- 13. Asignar tu usuario como superadmin
insert into public.user_roles (id, email, role)
values ('2b6ade57-37b0-4bd3-8194-782b04b484dc', 'fernan131004@gmail.com', 'superadmin')
on conflict (id) do update set role = 'superadmin';
