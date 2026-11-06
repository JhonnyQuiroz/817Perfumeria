# Catálogo — Angular + Google Sheets

Catálogo estático: los productos y precios se leen desde un Google Sheet publicado como CSV. No hay base de datos ni servidor.

## 1. Preparar el Google Sheet
Primera fila (el orden de columnas no importa):

| nombre | descripcion | precio | categoria | imagen | disponible | destacado |
|---|---|---|---|---|---|---|

- `precio`: número (25000 o 25.000). Si pones texto ("Consultar") se muestra tal cual.
- `imagen`: URL pública o ruta del proyecto (ej. `/img/foto1.jpg`). Evita enlaces de Google Drive.
- `precio_30ml`, `precio_60ml`, `precio_100ml` (opcionales): precio por tamaño para las categorías con selector de tamaño (hoy `Inspirados`, ver `sizes` en `src/config.ts`). Si un tamaño no tiene precio, se usa el de `precio`.
- `disponible`: `no` marca el producto como agotado. `destacado`: `si` muestra la etiqueta.
- **Usa una hoja solo con lo que quieras mostrar**: al publicarla, cualquiera con la URL puede verla.

Publicar: Archivo → Compartir → Publicar en la web → elige la pestaña → formato **CSV** → Publicar. Copia la URL.

## 2. Configurar
Edita `src/config.ts`: pega la URL en `sheetCsvUrl` y pon tu número en `whatsapp`.

## Pedidos por WhatsApp
Cada producto se agrega a un pedido (botón **Agregar**) y el cliente lo envía por WhatsApp. El mensaje junta los productos con " - " y muestra la cantidad solo si es mayor a 1:

`Hola, me interesa este producto: Mandarin Sky (30 ml): 2 - Oud Wood (60 ml) - Sauvage`

El texto inicial se cambia en `CONFIG.orderMessage`; los tamaños, en `CONFIG.sizes`.

## 3. Cambiar el diseño
- Colores y tipografías: variables al inicio de `src/styles.css` (`:root`).
- Textos del sitio (marca, titular, estadísticas, pasos): `SITE` en `src/config.ts`.
- Imagen principal: pega el enlace (https://...) en `SITE.heroImage` de `src/config.ts`. Si queda vacío se usa un fondo decorativo.
- Estructura HTML: `src/main.ts`.
- Los datos (Sheet) y el diseño están separados: puedes rehacer uno sin tocar el otro.

## Ejecutar y compilar
Requiere Node 20.19+ o 22.12+.
```bash
npm install
npm start        # http://localhost:4200
npm run build    # salida: dist/landing-angular/browser
```

## Publicar (Cloudflare Pages / Netlify)
- Build command: `npm run build`
- Output directory: `dist/landing-angular/browser`
- Variable de entorno `NODE_VERSION=22` si la plataforma no lee `.node-version`.
- Luego agrega tu dominio en "Custom domains".

Nota: el plan Hobby de Vercel es solo para uso no comercial; para el catálogo de un negocio usa Cloudflare Pages o Netlify (o el plan Pro de Vercel).
