// ============================================================
//  CÓDIGO DE PEDIDO — compacto, rastreable y con checksum
//  Guarda: fecha, productos (id + tamaño + cantidad) y total.
//  OJO: es ofuscación con llave (CONFIG.orderSecret), no seguridad fuerte:
//  la llave viaja dentro del sitio. Sirve para rastrear y detectar errores
//  o alteraciones torpes, no para frenar a alguien decidido.
// ============================================================

export interface OrderItem { id: number; size: number; qty: number; }
export interface OrderData { date: Date; total: number; unpriced: boolean; items: OrderItem[]; }

const EPOCH = Date.UTC(2026, 0, 1);              // la fecha se guarda en segundos desde aquí
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32 (sin I, L, O, U)

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

function keystream(secret: string, nonce: number, length: number): number[] {
  let a = fnv1a(secret + ':' + nonce);            // mulberry32
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    out.push((((t ^ (t >>> 14)) >>> 0) / 4294967296 * 256) | 0);
  }
  return out;
}

const checksum = (plain: number[], secret: string): number => fnv1a(secret + '|' + plain.join(',')) & 0xffff;

function b32encode(bytes: number[]): string {
  let bits = 0, val = 0, out = '';
  for (const b of bytes) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += ALPHABET[(val >> (bits - 5)) & 31]; bits -= 5; }
    val &= (1 << bits) - 1;
  }
  if (bits > 0) out += ALPHABET[(val << (5 - bits)) & 31];
  return out;
}

function b32decode(s: string): number[] | null {
  let bits = 0, val = 0;
  const out: number[] = [];
  for (const ch of s) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) return null;
    val = (val << 5) | v; bits += 5;
    if (bits >= 8) { out.push((val >> (bits - 8)) & 255); bits -= 8; }
    val &= (1 << bits) - 1;
  }
  return out;
}

/** Id de producto de 16 bits. Usa la columna `codigo` del Sheet (número 1–49999);
 *  si falta, deriva uno del nombre (50000–65535) — menos fiable si renombras el producto. */
export function productId(codigo: string, name: string): number {
  const n = Number(codigo.trim());
  if (codigo.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= 49999) return n;
  return 50000 + (fnv1a(name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()) % 15536);
}

/** Genera el código. `now` y `nonce` solo se pasan en pruebas. */
export function encodeOrder(
  data: { total: number; unpriced: boolean; items: OrderItem[] },
  secret: string, prefix: string,
  now: number = Date.now(), nonce: number = Math.floor(Math.random() * 256),
): string {
  const secs = Math.min(Math.max(Math.floor((now - EPOCH) / 1000), 0), 0xffffffff);
  const total = Math.min(Math.max(Math.round(data.total), 0), 0xffffffff);
  const items = data.items.slice(0, 255);
  const plain = [
    (data.unpriced ? 0x10 : 0) | 1,               // versión + bandera "hay productos por consultar"
    (secs >>> 24) & 255, (secs >>> 16) & 255, (secs >>> 8) & 255, secs & 255,
    (total >>> 24) & 255, (total >>> 16) & 255, (total >>> 8) & 255, total & 255,
    items.length,
    ...items.flatMap(i => [(i.id >> 8) & 255, i.id & 255, Math.min(i.size, 255), Math.min(i.qty, 255)]),
  ];
  const ks = keystream(secret, nonce, plain.length);
  const cs = checksum(plain, secret);
  const bytes = [nonce, ...plain.map((b, i) => b ^ ks[i]), (cs >> 8) & 255, cs & 255];
  const groups = b32encode(bytes).match(/.{1,5}/g) ?? [];
  return `${prefix}-${groups.join('-')}`;
}

/** Devuelve null si el código está incompleto, tiene un error o no corresponde a esta llave. */
export function decodeOrder(code: string, secret: string, prefix: string): OrderData | null {
  let s = code.trim().toUpperCase();
  const pre = prefix.toUpperCase() + '-';
  if (s.startsWith(pre)) s = s.slice(pre.length);
  s = s.replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  const bytes = b32decode(s);
  if (!bytes || bytes.length < 13) return null;
  const nonce = bytes[0];
  const cipher = bytes.slice(1, -2);
  const csStored = (bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1];
  const ks = keystream(secret, nonce, cipher.length);
  const plain = cipher.map((b, i) => b ^ ks[i]);
  if (checksum(plain, secret) !== csStored) return null;
  if ((plain[0] & 0x0f) !== 1 || plain.length !== 10 + plain[9] * 4) return null;
  const secs = ((plain[1] << 24) | (plain[2] << 16) | (plain[3] << 8) | plain[4]) >>> 0;
  const total = ((plain[5] << 24) | (plain[6] << 16) | (plain[7] << 8) | plain[8]) >>> 0;
  const items: OrderItem[] = [];
  for (let i = 0; i < plain[9]; i++) {
    const o = 10 + i * 4;
    items.push({ id: (plain[o] << 8) | plain[o + 1], size: plain[o + 2], qty: plain[o + 3] });
  }
  return { date: new Date(EPOCH + secs * 1000), total, unpriced: (plain[0] & 0x10) !== 0, items };
}
