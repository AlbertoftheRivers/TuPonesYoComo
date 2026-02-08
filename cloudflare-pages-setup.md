# 🚀 Configurar Cloudflare Pages para PWA

## Pasos para desplegar la PWA en Cloudflare Pages

### 1. Preparar el proyecto

Asegúrate de que `package.json` tenga el script de build:
```json
"scripts": {
  "build:web": "expo export:web"
}
```

### 2. Configurar Cloudflare Pages

1. **Ve a Cloudflare Dashboard:**
   - https://dash.cloudflare.com
   - Ve a "Workers & Pages" → "Pages"

2. **Crear nuevo proyecto:**
   - Click en "Create a project"
   - Selecciona "Connect to Git"
   - Autoriza Cloudflare a acceder a tu repositorio de GitHub
   - Selecciona el repositorio: `AlbertoftheRivers/TuPonesYoComo`

3. **Configurar el build:**
   - **Framework preset:** None (o "Other")
   - **Build command:** `npm install && npm run build:web`
   - **Build output directory:** `web-build`
   - **Root directory:** `/` (dejar vacío)

4. **Variables de entorno (opcional):**
   - Si necesitas variables de entorno, agrégalas en "Environment variables"
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_API_BASE_URL`

5. **Configurar dominio personalizado:**
   - Ve a "Custom domains"
   - Agrega: `tuponesyocomo.uk` o `www.tuponesyocomo.uk`
   - Cloudflare configurará automáticamente el DNS

### 3. Desplegar

- Cloudflare automáticamente construirá y desplegará tu PWA
- Cada push a `main` desplegará automáticamente una nueva versión
- La URL será: `https://[nombre-proyecto].pages.dev` o tu dominio personalizado

### 4. Para usuarios de iPhone

1. Abrir Safari (no Chrome)
2. Ir a `https://tuponesyocomo.uk`
3. Tocar el botón "Compartir" (cuadrado con flecha)
4. Seleccionar "Añadir a pantalla de inicio"
5. La app aparecerá como icono en la pantalla de inicio

## Notas importantes

- Cloudflare Pages es **gratis** para proyectos personales
- Builds automáticos en cada push a GitHub
- HTTPS automático
- CDN global incluido
- No necesitas configurar Nginx ni servidor

