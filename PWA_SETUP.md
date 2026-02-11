# 📱 Configurar PWA para iOS (Sin App Store)

## ✅ Configuración Completada

Ya he agregado la configuración PWA en `app.json`. Ahora necesitas:

## 📦 Paso 1: Construir la versión Web

```bash
npx expo export:web
```

O si esa opción no está disponible:

```bash
npx expo export -p web
```

Esto creará una carpeta `web-build/` con todos los archivos estáticos.

## 🌐 Paso 2: Desplegar la Web App

Tienes varias opciones:

### Opción A: Cloudflare Pages (Recomendado - Gratis)

1. Ve a: https://pages.cloudflare.com
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Build command:** `npm install && npx expo export:web`
   - **Build output directory:** `web-build`
   - **Root directory:** `/`
4. Despliega

Tu app estará disponible en: `https://tuponesyocomo.pages.dev` (o tu dominio personalizado)

### Opción B: Netlify (Gratis)

1. Ve a: https://www.netlify.com
2. Arrastra la carpeta `web-build/` o conecta GitHub
3. Configura build:
   - **Build command:** `npm install && npx expo export:web`
   - **Publish directory:** `web-build`
4. Despliega

### Opción C: Tu Servidor Proxmox

1. Copia la carpeta `web-build/` a tu servidor
2. Configura Nginx o Caddy para servir los archivos estáticos
3. Accede desde `https://tuponesyocomo.uk` (o tu dominio)

## 📱 Paso 3: Instalar en iOS

Una vez desplegada:

1. Abre Safari en iPhone/iPad
2. Ve a la URL de tu PWA (ej: `https://tuponesyocomo.uk`)
3. Toca el botón **Compartir** (cuadrado con flecha)
4. Selecciona **"Añadir a pantalla de inicio"**
5. La app aparecerá como un icono en tu pantalla de inicio
6. Funciona como una app nativa (sin App Store)

## ⚙️ Configuración Adicional

### HTTPS Requerido

**IMPORTANTE:** Las PWAs requieren HTTPS. Asegúrate de que:
- Cloudflare Pages/Netlify ya tienen HTTPS automático
- Si usas tu servidor, configura SSL (Let's Encrypt es gratis)

### Service Worker (Opcional)

Expo genera automáticamente un service worker para caché offline. No necesitas configurarlo manualmente.

## 🎯 Ventajas de PWA

✅ **Gratis** - No necesitas cuenta de Apple Developer  
✅ **Fácil de actualizar** - Solo actualizas el código y se refleja automáticamente  
✅ **Funciona offline** - Con service worker  
✅ **Se instala como app nativa** - Icono en pantalla de inicio  
✅ **Funciona en Android también** - Mismo código para ambos  

## ⚠️ Limitaciones

❌ **Algunas funcionalidades nativas pueden no funcionar:**
- Notificaciones push (limitadas en iOS)
- Acceso completo a cámara/micrófono (requiere permisos del navegador)
- Algunas APIs nativas pueden no estar disponibles

## 🚀 Próximos Pasos

1. Ejecuta `npx expo export:web`
2. Elige una plataforma de hosting (Cloudflare Pages recomendado)
3. Despliega
4. Comparte la URL con usuarios de iOS
5. Ellos pueden instalarla desde Safari

## 📝 Nota

La PWA funcionará mejor si:
- Tienes HTTPS configurado
- El manifest.json está correctamente configurado (ya está en app.json)
- Los iconos están en los tamaños correctos (192x192 y 512x512)



