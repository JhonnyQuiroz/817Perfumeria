# Catálogo — Angular + Google Sheets

Catálogo estático: los productos y precios se leen desde un Google Sheet publicado como CSV. No hay base de datos ni servidor.

## 1. Preparar el Google Sheet
Primera fila (el orden de columnas no importa):

| nombre | descripcion | precio | categoria | imagen | disponible | destacado |
|---|---|---|---|---|---|---|

- `precio`: número (25000 o 25.000). Si pones texto ("Consultar") se muestra tal cual.
- `imagen`: URL pública o ruta del proyecto (ej. `/img/foto1.jpg`). Evita enlaces de Google Drive.
- `disponible`: `no` marca el producto como agotado. `destacado`: `si` muestra la etiqueta.
- **Usa una hoja solo con lo que quieras mostrar**: al publicarla, cualquiera con la URL puede verla.

Publicar: Archivo → Compartir → Publicar en la web → elige la pestaña → formato **CSV** → Publicar. Copia la URL.

## 2. Configurar
Edita `src/config.ts`: pega la URL en `sheetCsvUrl` y pon tu número en `whatsapp`.

## 3. Cambiar el diseño
- Colores y tipografías: variables al inicio de `src/styles.css` (`:root`).
- Textos del sitio (marca, titular, estadísticas, pasos): `SITE` en `src/config.ts`.
- Imagen principal: guarda tu archivo como `public/img/hero.jpg`.
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
