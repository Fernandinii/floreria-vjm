'use client';

import { useEffect, useState } from 'react';
import { supabase, Product } from '@/lib/supabase';
import { fetchRoles, fetchPermissions, fetchRolePermissions, Role, Permission } from '@/lib/permissions';
import { useRouter } from 'next/navigation';
import {
  Flower2,
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  Tag,
  Percent,
  ExternalLink,
  X,
  Users as UsersIcon,
  Shield,
  ShieldCheck,
  UserPlus,
  FolderTree,
  Lock,
  KeyRound
} from 'lucide-react';
import Link from 'next/link';

interface SystemUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Auth & Roles State
  const [userRole, setUserRole] = useState<'admin' | 'superadmin'>('admin');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Roles & Permissions Management State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<string>('');
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>({});
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [roleFormError, setRoleFormError] = useState<string | null>(null);

  // Users Management State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<string>('admin');
  const [adminFormError, setAdminFormError] = useState<string | null>(null);
  const [adminFormSuccess, setAdminFormSuccess] = useState<string | null>(null);

  // Categories Management State
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [catFormError, setCatFormError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  // Modal State for Create / Edit Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Extended Product Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string>('Ramos');
  const [description, setDescription] = useState('');
  const [preparationTime, setPreparationTime] = useState('2 a 4 horas');
  const [includesShipping, setIncludesShipping] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [productCode, setProductCode] = useState('');
  const [productTags, setProductTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'roles' | 'users' | 'promos' | 'permissions'>('products');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('');
  const [editingPromoIndex, setEditingPromoIndex] = useState<number | null>(null);
  const [promos, setPromos] = useState<{ code: string; discount: string }[]>([
    { code: 'VJM10', discount: '10%' },
    { code: 'AMOR20', discount: '20%' },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vjm_promos');
      if (saved) {
        setPromos(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const savePromosToStorage = (newPromos: { code: string; discount: string }[]) => {
    setPromos(newPromos);
    try {
      localStorage.setItem('vjm_promos', JSON.stringify(newPromos));
    } catch (e) {}
  };

  const router = useRouter();

  useEffect(() => {
    async function initUserAndData() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserEmail(user.email || '');
          setUserRole('superadmin');
          setUserPermissions(['*']);

          try {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('id', user.id)
              .single();

            if (roleData && roleData.role) {
              const r = roleData.role as 'admin' | 'superadmin';
              setUserRole(r);
              const perms = await fetchRolePermissions(r);
              setUserPermissions(perms);
            }
          } catch (e) {}
        } else {
          window.location.href = '/admin/login';
          return;
        }

        try {
          const fetchedRoles = await fetchRoles();
          const fetchedPerms = await fetchPermissions();
          setRoles(fetchedRoles);
          setPermissions(fetchedPerms);
          if (fetchedRoles.length > 0) {
            setSelectedRoleForPerms(fetchedRoles[0].id);
          }

          const map: Record<string, string[]> = {};
          for (const rl of fetchedRoles) {
            const pCodes = await fetchRolePermissions(rl.name);
            map[rl.id] = pCodes;
          }
          setRolePermissionsMap(map);
        } catch (e) {}

        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch (err) {
        console.error('Error initializing dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    initUserAndData();
  }, []);

  const hasPerm = (code: string) => {
    if (userRole === 'superadmin' || userPermissions.includes('*') || userPermissions.includes('roles:manage')) return true;
    return userPermissions.includes(code);
  };

  async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (!error && data) {
      setProducts(data);
    }
  }

  async function fetchCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error && data) {
      setCategoriesList(data as Category[]);
    }
  }

  async function fetchSystemUsers() {
    if (!hasPerm('users:manage')) return;
    setLoadingUsers(true);
    const { data, error } = await supabase.rpc('get_users_with_roles');
    if (!error && data) {
      setSystemUsers(data as SystemUser[]);
    } else {
      console.error('Error fetching users:', error);
    }
    setLoadingUsers(false);
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPerm('roles:manage')) {
      alert('⚠️ No tienes permisos para crear roles.');
      return;
    }
    setRoleFormError(null);

    const { error } = await supabase.from('roles').insert([
      { name: newRoleName.toLowerCase(), description: newRoleDesc }
    ]);

    if (error) {
      setRoleFormError('Error al crear rol: ' + error.message);
    } else {
      setNewRoleName('');
      setNewRoleDesc('');
      const updatedRoles = await fetchRoles();
      setRoles(updatedRoles);
    }
  };

  const togglePermissionForRole = async (roleId: string, roleName: string, permissionId: string, permCode: string) => {
    if (!hasPerm('roles:manage')) {
      alert('⚠️ No tienes permisos para modificar permisos.');
      return;
    }

    const currentPerms = rolePermissionsMap[roleId] || [];
    const hasIt = currentPerms.includes(permCode);

    if (hasIt) {
      const { data: roleObj } = await supabase.from('roles').select('id').eq('name', roleName).single();
      if (roleObj) {
        await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleObj.id)
          .eq('permission_id', permissionId);
      }
      setRolePermissionsMap({
        ...rolePermissionsMap,
        [roleId]: currentPerms.filter((p) => p !== permCode)
      });
    } else {
      const { data: roleObj } = await supabase.from('roles').select('id').eq('name', roleName).single();
      if (roleObj) {
        await supabase
          .from('role_permissions')
          .insert([{ role_id: roleObj.id, permission_id: permissionId }]);
      }
      setRolePermissionsMap({
        ...rolePermissionsMap,
        [roleId]: [...currentPerms, permCode]
      });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPerm('categories:manage')) {
      alert('⚠️ No tienes permisos para gestionar categorías.');
      return;
    }
    setCatFormError(null);

    const slug = newCatSlug || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { error } = await supabase.from('categories').insert([
      { name: newCatName, slug }
    ]);

    if (error) {
      setCatFormError('Error al crear categoría: ' + error.message);
    } else {
      setNewCatName('');
      setNewCatSlug('');
      fetchCategories();
    }
  };

  const openEditCategoryModal = (cat: Category) => {
    if (!hasPerm('categories:manage')) {
      alert('⚠️ No tienes permisos para editar categorías.');
      return;
    }
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatSlug(cat.slug);
    setIsCatModalOpen(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const { error } = await supabase
      .from('categories')
      .update({ name: editCatName, slug: editCatSlug })
      .eq('id', editingCategory.id);

    if (error) {
      alert('Error al actualizar categoría: ' + error.message);
    } else {
      setIsCatModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!hasPerm('categories:manage')) {
      alert('⚠️ No tienes permisos para eliminar categorías.');
      return;
    }
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      fetchCategories();
    } else {
      alert('Error al eliminar categoría: ' + error.message);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPerm('users:manage')) {
      alert('⚠️ No tienes permisos para crear usuarios.');
      return;
    }
    setAdminFormError(null);
    setAdminFormSuccess(null);

    const { data, error } = await supabase.auth.signUp({
      email: newAdminEmail,
      password: newAdminPassword,
    });

    if (error) {
      setAdminFormError(error.message);
      return;
    }

    if (data.user) {
      const { error: roleError } = await supabase.rpc('set_user_role', {
        target_user_id: data.user.id,
        new_role: newAdminRole,
        target_email: newAdminEmail,
      });

      if (roleError) {
        setAdminFormError('Usuario creado pero error al asignar rol: ' + roleError.message);
      } else {
        setAdminFormSuccess(`¡Usuario ${newAdminEmail} creado con éxito!`);
        setNewAdminEmail('');
        setNewAdminPassword('');
        fetchSystemUsers();
      }
    }
  };

  const handleRoleChange = async (targetUserId: string, targetEmail: string, newRole: string) => {
    if (!hasPerm('users:manage')) {
      alert('⚠️ No tienes permisos para cambiar roles.');
      return;
    }

    const { error } = await supabase.rpc('set_user_role', {
      target_user_id: targetUserId,
      new_role: newRole,
      target_email: targetEmail,
    });

    if (error) {
      alert('Error al actualizar rol: ' + error.message);
    } else {
      fetchSystemUsers();
    }
  };

  const openCreateModal = () => {
    if (!hasPerm('products:create')) {
      alert('⚠️ No tienes permisos para crear productos.');
      return;
    }
    setEditingProduct(null);
    setName('');
    setPrice('');
    setCategory(categoriesList[0]?.name || 'Ramos');
    setDescription('');
    setPreparationTime('2 a 4 horas');
    setIncludesShipping(false);
    setIsAvailable(true);
    setProductCode('');
    setProductTags('');
    setImageUrl('');
    setImageFile(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    if (!hasPerm('products:edit')) {
      alert('⚠️ No tienes permisos para editar productos.');
      return;
    }
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category || 'Ramos');
    setDescription(product.description || '');
    setPreparationTime(product.preparation_time || '2 a 4 horas');
    setIncludesShipping(product.includes_shipping || false);
    setIsAvailable(product.is_available);
    setProductCode(product.code || '');
    setProductTags(product.tags || '');
    setImageUrl(product.image_url || '');
    setImageFile(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('catalog-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        setFormError('Error al subir imagen al bucket catalog-images.');
        setUploadingImage(false);
        return null;
      }

      const { data } = supabase.storage.from('catalog-images').getPublicUrl(filePath);
      setUploadingImage(false);
      return data.publicUrl;
    } catch (err) {
      console.error(err);
      setUploadingImage(false);
      return null;
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let finalImageUrl = imageUrl;

    if (imageFile) {
      const uploadedUrl = await handleImageUpload(imageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else if (!imageUrl) {
        return;
      }
    }

    const productData = {
      name,
      price: parseFloat(price) || 0,
      category,
      description: description || null,
      preparation_time: preparationTime || '2 a 4 horas',
      includes_shipping: includesShipping,
      is_available: isAvailable,
      code: productCode || null,
      tags: productTags || null,
      image_url: finalImageUrl || null,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        setFormError('Error al actualizar el producto: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('products').insert([productData]);

      if (error) {
        setFormError('Error al crear el producto: ' + error.message);
        return;
      }
    }

    setIsModalOpen(false);
    fetchProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!hasPerm('products:delete')) {
      alert('⚠️ No tienes permisos para eliminar productos.');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      fetchProducts();
    } else {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const toggleAvailability = async (product: Product) => {
    if (!hasPerm('products:edit')) {
      alert('⚠️ No tienes permisos para cambiar la disponibilidad.');
      return;
    }
    const newStatus = !product.is_available;
    const { error } = await supabase
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', product.id);

    if (!error) {
      setProducts(
        products.map((p) => (p.id === product.id ? { ...p, is_available: newStatus } : p))
      );
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      (p.code && p.code.toLowerCase().includes(term));
    const matchesCategory =
      selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600 rounded-xl shadow flex items-center justify-center overflow-hidden p-0.5">
              <img src="/favicon.png" alt="Florería VJM" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-gray-900">Dashboard Administrativo</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    userRole === 'superadmin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-pink-100 text-pink-700'
                  }`}
                >
                  {userRole === 'superadmin' ? '👑 Superadmin' : '🛡️ Administrador'}
                </span>
                <span className="text-xs text-gray-400">{currentUserEmail}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-xl font-medium text-sm flex items-center gap-2 transition"
            >
              <ExternalLink className="w-4 h-4" /> Ver Catálogo Público
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-xl font-medium text-sm flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 font-bold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Tag className="w-4 h-4" /> Productos ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 font-bold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FolderTree className="w-4 h-4" /> Categorías ({categoriesList.length})
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-3 font-bold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'roles'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Roles y Permisos ({roles.length})
          </button>

          <button
            onClick={() => {
              if (!hasPerm('users:manage')) {
                alert('⚠️ No tienes permisos para gestionar usuarios.');
                return;
              }
              setActiveTab('users');
              fetchSystemUsers();
            }}
            className={`pb-3 font-bold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <UsersIcon className="w-4 h-4" /> Usuarios
            {!hasPerm('users:manage') && <Lock className="w-3 h-3 text-gray-400" />}
          </button>

          <button
            onClick={() => {
              if (!hasPerm('promos:manage')) {
                alert('⚠️ No tienes permisos para gestionar promociones.');
                return;
              }
              setActiveTab('promos');
            }}
            className={`pb-3 font-bold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'promos'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Percent className="w-4 h-4" /> Promociones
            {!hasPerm('promos:manage') && <Lock className="w-3 h-3 text-gray-400" />}
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-3 font-bold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Shield className="w-4 h-4" /> Mis Permisos
          </button>
        </div>

        {activeTab === 'products' && (
          <div>
            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Buscar producto por nombre o código..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                 />
              </div>

              {/* Category Filter & Add Button */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="ALL">Todas las Categorías</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {hasPerm('products:create') && (
                  <button
                    onClick={openCreateModal}
                    className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl shadow-md shadow-pink-600/20 flex items-center gap-2 text-sm transition active:scale-95"
                  >
                    <Plus className="w-5 h-5" /> Nuevo Producto
                  </button>
                )}
              </div>
            </div>

            {/* Products Table */}
            {loading ? (
              <div className="text-center py-20 text-pink-600 font-semibold">
                Cargando productos de Supabase...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
                <p className="text-gray-400 font-medium">No se encontraron productos.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500 tracking-wider">
                        <th className="py-4 px-6">Producto</th>
                        <th className="py-4 px-6">Código / SKU</th>
                        <th className="py-4 px-6">Categoría y Etiquetas</th>
                        <th className="py-4 px-6">Precio</th>
                        <th className="py-4 px-6 text-center">Estado</th>
                        <th className="py-4 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {product.image_url && !product.image_url.includes('EMPTY') ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl">🌸</span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-400 truncate max-w-xs">
                                  {product.description || 'Sin descripción'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-pink-600">
                            {product.code ? `[${product.code}]` : 'Sin código'}
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <span className="inline-flex px-3 py-0.5 bg-pink-50 text-pink-700 rounded-full text-xs font-semibold">
                                {product.category || 'General'}
                              </span>
                              {product.tags && (
                                <p className="text-[11px] text-gray-500">
                                  🏷️ {product.tags}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-bold text-gray-900">
                            ${product.price.toLocaleString('es-MX')} MXN
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => toggleAvailability(product)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                                product.is_available
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              }`}
                              title="Haz clic para cambiar disponibilidad"
                            >
                              {product.is_available ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Disponible
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" /> Agotado
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              {hasPerm('products:edit') && (
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="p-2 bg-gray-100 hover:bg-pink-100 hover:text-pink-600 rounded-xl text-gray-600 transition"
                                  title="Editar producto"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {hasPerm('products:delete') && (
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-2 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 rounded-xl transition"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Create Category Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Nueva Categoría</h2>
                  <p className="text-xs text-gray-500">Agrega una categoría principal.</p>
                </div>
              </div>

              {catFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold">
                  {catFormError}
                </div>
              )}

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Nombre de Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      setNewCatSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')
                      );
                    }}
                    placeholder="Ej. Ramos"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Slug URL
                  </label>
                  <input
                    type="text"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    placeholder="ramos"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Guardar Categoría
                </button>
              </form>
            </div>

            {/* Categories List Table */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Categorías Principales</h2>
                  <p className="text-sm text-gray-500">Listado de categorías principales del menú.</p>
                </div>
                <button
                  onClick={fetchCategories}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                >
                  Actualizar
                </button>
              </div>

              {categoriesList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No hay categorías registradas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                        <th className="py-3 px-4">Nombre</th>
                        <th className="py-3 px-4">Slug</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {categoriesList.map((cat) => (
                        <tr key={cat.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-semibold text-gray-900">{cat.name}</td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">{cat.slug}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => openEditCategoryModal(cat)}
                                className="p-2 bg-gray-100 hover:bg-pink-100 hover:text-pink-600 text-gray-600 rounded-xl transition"
                                title="Editar categoría"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-2 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 rounded-xl transition"
                                title="Eliminar categoría"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-8">
            {/* Create Role Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Crear Nuevo Rol Personalizado</h2>
                  <p className="text-xs text-gray-500">Define nuevos roles antes de asignarlos a usuarios.</p>
                </div>
              </div>

              {roleFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold">
                  {roleFormError}
                </div>
              )}

              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Nombre del Rol *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Ej. Editor o Inventario"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="Descripción de responsabilidades..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Crear Rol
                </button>
              </form>
            </div>

            {/* Permissions Matrix per Role */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Matriz de Permisos por Rol</h2>
              <p className="text-sm text-gray-500 mb-6">
                Activa o desactiva permisos específicos para cada rol creado en el sistema.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                      <th className="py-3 px-4">Permiso</th>
                      {roles.map((r) => (
                        <th key={r.id} className="py-3 px-4 text-center capitalize">
                          {r.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {permissions.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{p.description}</p>
                          <p className="font-mono text-xs text-gray-400">{p.code}</p>
                        </td>
                        {roles.map((r) => {
                          const permsForRole = rolePermissionsMap[r.id] || [];
                          const isChecked = permsForRole.includes(p.code) || r.name === 'superadmin';
                          return (
                            <td key={r.id} className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={r.name === 'superadmin'}
                                onChange={() => togglePermissionForRole(r.id, r.name, p.id, p.code)}
                                className="w-4 h-4 text-pink-600 focus:ring-pink-500 rounded border-gray-300 cursor-pointer disabled:opacity-60"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && hasPerm('users:manage') && (
          <div className="space-y-8">
            {/* Create New Admin Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Crear Nuevo Administrador</h2>
                  <p className="text-xs text-gray-500">Registra un nuevo gestor y asígnale un rol.</p>
                </div>
              </div>

              {adminFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold">
                  {adminFormError}
                </div>
              )}

              {adminFormSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold">
                  {adminFormSuccess}
                </div>
              )}

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="nuevo.admin@floreriavjm.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Rol *
                    </label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 capitalize"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Registrar Usuario con Rol
                </button>
              </form>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Usuarios Registrados en el Sistema</h2>
                  <p className="text-sm text-gray-500">
                    Lista general de cuentas de Supabase Auth y sus roles de acceso.
                  </p>
                </div>
                <button
                  onClick={fetchSystemUsers}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                >
                  Actualizar Lista
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-12 text-pink-600 font-medium">Cargando usuarios...</div>
              ) : systemUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No se encontraron usuarios.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                        <th className="py-3 px-4">Correo Electrónico</th>
                        <th className="py-3 px-4">ID de Usuario</th>
                        <th className="py-3 px-4">Rol Asignado</th>
                        <th className="py-3 px-4 text-right">Cambiar Rol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {systemUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-semibold text-gray-900">{u.email}</td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-400">{u.id}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                u.role === 'superadmin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-pink-100 text-pink-700'
                              }`}
                            >
                              {u.role === 'superadmin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, u.email, e.target.value)}
                              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 capitalize"
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'promos' && hasPerm('promos:manage') && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Gestión de Promociones y Códigos</h2>
            <p className="text-sm text-gray-500 mb-6">
              Módulo exclusivo para crear, editar y eliminar códigos de descuento en el carrito de compras.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Código (ej. VERANO15)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <input
                  type="text"
                  placeholder="Descuento (ej. 15%)"
                  value={promoDiscount}
                  onChange={(e) => setPromoDiscount(e.target.value)}
                  className="w-full sm:w-36 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!promoCode || !promoDiscount) return;
                      if (editingPromoIndex !== null) {
                        const updated = [...promos];
                        updated[editingPromoIndex] = { code: promoCode, discount: promoDiscount };
                        savePromosToStorage(updated);
                        setEditingPromoIndex(null);
                      } else {
                        savePromosToStorage([...promos, { code: promoCode, discount: promoDiscount }]);
                      }
                      setPromoCode('');
                      setPromoDiscount('');
                    }}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl text-sm transition"
                  >
                    {editingPromoIndex !== null ? 'Actualizar Cupón' : 'Agregar Cupón'}
                  </button>
                  {editingPromoIndex !== null && (
                    <button
                      onClick={() => {
                        setEditingPromoIndex(null);
                        setPromoCode('');
                        setPromoDiscount('');
                      }}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descuento</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {promos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-400 text-xs">
                        No hay cupones registrados.
                      </td>
                    </tr>
                  ) : (
                    promos.map((p, idx) => (
                      <tr key={idx} className={editingPromoIndex === idx ? 'bg-pink-50/50' : ''}>
                        <td className="py-3 px-4 font-mono font-bold text-pink-600">{p.code}</td>
                        <td className="py-3 px-4 font-semibold">{p.discount}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-3 justify-end">
                            <button
                              onClick={() => {
                                setEditingPromoIndex(idx);
                                setPromoCode(p.code);
                                setPromoDiscount(p.discount);
                              }}
                              className="text-pink-600 hover:text-pink-800 text-xs font-bold"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar el cupón ${p.code}?`)) {
                                  const filtered = promos.filter((_, i) => i !== idx);
                                  savePromosToStorage(filtered);
                                  if (editingPromoIndex === idx) {
                                    setEditingPromoIndex(null);
                                    setPromoCode('');
                                    setPromoDiscount('');
                                  }
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-bold"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-pink-600" /> Permisos de tu cuenta ({userRole})
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Lista detallada de los permisos asociados a tu rol actual en el sistema de Florería VJM.
            </p>

            <div className="space-y-3">
              {[
                { key: 'products:view', label: 'Ver productos del catálogo' },
                { key: 'products:create', label: 'Crear nuevos productos' },
                { key: 'products:edit', label: 'Editar productos y cambiar disponibilidad' },
                { key: 'products:delete', label: 'Eliminar productos' },
                { key: 'categories:manage', label: 'Gestionar y editar categorías' },
                { key: 'promos:manage', label: 'Gestionar códigos de descuento y promociones' },
                { key: 'users:manage', label: 'Crear usuarios y cambiar roles' },
                { key: 'roles:manage', label: 'Crear roles y asignar permisos' },
              ].map((perm) => {
                const allowed = hasPerm(perm.key);
                return (
                  <div
                    key={perm.key}
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${
                      allowed ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="text-sm font-semibold">{perm.label}</span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        allowed ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {allowed ? 'Permitido' : 'Restringido'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal for Edit Category */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h3 className="text-lg font-extrabold text-gray-900">Editar Categoría</h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Nombre de Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => {
                    setEditCatName(e.target.value);
                    setEditCatSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')
                    );
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Slug URL *
                </label>
                <input
                  type="text"
                  required
                  value={editCatSlug}
                  onChange={(e) => setEditCatSlug(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-xs"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 text-sm transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Extended Create / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h3 className="text-lg font-extrabold text-gray-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ramo de Rosas Rojas x12"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Precio (MXN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="450"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Código / SKU Interno (ej. T040811)
                  </label>
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    placeholder="T040811"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Tiempo de Elaboración
                  </label>
                  <input
                    type="text"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(e.target.value)}
                    placeholder="2 a 4 horas"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Etiquetas / Atributos (ej. tulipanes, rosa, cumpleaños)
                </label>
                <input
                  type="text"
                  value={productTags}
                  onChange={(e) => setProductTags(e.target.value)}
                  placeholder="tulipanes, rosa, san valentin"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Descripción / ¿Qué incluye el ramo?
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="2 tulipanes, follaje, dedicatoria, moño..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Imagen (Subir archivo a Supabase Storage o URL externa)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer px-4 py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                      <Upload className="w-4 h-4" />
                      {imageFile ? imageFile.name : 'Seleccionar imagen del equipo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setImageFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="O pega una URL externa (https://...)"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includesShipping"
                    checked={includesShipping}
                    onChange={(e) => setIncludesShipping(e.target.checked)}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500 rounded border-gray-300"
                  />
                  <label htmlFor="includesShipping" className="text-sm font-semibold text-gray-700">
                    ¿Incluye envío a domicilio gratis?
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500 rounded border-gray-300"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-semibold_700">
                    Producto disponible para venta en catálogo
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 text-sm transition disabled:opacity-50"
                >
                  {uploadingImage
                    ? 'Subiendo imagen...'
                    : editingProduct
                    ? 'Guardar Cambios'
                    : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
