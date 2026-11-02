-- ========================================================
-- SCRIPT DE ROLES Y PERMISOS DINÁMICOS
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- ========================================================

-- 1. Tabla de roles personalizados
create table if not exists public.roles (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insertar roles base por defecto
insert into public.roles (name, description) values
  ('superadmin', 'Acceso total al sistema y gestión de usuarios'),
  ('admin', 'Gestión de productos y categorías'),
  ('editor', 'Edición de catálogo y descripciones')
on conflict (name) do nothing;

-- 2. Tabla de permisos del sistema
create table if not exists public.permissions (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  description text not null
);

-- Insertar permisos base por defecto
insert into public.permissions (code, description) values
  ('products:view', 'Ver productos del catálogo'),
  ('products:create', 'Crear nuevos productos'),
  ('products:edit', 'Editar productos existentes y disponibilidad'),
  ('products:delete', 'Eliminar productos del catálogo'),
  ('categories:manage', 'Crear, editar y eliminar categorías'),
  ('promos:manage', 'Gestionar códigos de descuento y promociones'),
  ('users:manage', 'Crear administradores y asignar roles')
on conflict (code) do nothing;

-- 3. Tabla de relación rol-permisos
create table if not exists public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Desactivar RLS temporalmente o configurar políticas para management libre en admin
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;

drop policy if exists "Lectura pública de roles" on roles;
create policy "Lectura pública de roles" on roles for select using (true);

drop policy if exists "Escritura admin roles" on roles;
create policy "Escritura admin roles" on roles for all to authenticated using (true) with check (true);

drop policy if exists "Lectura pública de permisos" on permissions;
create policy "Lectura pública de permisos" on permissions for select using (true);

drop policy if exists "Escritura admin permisos" on permissions;
create policy "Escritura admin permisos" on permissions for all to authenticated using (true) with check (true);

drop policy if exists "Lectura pública de role_permissions" on role_permissions;
create policy "Lectura pública de role_permissions" on role_permissions for select using (true);

drop policy if exists "Escritura admin role_permissions" on role_permissions;
create policy "Escritura admin role_permissions" on role_permissions for all to authenticated using (true) with check (true);
