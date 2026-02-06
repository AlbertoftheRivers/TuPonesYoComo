# Guía para Compartir TuPonesYoComo con Otros Usuarios

## 📱 Arquitectura Actual

```
Usuario 1 (Teléfono) ──┐
Usuario 2 (Teléfono) ──┤
Usuario 3 (Teléfono) ──┼──→ Backend API (Proxmox) ──→ Ollama (VPN: 192.168.200.45)
                        │
                        └──→ Supabase (Cloud - Ya Público)
```

## 🔍 Componentes y su Accesibilidad

### ✅ Ya Públicos (No necesitas hacer nada)
- **Supabase**: Ya es público en la nube, cualquier usuario puede acceder
- **Mobile App**: Una vez que compartes el APK, cualquier usuario puede instalarlo

### ⚠️ Necesita ser Público para Compartir
- **Backend API**: Actualmente solo accesible desde tu red local/VPN
  - **Problema**: Otros usuarios no pueden alcanzarlo
  - **Solución**: Hacer el backend accesible desde Internet

### 🔒 Privado (No debe ser público)
- **Ollama Server**: Debe quedarse privado, solo accesible por VPN
  - **Razón**: Es tu servidor privado, no quieres exponerlo directamente

---

## 🎯 Opciones para Hacer el Backend Público

### Opción 1: Reverse Proxy con Nginx/Caddy (Recomendado) ⭐

**Cómo funciona:**
- Nginx/Caddy corre en tu Proxmox (o en otro servidor)
- Recibe peticiones públicas en un dominio (ej: `api.tuponesyocomo.com`)
- Redirige las peticiones al backend API (que sigue siendo privado)
- El backend mantiene acceso VPN a Ollama

**Ventajas:**
- ✅ Seguro (puedes agregar autenticación, rate limiting)
- ✅ Usa HTTPS (SSL/TLS)
- ✅ El backend sigue siendo privado
- ✅ Control total

**Configuración:**
```nginx
# Ejemplo Nginx
server {
    listen 80;
    server_name api.tuponesyocomo.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Pasos:**
1. Instalar Nginx/Caddy en Proxmox
2. Configurar dominio (o usar IP pública)
3. Configurar SSL con Let's Encrypt (gratis)
4. Configurar reverse proxy al backend
5. Abrir puerto 80/443 en firewall

---

### Opción 2: Cloudflare Tunnel (Muy Fácil) ⭐⭐

**Cómo funciona:**
- Cloudflare Tunnel crea un túnel seguro desde tu Proxmox a Cloudflare
- No necesitas abrir puertos en tu firewall
- Cloudflare maneja el SSL y el dominio
- Gratis para uso personal

**Ventajas:**
- ✅ Muy fácil de configurar
- ✅ No necesitas abrir puertos
- ✅ SSL automático
- ✅ DDoS protection incluido
- ✅ Gratis

**Pasos:**
1. Crear cuenta en Cloudflare (gratis)
2. Instalar `cloudflared` en Proxmox
3. Crear tunnel: `cloudflared tunnel create tuponesyocomo`
4. Configurar: `cloudflared tunnel route dns tuponesyocomo api.tuponesyocomo.com`
5. Conectar: `cloudflared tunnel run tuponesyocomo`

**URL resultante:** `https://api.tuponesyocomo.com` (gratis)

---

### Opción 3: Port Forwarding (Simple pero Menos Seguro)

**Cómo funciona:**
- Abres un puerto en tu router (ej: 3000)
- Rediriges ese puerto al contenedor del backend
- Los usuarios acceden con tu IP pública: `http://tu-ip-publica:3000`

**Ventajas:**
- ✅ Muy simple
- ✅ No requiere servicios externos

**Desventajas:**
- ❌ Menos seguro (sin SSL por defecto)
- ❌ IP pública puede cambiar
- ❌ Expone tu red directamente

**Pasos:**
1. Obtener IP pública: `curl ifconfig.me`
2. Configurar port forwarding en router: `Puerto externo 3000 → IP Proxmox:3000`
3. Configurar firewall en Proxmox para permitir puerto 3000
4. Usar URL: `http://tu-ip-publica:3000`

---

### Opción 4: VPS/Cloud Hosting (Más Costo)

**Cómo funciona:**
- Mueves el backend a un VPS (DigitalOcean, Linode, etc.)
- El VPS tiene acceso VPN a tu Ollama
- El VPS es público por defecto

**Ventajas:**
- ✅ Separación de infraestructura
- ✅ Más control
- ✅ Mejor para escalar

**Desventajas:**
- ❌ Costo mensual (~$5-10/mes)
- ❌ Más complejo de mantener

---

## 🔐 Consideraciones de Seguridad

### Si haces el backend público, considera:

1. **Rate Limiting**: Limitar peticiones por IP
   ```javascript
   // En backend/server.js
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutos
     max: 100 // 100 peticiones por IP
   });
   app.use('/api/', limiter);
   ```

2. **Autenticación Básica** (Opcional):
   - Agregar API key simple
   - O autenticación JWT

3. **HTTPS**: Siempre usar SSL/TLS
   - Cloudflare Tunnel: Automático
   - Nginx: Let's Encrypt (gratis)
   - Port Forwarding: Necesitas configurar SSL manualmente

4. **Firewall**: Solo exponer el puerto necesario

---

## 📦 Cómo Compartir la App

### Paso 1: Construir APK

```bash
# Con EAS Build
eas build --profile production --platform android

# O build local
npx expo prebuild
cd android && ./gradlew assembleRelease
```

### Paso 2: Configurar URL del Backend en la App

**Opción A: Hardcodear URL en el código** (No recomendado)
```typescript
// src/lib/ollama.ts
const API_BASE_URL = 'https://api.tuponesyocomo.com';
```

**Opción B: Configuración en tiempo de ejecución** (Mejor)
- Agregar pantalla de configuración en la app
- Permitir que usuarios ingresen la URL del backend
- Guardar en AsyncStorage

**Opción C: Builds separados** (Mejor para producción)
- Crear diferentes builds con diferentes URLs
- Compartir el build correspondiente

### Paso 3: Compartir el APK

1. **Subir a Google Drive/Dropbox**: Compartir link
2. **Hosting propio**: Subir a tu servidor web
3. **Instalación directa**: Transferir por USB/Bluetooth

**Nota Android**: Los usuarios necesitan permitir "Instalar apps de fuentes desconocidas"

---

## 🎯 Escenarios de Uso

### Escenario 1: Solo para ti
- ✅ Backend en red local
- ✅ App con URL local: `http://192.168.1.2:3000`
- ✅ No necesitas hacer nada público

### Escenario 2: Familia/Amigos cercanos (5-10 personas)
- ✅ Cloudflare Tunnel (gratis, fácil)
- ✅ URL: `https://api.tuponesyocomo.com`
- ✅ Compartir APK por WhatsApp/Email
- ✅ Rate limiting básico

### Escenario 3: Público (muchos usuarios)
- ✅ Cloudflare Tunnel o VPS
- ✅ Rate limiting estricto
- ✅ Monitoreo de uso
- ✅ Posible autenticación
- ✅ Considerar costos de Ollama (CPU/GPU)

---

## 🚀 Recomendación Rápida

**Para compartir con familia/amigos:**

1. **Usa Cloudflare Tunnel** (5 minutos de setup)
   ```bash
   # En Proxmox
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   chmod +x cloudflared-linux-amd64
   ./cloudflared-linux-amd64 tunnel create tuponesyocomo
   ./cloudflared-linux-amd64 tunnel route dns tuponesyocomo api.tuponesyocomo.com
   ./cloudflared-linux-amd64 tunnel run tuponesyocomo
   ```

2. **Actualizar app con URL pública**
   - Cambiar `EXPO_PUBLIC_API_BASE_URL` a `https://api.tuponesyocomo.com`
   - Rebuild APK

3. **Compartir APK**
   - Subir a Google Drive
   - Compartir link

**Resultado:** Cualquier usuario puede instalar la app y usarla desde cualquier lugar del mundo.

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito cambiar algo en Supabase?**
R: No, Supabase ya es público. Solo necesitas hacer público el backend API.

**P: ¿Puedo limitar quién usa mi backend?**
R: Sí, puedes agregar autenticación o rate limiting por IP.

**P: ¿Cuánto cuesta Cloudflare Tunnel?**
R: Gratis para uso personal. Solo pagas si necesitas features avanzadas.

**P: ¿Qué pasa si mi IP pública cambia?**
R: Con Cloudflare Tunnel o dominio, no importa. Con port forwarding, sí necesitarías actualizar.

**P: ¿Es seguro exponer mi backend?**
R: Sí, si usas HTTPS y rate limiting. El backend solo hace proxy a Ollama, no expone datos sensibles directamente.

---

¿Quieres que configuremos Cloudflare Tunnel ahora? Es la opción más fácil y segura.

