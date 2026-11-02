'use client';

import { useEffect, useState } from 'react';
import { supabase, Product } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import StickerSlapFooter from '@/components/ui/sticker-slap-footer';
import { useCart } from '@/store/useCart';
import { ShoppingBag, Search, Flower2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const cartItems = useCart((state) => state.items);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const getTotalPrice = useCart((state) => state.getTotalPrice);

  // Número oficial de WhatsApp de la Florería VJM
  const WHATSAPP_NUMBER = '5219932232093';

  useEffect(() => {
    async function fetchData() {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('categories').select('*').order('name')
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (catRes.data) setCategoriesList(catRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      (p.code && p.code.toLowerCase().includes(term));
    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      selectedCategory.toLowerCase() === 'todos';
    return matchesSearch && matchesCategory;
  });

  const dynamicCategories = categoriesList.filter(
    (cat) => cat.slug.toLowerCase() !== 'todos' && cat.name.toLowerCase() !== 'todos'
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 via-white to-rose-50/30 text-gray-800 flex flex-col justify-between selection:bg-pink-500 selection:text-white">
      <div>
        {/* Top Announcement Bar */}
        <div className="bg-pink-600 text-white text-xs font-medium py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2">
          <span>✨ Envíos a domicilio en Villahermosa | Teléfono: +52 1 993 223 2093</span>
          <a
            href="https://wa.me/5219932232093"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold hover:text-pink-100 transition hidden sm:inline"
          >
            WhatsApp Directo
          </a>
        </div>

        {/* Header Navbar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-md shadow-pink-500/20 flex items-center justify-center overflow-hidden p-0.5">
                <img src="/favicon.png" alt="Florería VJM" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div>
                <h1 className="font-black text-2xl text-gray-900 tracking-tight leading-none">
                  Florería VJM
                </h1>
                <p className="text-xs text-pink-600 font-bold tracking-wider uppercase mt-0.5">
                  Florista • Organización de Eventos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2.5 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl shadow-lg shadow-pink-600/20 transition active:scale-95"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">
                  {totalItemsCount > 0 ? `$${getTotalPrice().toLocaleString('es-MX')} MXN` : 'Mi Pedido'}
                </span>
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-700 text-white text-[11px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-bounce">
                    {totalItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Banner Hero */}
          <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 pointer-events-none">
              <Flower2 className="w-96 h-96" />
            </div>

            <div className="relative z-10 max-w-xl">
              <span className="inline-block px-3.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase mb-4 text-pink-100">
                🌸 Arte, Entretenimiento y Eventos
              </span>
              <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                El detalle perfecto para cada ocasión especial
              </h2>
              <p className="text-pink-100 text-sm md:text-base leading-relaxed mb-6">
                Explora nuestro catálogo de ramos, arreglos florales, globos y accesorios. Arma tu carrito y envía tu pedido directamente a nuestro WhatsApp en segundos.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <a
                  href="https://wa.me/5219932232093"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white text-pink-700 hover:bg-pink-50 font-bold rounded-2xl shadow-md flex items-center gap-2 text-sm transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" /> Pedidos por WhatsApp (+52 1 993 223 2093)
                </a>
              </div>
            </div>
          </div>

          {/* Search & Categories Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-stretch md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
               <input
                 type="text"
                 placeholder="Buscar ramo, arreglo o código..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-11 pr-4 py-3 rounded-2xl border border-pink-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition text-sm"
               />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition shadow-sm ${
                  selectedCategory === 'ALL'
                    ? 'bg-pink-600 text-white'
                    : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'
                }`}
              >
                Todos
              </button>
              {dynamicCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition shadow-sm ${
                    selectedCategory === cat.name
                      ? 'bg-pink-600 text-white'
                      : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Productos */}
          {loading ? (
            <div className="text-center py-20 text-pink-600 font-medium">
              Cargando el catálogo de flores...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-pink-100 shadow-sm">
              <p className="text-lg font-bold text-gray-700 mb-1">No se encontraron productos</p>
              <p className="text-xs text-gray-400">Intenta buscar con otro término o categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <StickerSlapFooter />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Drawer Carrito */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        whatsappNumber={WHATSAPP_NUMBER}
      />
    </div>
  );
}
