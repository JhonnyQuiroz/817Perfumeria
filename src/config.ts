// ============================================================
//  CONFIGURACIÓN DEL CATÁLOGO — lo único que normalmente editas
// ============================================================
export const CONFIG = {
  // URL de tu Google Sheet publicado como CSV:
  //   Archivo → Compartir → Publicar en la web → elige la pestaña → formato CSV → Publicar
  // Déjalo vacío ('') para ver productos de demostración.
  sheetCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMoQARQcCP7ZHuHkl_Bo3eOXhRMenxqv06Nj-mj8PUmFRyMiPC_i982UM_crBkGh-RUgGzBF3dL6hm/pub?output=ods',

  // Número de WhatsApp con indicativo de país y sin "+" ni espacios (Colombia = 57)
  whatsapp: '573004904152',

  // Formato de precios
  currency: 'COP',
  locale: 'es-CO',

  // Texto que se envía por WhatsApp al pedir un producto
  orderMessage: 'Hola, me interesa este producto: ',
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
  // Imagen del hero: pon tu archivo en public/img/ (ej. /img/hero.jpg). Déjalo '' para usar el fondo decorativo.
  heroImage: '/img/hero.jpg',
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
    { title: 'Escríbenos', text: 'Con un clic te llevamos a WhatsApp con el producto ya mencionado.' },
    { title: 'Recíbelo', text: 'Coordinamos pago y envío a todo el país.' },
  ],
  footerNote: 'Precios en COP, sujetos a cambio sin previo aviso.',
};
