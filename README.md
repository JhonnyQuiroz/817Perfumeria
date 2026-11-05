# Nova — Landing page Angular para Vercel

Landing page responsive de demostración construida con Angular standalone.

## Requisitos
Node.js 20.19+ o 22.12+ y npm.

## Ejecutar localmente
```bash
npm install
npm start
```
Abre http://localhost:4200.

## Build
```bash
npm run build
```
La salida está en `dist/landing-angular/browser`.

## Publicar en Vercel
1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel selecciona **Add New → Project** e importa el repositorio.
3. Configura Build Command: `npm run build`.
4. Configura Output Directory: `dist/landing-angular/browser`.
5. Despliega. `vercel.json` ya incluye estos valores y una regla SPA para devolver `index.html`.

## Personalización
- Contenido y estructura: `src/main.ts`.
- Estilos y colores: `src/styles.css`.
- Título y metadatos: `src/index.html`.

## Formulario
El formulario valida campos y muestra un mensaje de demostración. No envía información; conecta un backend o proveedor de formularios para recibir mensajes reales.
