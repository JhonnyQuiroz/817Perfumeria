import { productId } from './order-code';

export type Gender = 'dama' | 'caballero' | 'unisex' | '';

export interface Product {
  name: string;
  description: string;
  price: number | null;
  priceText: string;
  category: string;
  image: string;
  available: boolean;
  featured: boolean;
  /** Precios por tamaño, desde columnas opcionales como precio_30ml, precio_60ml... */
  sizePrices: Record<string, number>;
  /** Valor de la columna `codigo` del Sheet (identificador estable del producto). */
  code: string;
  /** Id numérico de 16 bits usado dentro del código de pedido. */
  pid: number;
  /** Porcentaje de descuento (0 = sin descuento). Viene de la columna `descuento`, ej. 18. */
  discount: number;
  /** Para quién es el perfume, de la columna `genero` (Dama / Caballero / Unisex). */
  gender: Gender;
}

// Columnas de la hoja (el orden no importa, se detectan por el nombre del encabezado)
const ALIASES: Record<'name' | 'description' | 'price' | 'category' | 'image' | 'available' | 'featured' | 'code' | 'discount' | 'gender', string[]> = {
  name: ['nombre', 'producto', 'name'],
  description: ['descripcion', 'detalle', 'description'],
  price: ['precio', 'valor', 'price'],
  category: ['categoria', 'category'],
  image: ['imagen', 'foto', 'image', 'img'],
  available: ['disponible', 'stock', 'available'],
  featured: ['destacado', 'featured'],
  code: ['codigo', 'code', 'sku', 'ref', 'referencia'],
  discount: ['descuento', 'dcto', 'discount'],
  gender: ['genero', 'sexo', 'gender'],
};

export const DEMO_CSV = `codigo,nombre,descripcion,precio,categoria,imagen,disponible,destacado,precio_30ml,precio_60ml,precio_100ml,descuento,genero
101,Producto de ejemplo 1,"Descripción corta del producto, con coma incluida",,Inspirados,,si,si,35000,60000,85000,18,Dama
102,Producto de ejemplo 2,Otra descripción de ejemplo,,Inspirados,,si,no,32000,55000,80000,,Caballero
103,Producto de ejemplo 3,Este producto está agotado,129000,Original,,no,no,,,,10,Dama
104,Producto de ejemplo 4,Precio a convenir,Consultar,Original,,si,no,,,,,Unisex`;

/** Clave de tamaño: "30 ml", "30ML" y "30ml" son lo mismo. */
export const sizeKey = (s: string): string => s.replace(/\s+/g, '').toLowerCase();

export const norm = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Parser CSV mínimo: soporta comillas, comas y saltos de línea dentro de celdas. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; }
      } else { cell += c; }
    } else if (c === '"') { quoted = true; }
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = ''; rows.push(row); row = [];
    } else { cell += c; }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}

/** Acepta "25000", "25.000", "$25,000", "12.5", "2,5"... Devuelve null si no es número. */
export function parsePrice(raw: string): number | null {
  let s = raw.replace(/[^\d.,]/g, '');
  if (!s) return null;
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) {
    s = s.replace(/[.,]/g, '');                       // separador de miles
  } else if (s.includes(',') && s.includes('.')) {
    const last = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
    s = s.slice(0, last).replace(/[.,]/g, '') + '.' + s.slice(last + 1);
  } else {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/** "18", "18%" o "18,5" -> 18 / 18 / 18.5. Solo vale entre 0 y 100 (sin incluir). */
export function parseDiscount(raw: string): number {
  const n = parsePrice(raw);
  return n !== null && n > 0 && n < 100 ? n : 0;
}

export function parseGender(raw: string): Gender {
  const g = norm(raw);
  if (!g) return '';
  if (g.includes('unisex') || g.includes('ambos')) return 'unisex';
  if (/dama|mujer|femenin/.test(g)) return 'dama';
  if (/caballero|hombre|masculin/.test(g)) return 'caballero';
  return '';
}

export function toProducts(rows: string[][]): Product[] {
  if (rows.length < 2) return [];
  const header = rows[0].map(norm);
  const col = (key: keyof typeof ALIASES): number =>
    header.findIndex(h => ALIASES[key].includes(h));
  // Columnas opcionales de precio por tamaño: precio_30ml, precio 60 ml, precio100ml...
  const sizeCols: [string, number][] = [];
  header.forEach((h, i) => {
    const m = /^precio[\s_-]*(\d+)\s*ml$/.exec(h);
    if (m) sizeCols.push([m[1] + 'ml', i]);
  });
  const idx = {
    name: col('name'), description: col('description'), price: col('price'),
    category: col('category'), image: col('image'),
    available: col('available'), featured: col('featured'), code: col('code'),
    discount: col('discount'), gender: col('gender'),
  };
  const get = (r: string[], i: number): string => (i >= 0 ? (r[i] ?? '').trim() : '');

  const list = rows.slice(1).flatMap((r): Product[] => {
    const name = get(r, idx.name);
    if (!name) return [];
    const priceText = get(r, idx.price);
    const avail = norm(get(r, idx.available));
    const feat = norm(get(r, idx.featured));
    const code = get(r, idx.code);
    const sizePrices = Object.fromEntries(
      sizeCols.flatMap(([k, i]): [string, number][] => {
        const n = parsePrice(get(r, i));
        return n === null ? [] : [[k, n]];
      }),
    );
    const price = parsePrice(priceText);
    const discRaw = get(r, idx.discount);
    const genRaw = get(r, idx.gender);
    const gender = parseGender(genRaw);
    // El descuento solo tiene sentido si el producto tiene algún precio
    const discount = price !== null || Object.keys(sizePrices).length ? parseDiscount(discRaw) : 0;
    if (discRaw && discRaw !== '0' && !parseDiscount(discRaw)) console.warn(`[catálogo] "${name}": descuento "${discRaw}" no válido (usa un número entre 1 y 99, ej. 18).`);
    if (genRaw && !gender) console.warn(`[catálogo] "${name}": género "${genRaw}" no reconocido (usa Dama, Caballero o Unisex).`);
    return [{
      name,
      code,
      pid: productId(code, name),
      description: get(r, idx.description),
      price,
      priceText,
      category: get(r, idx.category) || 'General',
      image: get(r, idx.image),
      available: !['no', 'false', '0', 'agotado', 'n'].includes(avail),
      featured: ['si', 'yes', 'true', '1', 'x', 's'].includes(feat),
      sizePrices,
      discount,
      gender,
    }];
  });
  // Avisos para el dueño del catálogo (aparecen en la consola del navegador)
  const seen = new Map<number, string>();
  for (const p of list) {
    if (!p.code) console.warn(`[catálogo] "${p.name}" no tiene valor en la columna "codigo": su id se deriva del nombre.`);
    const other = seen.get(p.pid);
    if (other) console.warn(`[catálogo] "${p.name}" y "${other}" comparten el mismo código (${p.pid}). Los pedidos no podrán distinguirlos.`);
    seen.set(p.pid, p.name);
  }
  return list;
}
