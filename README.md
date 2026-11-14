# Catálogo — Angular + Google Sheets

Catálogo estático: los productos y precios se leen desde un Google Sheet publicado como CSV. No hay base de datos ni servidor.

## 1. Preparar el Google Sheet
Primera fila (el orden de columnas no importa):

| codigo | nombre | descripcion | precio | categoria | genero | descuento | imagen | disponible | tamanos |
|---|---|---|---|---|---|---|---|---|---|

- `codigo`: **número único y fijo por producto (1 a 49999)**, ej. 101, 102, 103… Es lo que identifica el perfume dentro del código de pedido. Escríbelo una vez y no lo cambies ni lo reutilices. Si usas `=RANDBETWEEN(1000,49999)`, copia y pega el resultado **como valores** (si lo dejas como fórmula, cambia en cada recálculo y rompe el historial).
- `precio`: número (25000 o 25.000). Si pones texto ("Consultar") se muestra tal cual.
- `imagen`: URL pública o ruta del proyecto (ej. `/img/foto1.jpg`). Evita enlaces de Google Drive.
- `tamanos` (opcional): tamaños disponibles para ese producto, separados por punto y coma, por ejemplo `30 ml; 60 ml; 100 ml`. Déjalo vacío si el producto no tiene opciones de tamaño. Para productos de categoría `Original` y `Replica 1.1`, esta columna permite configurar tamaños distintos en cada fila.
- `precio_30ml`, `precio_60ml`, `precio_100ml` (opcionales): precio regular para cada tamaño. Agrega más columnas con el formato `precio_Nml` si necesitas otros tamaños (por ejemplo, `precio_50ml`). Si la celda del tamaño está vacía, se usa `precio`. En `Inspirados` se conserva el selector configurado en `src/config.ts`; en otras categorías también se detectan tamaños de columnas `precio_Nml` con precio.

Ejemplo para tamaños y precios independientes por producto:

| categoria | tamanos | precio_30ml | precio_50ml | precio_60ml |
|---|---|---:|---:|---:|
| Original | 30 ml; 50 ml | 120000 | 175000 | |
| Replica 1.1 | 30 ml; 60 ml | 45000 | | 68000 |

En este ejemplo, cada fila ofrece únicamente los tamaños escritos en `tamanos`; el precio se toma de la columna correspondiente. Puedes dejar vacías las columnas de tamaños que ese perfume no ofrece.
- `descuento` (opcional): **solo el número**, sin el símbolo %, ej. `18`. `precio` (y `precio_30ml`, etc.) es siempre el precio **regular**; la página calcula el precio con descuento, lo muestra junto al regular tachado y pone la etiqueta "Descuento 18%". El carrito, el total y el código de pedido usan el precio con descuento. Debe ser un número entre 1 y 99; si lo dejas vacío no hay descuento.
- `genero` (opcional): `Dama`, `Caballero` o `Unisex`. Los botones **Dama** y **Caballero** aparecen cuando al menos un producto tiene ese género (los `Unisex` salen en ambos). El botón **Descuento** aparece cuando al menos un producto tiene descuento.
- `disponible`: `no` marca el producto como agotado.
- La columna `destacado` ya no se usa: la etiqueta de la tarjeta ahora muestra el descuento.

**Orden por precio:** el selector "Ordenar" usa el precio más bajo de cada producto (con su descuento aplicado, y el del tamaño más pequeño si tiene tamaños). Los productos sin precio ("Consultar") quedan siempre al final.
- **Usa una hoja solo con lo que quieras mostrar**: al publicarla, cualquiera con la URL puede verla.

Al tocar una tarjeta se abre el detalle para ver la imagen, descripción, disponibilidad, precio y elegir tamaño. En las categorías distintas de `Inspirados`, **Agregar** abre ese detalle cuando el producto tiene tamaños, y exige elegir una presentación antes de añadirla al pedido. El carrito muestra la imagen de cada producto.

En las categorías distintas de `Inspirados`, la tarjeta muestra los tamaños disponibles bajo el nombre. En el detalle se debe seleccionar un tamaño antes de agregar el producto. La búsqueda del encabezado admite coincidencias aproximadas y muestra hasta ocho resultados con foto y el precio más bajo. El encabezado permanece fijo al desplazarse; el botón de flecha permite volver a los filtros, y el nombre de la tienda vuelve al inicio sin limpiar las selecciones.

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
- Foto del encabezado: cambia `SITE.logoImage` en `src/config.ts`. Para una imagen del proyecto, guarda el archivo en `public/img/` y usa una ruta como `/img/logo.png`; también puedes pegar una URL pública `https://...`. El texto alternativo se configura en `SITE.logoImageAlt`.
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
