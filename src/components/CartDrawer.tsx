'use client';

import { useCart } from '@/store/useCart';
import { ShoppingBag, X, Trash2, ArrowRight, Tag, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber: string;
}

export function CartDrawer({ isOpen, onClose, whatsappNumber }: Props) {
  const {
    items,
    removeItem,
    getTotalPrice,
    getDiscountedTotal,
    discountCode,
    discountPercent,
    applyDiscount,
    removeDiscount,
    getWhatsAppLink
  } = useCart();

  const [inputCode, setInputCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(null);

    const cleanCode = inputCode.trim().toUpperCase();

    if (!cleanCode) return;

    // Load active promos from localStorage or defaults
    let activePromos = [
      { code: 'VJM10', discount: '10%' },
      { code: 'AMOR20', discount: '20%' },
      { code: 'VJM', discount: '10%' },
      { code: 'SANVALENTIN', discount: '20%' },
    ];
    try {
      const saved = localStorage.getItem('vjm_promos');
      if (saved) {
        activePromos = JSON.parse(saved);
      }
    } catch (e) {}

    const found = activePromos.find((p) => p.code.toUpperCase() === cleanCode);

    if (found) {
      const percentNum = parseFloat(found.discount.replace(/[^0-9.]/g, '')) || 10;
      applyDiscount(found.code, percentNum);
      setPromoSuccess(`¡Cupón aplicado con éxito! ${found.discount} de descuento`);
      setInputCode('');
    } else {
      setPromoError('Código de descuento inválido o expirado.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10 p-6 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-pink-600" /> Tu Pedido
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-10">
                Tu carrito está vacío 💐
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 bg-pink-50/50 rounded-xl border border-pink-100"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-gray-800 text-sm">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-pink-600 font-bold mt-1">
                      {item.quantity} x ${item.product.price.toLocaleString('es-MX')} MXN
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-2 text-red-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="pt-4 border-t border-gray-100 space-y-4">
            {/* Promo Code Section */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-pink-600" /> Código de Descuento
              </label>

              {discountCode ? (
                <div className="flex items-center justify-between bg-pink-50 border border-pink-200 p-2 rounded-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-pink-700">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{discountCode} ({discountPercent}% OFF)</span>
                  </div>
                  <button
                    onClick={removeDiscount}
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. VJM10"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs uppercase focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg text-xs transition"
                  >
                    Aplicar
                  </button>
                </form>
              )}

              {promoError && (
                <p className="text-red-600 text-[11px] mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {promoError}
                </p>
              )}
              {promoSuccess && (
                <p className="text-emerald-600 text-[11px] mt-1.5 flex items-center gap-1">
                  <Check className="w-3 h-3" /> {promoSuccess}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Subtotal:</span>
                <span>${getTotalPrice().toLocaleString('es-MX')} MXN</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs font-semibold">
                  <span>Descuento ({discountPercent}%):</span>
                  <span>-${(getTotalPrice() - getDiscountedTotal()).toLocaleString('es-MX')} MXN</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-100">
                <span>Total Estimado:</span>
                <span className="text-pink-600">${getDiscountedTotal().toLocaleString('es-MX')} MXN</span>
              </div>
            </div>

            <a
              href={getWhatsAppLink(whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              Confirmar pedido por WhatsApp
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
