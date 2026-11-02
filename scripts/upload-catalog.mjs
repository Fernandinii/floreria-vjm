import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Faltan variables de entorno de Supabase.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  try {
    const fileData = fs.readFileSync('./catalogo_florería.json', 'utf-8');
    const products = JSON.parse(fileData);

    console.log(`Subiendo ${products.length} productos a Supabase...`);

    const { data, error } = await supabase
      .from('products')
      .insert(products);

    if (error) {
      console.error('Error de Supabase:', error);
    } else {
      console.log('¡Catálogo cargado con éxito en Supabase!');
    }
  } catch (err) {
    console.error('Error al procesar el archivo JSON:', err);
  }
}

run();