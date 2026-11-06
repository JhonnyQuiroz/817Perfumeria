# Catálogo — Angular + Google Sheets

Catálogo estático: los productos y precios se leen desde un Google Sheet publicado como CSV. No hay base de datos ni servidor.

## 1. Preparar el Google Sheet
Primera fila (el orden de columnas no importa):

| codigo | nombre | descripcion | precio | categoria | imagen | disponible | destacado |
|---|---|---|---|---|---|---|---|

- `codigo`: **número único y fijo por producto (1 a 49999)**, ej. 101, 102, 103… Es lo que identifica el perfume dentro del código de pedido. Escríbelo una vez y no lo cambies ni lo reutilices. Si usas `=RANDBETWEEN(1000,49999)`, copia y pega el resultado **como valores** (si lo dejas como fórmula, cambia en cada recálculo y rompe el historial).
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

```
Hola, me interesa este producto:
- Mandarin Sky (30 ml): 2
- Oud Wood (60 ml)
- Sauvage

Código de pedido: PED-T6FEF-6SQ3N-8QFA6-...
```

Un producto por línea; la cantidad solo aparece si es mayor a 1. El texto inicial se cambia en `CONFIG.orderMessage`; los tamaños, en `CONFIG.sizes`.

## Rastrear pedidos
El código de pedido guarda la **fecha y hora, los productos (id, tamaño y cantidad) y el total**. Para consultarlo abre `tu-sitio.com/#decodificar`, pega el código y verás todo el detalle. El botón "Copiar fila para Excel" copia una fila (fecha, código, productos, total) lista para pegar en tu hoja de historial.

- Cambia `orderSecret` en `src/config.ts` por una frase tuya **antes de publicar**. Si la cambias después, los códigos anteriores ya no se podrán consultar.
- No reutilices ni cambies los `codigo` de los productos: así los pedidos antiguos siguen mostrando el perfume correcto.
- Es ofuscación con llave y checksum: detecta códigos mal copiados o alterados a la ligera, pero la llave viaja dentro del sitio, así que no frena a alguien decidido. La fecha sale del reloj del celular del cliente; la hora del mensaje de WhatsApp es la referencia confiable.

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
