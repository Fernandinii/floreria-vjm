import { supabase } from './supabase';

export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase.from('roles').select('*').order('name');
  if (error) return [];
  return data || [];
}

export async function fetchPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase.from('permissions').select('*').order('code');
  if (error) return [];
  return data || [];
}

export async function fetchRolePermissions(roleName: string): Promise<string[]> {
  if (roleName === 'superadmin') {
    return [
      'products:view',
      'products:create',
      'products:edit',
      'products:delete',
      'categories:manage',
      'promos:manage',
      'users:manage',
      'roles:manage'
    ];
  }

  const { data: role } = await supabase.from('roles').select('id').eq('name', roleName).single();
  if (!role) return ['products:view', 'products:create', 'products:edit', 'categories:manage'];

  const { data: rp, error } = await supabase
    .from('role_permissions')
    .select('permissions(code)')
    .eq('role_id', role.id);

  if (error || !rp) return ['products:view', 'products:create', 'products:edit', 'categories:manage'];

  return rp.map((item: any) => item.permissions?.code).filter(Boolean);
}

export function hasPermissionInList(userPermissions: string[], requiredCode: string): boolean {
  if (userPermissions.includes('*') || userPermissions.includes('roles:manage')) return true;
  return userPermissions.includes(requiredCode);
}
