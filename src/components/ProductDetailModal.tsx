'use client';

import { Product } from '@/lib/supabase';
import { useCart } from '@/store/useCart';
import { X, ShoppingBag, Truck, Clock, Check, Plus, Minus, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, isOpen, onClose }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const addItem = useCart((state) => state.addItem);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      setQuantity(1);
    }, 1200);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-pink-100 overflow-hidden relative flex flex-col md:flex-row max-h-[90vh]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-gray-600 rounded-full shadow-md transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left: Image & Availability Badge */}
          <div
            className="relative md:w-1/2 h-64 md:h-auto bg-pink-50 flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={() => {
              if (product.image_url && !product.image_url.includes('EMPTY')) {
                setIsZoomed(true);
              }
            }}
            title="Haz clic para ver la imagen en grande"
          >
            {product.image_url && !product.image_url.includes('EMPTY') ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition duration-300"
              />
            ) : (
              <div className="text-6xl">🌸</div>
            )}

            <div className="absolute top-4 left-4">
              {product.is_available ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-md">
                  <CheckCircle2 className="w-4 h-4" /> Disponible
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-bold shadow-md">
                  <XCircle className="w-4 h-4" /> Agotado
                </span>
              )}
            </div>
          </div>

        {/* Right: Product Details & Cart Action */}
        <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between overflow-y-auto">
          <div>
            <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold mb-3">
              {product.category || 'Arreglo Floral'}
            </span>
            <h2 className="text-2xl font-black text-gray-900 leading-snug mb-2">
              {product.name}
            </h2>
            <p className="text-2xl font-extrabold text-pink-600 mb-4">
              ${product.price > 0 ? product.price.toLocaleString('es-MX') : 'Consultar'} MXN
            </p>

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                ¿Qué incluye?
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {product.description || 'Arreglo floral diseñado artesanalmente con flores frescas de la más alta calidad y tarjeta dedicatoria personalizada.'}
              </p>
            </div>

            {/* Attributes: Shipping & Prep time */}
            <div className="space-y-2 mb-6 text-xs font-medium text-gray-600">
              <div className="flex items-center gap-2">
                <Truck className={`w-4 h-4 ${product.includes_shipping ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span>
                  {product.includes_shipping ? (
                    <strong className="text-emerald-700">¡Envío a domicilio incluido!</strong>
                  ) : (
                    'Costo de envío a cotizar según zona'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-600" />
                <span>Tiempo de elaboración: <strong>{product.preparation_time || '2 a 4 horas'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quantity Selector & Add Button */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Cantidad</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-200 transition text-gray-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-bold text-sm text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-200 transition text-gray-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.is_available}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
                !product.is_available
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : added
                  ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                  : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-600/25'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" /> ¡Agregado al carrito!
                </>
              ) : !product.is_available ? (
                'Producto Agotado'
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" /> Agregar al pedido (${(product.price * quantity).toLocaleString('es-MX')} MXN)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Lightbox Modal for Image Zoom */}
      {isZoomed && product.image_url && !product.image_url.includes('EMPTY') && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 z-10 p-3 bg-white/25 hover:bg-white/40 text-white rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={product.image_url}
            alt={product.name}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
