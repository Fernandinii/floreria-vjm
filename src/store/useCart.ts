import { create } from 'zustand';
import { Product } from '@/lib/supabase';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  discountCode: string | null;
  discountPercent: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getDiscountedTotal: () => number;
  applyDiscount: (code: string, percent: number) => void;
  removeDiscount: () => void;
  getWhatsAppLink: (phoneNumber: string) => string;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  discountCode: null,
  discountPercent: 0,

  addItem: (product) => set((state) => {
    const existingIndex = state.items.findIndex(i => i.product.id === product.id);
    if (existingIndex > -1) {
      const newItems = [...state.items];
      newItems[existingIndex].quantity += 1;
      return { items: newItems };
    }
    return { items: [...state.items, { product, quantity: 1 }] };
  }),

  removeItem: (productId) => set((state) => ({
    items: state.items.filter(i => i.product.id !== productId)
  })),

  clearCart: () => set({ items: [], discountCode: null, discountPercent: 0 }),

  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  },

  getDiscountedTotal: () => {
    const subtotal = get().getTotalPrice();
    const percent = get().discountPercent;
    if (percent <= 0) return subtotal;
    return subtotal * (1 - percent / 100);
  },

  applyDiscount: (code, percent) => set({ discountCode: code, discountPercent: percent }),

  removeDiscount: () => set({ discountCode: null, discountPercent: 0 }),

  getWhatsAppLink: (phoneNumber: string) => {
    const { items, getTotalPrice, getDiscountedTotal, discountCode, discountPercent } = get();
    if (items.length === 0) return '';

    let message = "¡Hola Florería VJM! 🌸 Quiero realizar el siguiente pedido desde la página web:\n\n";

    items.forEach(item => {
      const codePrefix = item.product.code ? `[${item.product.code}] ` : '';
      message += `• ${item.quantity}x ${codePrefix}${item.product.name} - $${(item.product.price * item.quantity).toLocaleString('es-MX')} MXN\n`;
    });

    const subtotal = getTotalPrice();
    const finalTotal = getDiscountedTotal();

    message += `\nSubtotal: $${subtotal.toLocaleString('es-MX')} MXN`;

    if (discountCode && discountPercent > 0) {
      message += `\nCupón aplicado (${discountCode} - ${discountPercent}%): -$${(subtotal - finalTotal).toLocaleString('es-MX')} MXN`;
    }

    message += `\n*Total a pagar: $${finalTotal.toLocaleString('es-MX')} MXN*`;
    message += "\n\nQuedo a la espera de sus datos de pago y confirmación de entrega. ¡Gracias!";

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }
}));
