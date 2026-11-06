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
}

// Columnas de la hoja (el orden no importa, se detectan por el nombre del encabezado)
const ALIASES: Record<'name' | 'description' | 'price' | 'category' | 'image' | 'available' | 'featured', string[]> = {
  name: ['nombre', 'producto', 'name'],
  description: ['descripcion', 'detalle', 'description'],
  price: ['precio', 'valor', 'price'],
  category: ['categoria', 'category'],
  image: ['imagen', 'foto', 'image', 'img'],
  available: ['disponible', 'stock', 'available'],
  featured: ['destacado', 'featured'],
};

export const DEMO_CSV = `nombre,descripcion,precio,categoria,imagen,disponible,destacado,precio_30ml,precio_60ml,precio_100ml
Producto de ejemplo 1,"Descripción corta del producto, con coma incluida",,Inspirados,,si,si,35000,60000,85000
Producto de ejemplo 2,Otra descripción de ejemplo,,Inspirados,,si,no,32000,55000,80000
Producto de ejemplo 3,Este producto está agotado,129000,Original,,no,no,,,
Producto de ejemplo 4,Precio a convenir,Consultar,Original,,si,no,,,`;

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
    available: col('available'), featured: col('featured'),
  };
  const get = (r: string[], i: number): string => (i >= 0 ? (r[i] ?? '').trim() : '');

  return rows.slice(1).flatMap((r): Product[] => {
    const name = get(r, idx.name);
    if (!name) return [];
    const priceText = get(r, idx.price);
    const avail = norm(get(r, idx.available));
    const feat = norm(get(r, idx.featured));
    return [{
      name,
      description: get(r, idx.description),
      price: parsePrice(priceText),
      priceText,
      category: get(r, idx.category) || 'General',
      image: get(r, idx.image),
      available: !['no', 'false', '0', 'agotado', 'n'].includes(avail),
      featured: ['si', 'yes', 'true', '1', 'x', 's'].includes(feat),
      sizePrices: Object.fromEntries(
        sizeCols.flatMap(([k, i]): [string, number][] => {
          const n = parsePrice(get(r, i));
          return n === null ? [] : [[k, n]];
        }),
      ),
    }];
  });
}
