// ============================================================
//  CONFIGURACIÓN DEL CATÁLOGO — lo único que normalmente editas
// ============================================================
export const CONFIG = {
  // URL de tu Google Sheet publicado como CSV:
  //   Archivo → Compartir → Publicar en la web → elige la pestaña → formato CSV → Publicar
  // Déjalo vacío ('') para ver productos de demostración.
  sheetCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMoQARQcCP7ZHuHkl_Bo3eOXhRMenxqv06Nj-mj8PUmFRyMiPC_i982UM_crBkGh-RUgGzBF3dL6hm/pub?gid=0&single=true&output=csv',

  // Número de WhatsApp con indicativo de país y sin "+" ni espacios (Colombia = 57)
  whatsapp: '573004904152',

  // Formato de precios
  currency: 'COP',
  locale: 'es-CO',

  // Inicio del mensaje de WhatsApp. Después va un producto por línea y al final el código:
  //   Hola, me interesa este producto:
  //   - Mandarin Sky (30 ml): 2
  //   - Oud Wood (60 ml)
  //
  //   Código de pedido: PED-XXXXX-XXXXX-...
  // (la cantidad solo aparece si es mayor a 1)
  orderMessage: 'Hola, me interesa este producto: ',

  // Código de pedido (ver README → "Rastrear pedidos").
  //  - orderSecret: frase propia, cámbiala ANTES de publicar. Si la cambias después, los códigos
  //    anteriores ya no se podrán consultar.
  //  - orderPrefix: letras con las que empieza el código (ej. PED-XXXXX-...).
  orderSecret: 'k7Qx-2Vm9-Rt4Pz-817',
  orderPrefix: 'PED',
  timeZone: 'America/Bogota',

  // Tamaños disponibles por categoría. Las categorías que no estén aquí no muestran selector.
  // Precios por tamaño (opcional): agrega al Sheet columnas precio_30ml, precio_60ml, precio_100ml.
  // Si un tamaño no tiene precio en esas columnas, se usa el de la columna "precio".
  sizes: {
    Inspirados: ['30 ml', '60 ml', '100 ml'],
  } as Record<string, string[]>,
};

// ============================================================
//  TEXTOS DEL SITIO — edita aquí para cambiar de marca o temática
// ============================================================
export const SITE = {
  brand: '817 Perfumería',
  eyebrow: 'Catálogo · Colombia',
  titleStart: 'Encuentra lo que ',
  titleEm: 'realmente',
  titleEnd: ' quieres.',
  heroText: 'Una selección cuidada de productos originales. Explora el catálogo, elige y pide directamente por WhatsApp.',
  // Imagen del hero: pega aquí el ENLACE de la imagen (debe empezar por https://).
  // Déjalo '' para usar el fondo decorativo. Ejemplo: 'https://res.cloudinary.com/tu-cuenta/image/upload/hero.jpg'
  heroImage: 'https://scontent.cdninstagram.com/v/t51.82787-19/718726423_17915920845386464_6042553732865608044_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=104&ig_cache_key=GBfl1irgMtBhb6Y-AGxJqu_adttTbmNDAQAB1501500j-ccb7-5&ccb=7-5&_nc_sid=669407&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMyIn0%3D&_nc_ohc=ZXWb9Q5AkL0Q7kNvwF38thK&_nc_oc=AdoIndJhwZLKGgv6zQ2Qe05jdW-Lb_6W-_A8PrVDfhDf3_2kzGaKNDKE12daJ3ate2s&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_gid=Otq7DIUaQiSADFwvN6iSXg&_nc_ss=7b689&oh=00_AQRDYoD7fMk3Wol_KecNtal2Npm18vKThcDCn1XH4O0TaA&oe=6AF34C14',
  heroImageAlt: 'Imagen principal del catálogo',
  stats: [
    { value: '100%', label: 'Productos originales' },
    { value: '24 h', label: 'Respuesta por WhatsApp' },
    { value: 'COP', label: 'Precios con IVA incluido' },
  ],
  catalogLabel: 'Catálogo',
  catalogTitle: 'Perfumes originales',
  howLabel: 'Cómo funciona',
  howTitle: 'Pedir es sencillo',
  info: [
    { title: 'Elige', text: 'Explora el catálogo y filtra por categoría para encontrar lo que buscas.' },
    { title: 'Escríbenos', text: 'Agrega tus productos al pedido y envíalo por WhatsApp con un clic.' },
    { title: 'Recíbelo', text: 'Coordinamos pago y envío a todo el país.' },
  ],
  footerNote: 'Precios en COP, sujetos a cambio sin previo aviso.',
};
