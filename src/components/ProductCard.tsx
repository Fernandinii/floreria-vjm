'use client';

import { Product } from '@/lib/supabase';
import { useCart } from '@/store/useCart';
import { ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  product: Product;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: Props) {
  const addItem = useCart((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onSelect && onSelect(product)}
      className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition duration-300 flex flex-col justify-between cursor-pointer group"
    >
      <div className="relative h-48 w-full bg-pink-50 overflow-hidden">
        {product.image_url && !product.image_url.includes('EMPTY') ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-pink-300 text-4xl">
            🌸
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg leading-snug line-clamp-2 group-hover:text-pink-600 transition">
            {product.name}
          </h3>
          <p className="text-pink-600 font-bold text-xl mt-2">
            ${product.price > 0 ? product.price.toLocaleString('es-MX') : 'Consultar'} MXN
          </p>
        </div>

        <button
          onClick={handleAdd}
          className={`w-full mt-4 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition active:scale-95 ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-pink-600 hover:bg-pink-700 text-white shadow-sm'
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" />
              ¡Agregado!
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              Agregar al pedido
            </>
          )}
        </button>
      </div>
    </div>
  );
}
