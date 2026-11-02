-- ========================================================
-- SCRIPT DEFINITIVO DE CONFIGURACIÓN PARA SUPABASE (CON TAGS)
-- Copia y ejecuta TODO este script en el SQL Editor de Supabase
-- ========================================================

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
  tags text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products add column if not exists code text;
alter table public.products add column if not exists tags text;

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

INSERT INTO categories (name, slug) VALUES
  ('Todos', 'todos'),
  ('Ramos', 'ramos'),
  ('Cajas y Arreglos', 'cajas-y-arreglos'),
  ('Peluches y Globos', 'peluches-y-globos'),
  ('Condolencias', 'condolencias')
ON CONFLICT (slug) DO NOTHING;

create table if not exists public.roles (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.roles (name, description) values
  ('superadmin', 'Acceso total al sistema y gestión de usuarios'),
  ('admin', 'Gestión de productos y categorías'),
  ('editor', 'Edición de catálogo y descripciones')
on conflict (name) do nothing;

create table if not exists public.permissions (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  description text not null
);

insert into public.permissions (code, description) values
  ('products:view', 'Ver productos del catálogo'),
  ('products:create', 'Crear nuevos productos'),
  ('products:edit', 'Editar productos existentes y disponibilidad'),
  ('products:delete', 'Eliminar productos del catálogo'),
  ('categories:manage', 'Crear, editar y eliminar categorías'),
  ('promos:manage', 'Gestionar códigos de descuento y promociones'),
  ('users:manage', 'Crear administradores y asignar roles'),
  ('roles:manage', 'Crear roles y asignar permisos')
on conflict (code) do nothing;

create table if not exists public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text check (role in ('admin', 'superadmin', 'editor')) default 'admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table products enable row level security;
alter table categories enable row level security;
alter table user_roles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;

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
    where id = auth.uid() and role in ('admin', 'superadmin', 'editor')
  );
end;
$$;

drop policy if exists "Lectura pública de productos" on products;
create policy "Lectura pública de productos" on products for select using (true);

drop policy if exists "Escritura admin productos" on products;
create policy "Escritura admin productos" on products for all to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());

drop policy if exists "Lectura pública de categorías" on categories;
create policy "Lectura pública de categorías" on categories for select using (true);

drop policy if exists "Escritura admin categorías" on categories;
create policy "Escritura admin categorías" on categories for all to authenticated using (public.is_admin_or_superadmin()) with check (public.is_admin_or_superadmin());

drop policy if exists "Leer rol propio" on user_roles;
create policy "Leer rol propio" on user_roles for select to authenticated using (auth.uid() = id or public.is_superadmin());

drop policy if exists "Superadmin gestión total de roles" on user_roles;
create policy "Superadmin gestión total de roles" on user_roles for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

drop policy if exists "Lectura roles" on roles;
create policy "Lectura roles" on roles for select using (true);
drop policy if exists "Escritura roles" on roles;
create policy "Escritura roles" on roles for all to authenticated using (true) with check (true);

drop policy if exists "Lectura permisos" on permissions;
create policy "Lectura permisos" on permissions for select using (true);

drop policy if exists "Lectura role_permissions" on role_permissions;
create policy "Lectura role_permissions" on role_permissions for select using (true);
drop policy if exists "Escritura role_permissions" on role_permissions;
create policy "Escritura role_permissions" on role_permissions for all to authenticated using (true) with check (true);

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

insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Lectura pública de catalog-images" on storage.objects;
create policy "Lectura pública de catalog-images" on storage.objects for select to public using (bucket_id = 'catalog-images');

drop policy if exists "Subida autenticada a catalog-images" on storage.objects;
create policy "Subida autenticada a catalog-images" on storage.objects for insert to authenticated with check (bucket_id = 'catalog-images');

insert into public.user_roles (id, email, role)
values ('2b6ade57-37b0-4bd3-8194-782b04b484dc', 'fernan131004@gmail.com', 'superadmin')
on conflict (id) do update set role = 'superadmin';
