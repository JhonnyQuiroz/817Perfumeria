// ============================================================
//  CONFIGURACIÓN DEL CATÁLOGO — lo único que normalmente editas
// ============================================================
export const CONFIG = {
  // URL de tu Google Sheet publicado como CSV:
  //   Archivo → Compartir → Publicar en la web → elige la pestaña → formato CSV → Publicar
  // Déjalo vacío ('') para ver productos de demostración.
  sheetCsvUrl: '',

  // Número de WhatsApp con indicativo de país y sin "+" ni espacios (Colombia = 57)
  whatsapp: '573000000000',

  // Formato de precios
  currency: 'COP',
  locale: 'es-CO',

  // Texto que se envía por WhatsApp al pedir un producto
  orderMessage: 'Hola, me interesa este producto: ',
};
