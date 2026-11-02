import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  is_available: boolean;
  is_customizable?: boolean;
  description?: string;
  includes_shipping?: boolean;
  preparation_time?: string;
  code?: string;
  tags?: string;
}

export const CATEGORIES = [
  "Ramos",
  "Cajas y Arreglos",
  "Peluches y Globos",
  "Condolencias"
] as const;
