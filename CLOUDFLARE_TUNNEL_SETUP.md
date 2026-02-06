# 🚀 Guía Paso a Paso: Configurar Cloudflare Tunnel

## 📋 Requisitos Previos

- ✅ Servidor Proxmox con el backend API corriendo
- ✅ Acceso SSH a tu servidor Proxmox
- ✅ Backend API corriendo en `localhost:3000` (o el puerto que uses)
- ✅ Cuenta de email (para crear cuenta en Cloudflare)

---

## 🎯 Paso 1: Crear Cuenta en Cloudflare (Gratis)

1. Ve a: https://dash.cloudflare.com/sign-up
2. Crea una cuenta (gratis)
3. Verifica tu email

**Tiempo estimado:** 2 minutos

---

## 🎯 Paso 2: Agregar tu Dominio (Opcional pero Recomendado)

### Opción A: Usar un Dominio que ya Tienes

1. En Cloudflare Dashboard, haz clic en "Add a Site"
2. Ingresa tu dominio (ej: `tuponesyocomo.com`)
3. Cloudflare escaneará tus DNS
4. Sigue las instrucciones para cambiar tus nameservers
5. Espera a que se active (puede tomar algunas horas)

### Opción B: Usar un Subdominio Gratis de Cloudflare

Cloudflare ofrece subdominios gratuitos. Puedes usar algo como:
- `tuponesyocomo.cf` (gratis)
- O usar un dominio que ya tengas

### Opción C: Usar Solo IP (No Recomendado)

Puedes usar Cloudflare Tunnel sin dominio, pero es menos seguro y más difícil de recordar.

**Recomendación:** Usa un dominio o subdominio.

**Tiempo estimado:** 5-30 minutos (depende si tienes dominio o no)

---

## 🎯 Paso 3: Instalar Cloudflared en tu Servidor Proxmox

### Conecta por SSH a tu servidor Proxmox:

```bash
ssh usuario@tu-proxmox-ip
```

### Descargar e Instalar Cloudflared:

**Para Linux (Proxmox es Debian/Ubuntu):**

```bash
# Descargar la última versión
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Hacer ejecutable
chmod +x cloudflared-linux-amd64

# Mover a un lugar en el PATH
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Verificar instalación
cloudflared --version
```

**Tiempo estimado:** 2 minutos

---

## 🎯 Paso 4: Autenticar Cloudflared con tu Cuenta

```bash
# Iniciar sesión en Cloudflare
cloudflared tunnel login
```

Esto:
1. Abrirá tu navegador
2. Te pedirá que inicies sesión en Cloudflare
3. Te pedirá que selecciones el dominio/sitio
4. Autorizará el tunnel

**Tiempo estimado:** 1 minuto

---

## 🎯 Paso 5: Crear el Tunnel

```bash
# Crear un nuevo tunnel
cloudflared tunnel create tuponesyocomo-api
```

Esto creará un tunnel llamado `tuponesyocomo-api` y guardará las credenciales.

**Tiempo estimado:** 10 segundos

---

## 🎯 Paso 6: Configurar el Tunnel

### Crear archivo de configuración:

```bash
# Crear directorio de configuración
mkdir -p ~/.cloudflared

# Crear archivo de configuración
nano ~/.cloudflared/config.yml
```

### Contenido del archivo `config.yml`:

```yaml
tunnel: tuponesyocomo-api
credentials-file: /home/tu-usuario/.cloudflared/[UUID].json

ingress:
  # Redirigir tráfico HTTP a tu backend API
  - hostname: api.tuponesyocomo.com
    service: http://localhost:3000
  
  # Capturar todo lo demás (404)
  - service: http_status:404
```

**Nota:** Reemplaza:
- `tu-usuario` con tu usuario de Proxmox
- `[UUID]` con el UUID que aparece después de crear el tunnel (está en `~/.cloudflared/`)
- `api.tuponesyocomo.com` con tu dominio o subdominio

**Para encontrar el UUID:**
```bash
ls ~/.cloudflared/
# Verás algo como: [UUID].json
```

**Tiempo estimado:** 5 minutos

---

## 🎯 Paso 7: Configurar DNS en Cloudflare

### Opción A: Si tienes dominio en Cloudflare

```bash
# Crear registro DNS que apunta al tunnel
cloudflared tunnel route dns tuponesyocomo-api api.tuponesyocomo.com
```

Esto creará automáticamente un registro CNAME en Cloudflare.

### Opción B: Configuración Manual en Dashboard

1. Ve a Cloudflare Dashboard → Tu dominio → DNS
2. Agrega un registro:
   - **Tipo:** CNAME
   - **Nombre:** `api` (o el subdominio que quieras)
   - **Target:** `[UUID].cfargotunnel.com` (el UUID del tunnel)
   - **Proxy:** ✅ Proxied (naranja)

**Tiempo estimado:** 2 minutos

---

## 🎯 Paso 8: Probar el Tunnel

### Ejecutar el tunnel manualmente primero:

```bash
cloudflared tunnel run tuponesyocomo-api
```

Deberías ver algo como:
```
2024-01-01T12:00:00Z INF Starting metrics server
2024-01-01T12:00:00Z INF +--------------------------------------------------------------------------------------------+
2024-01-01T12:00:00Z INF |  Your quick Tunnel has been created! Visit it:                                               |
2024-01-01T12:00:00Z INF |  https://api.tuponesyocomo.com                                                              |
2024-01-01T12:00:00Z INF +--------------------------------------------------------------------------------------------+
```

### Probar desde otro dispositivo:

```bash
# Desde tu computadora o teléfono
curl https://api.tuponesyocomo.com/health
```

Deberías ver la respuesta de tu backend API.

**Tiempo estimado:** 2 minutos

---

## 🎯 Paso 9: Configurar como Servicio (Para que Corra Siempre)

### Crear archivo de servicio systemd:

```bash
sudo nano /etc/systemd/system/cloudflared.service
```

### Contenido del archivo:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=tu-usuario
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/tu-usuario/.cloudflared/config.yml run tuponesyocomo-api
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

**Reemplaza `tu-usuario` con tu usuario de Proxmox.**

### Activar y Iniciar el servicio:

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar para que inicie al arrancar
sudo systemctl enable cloudflared

# Iniciar el servicio
sudo systemctl start cloudflared

# Verificar que está corriendo
sudo systemctl status cloudflared
```

Deberías ver `active (running)`.

**Tiempo estimado:** 3 minutos

---

## 🎯 Paso 10: Actualizar la App Móvil

### Actualizar la URL del Backend en la App:

1. **Opción A: Actualizar `.env` y rebuild:**

```env
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.com
```

Luego rebuild el APK:
```bash
eas build --profile production --platform android
```

2. **Opción B: Hardcodear en el código (temporal):**

```typescript
// src/lib/ollama.ts
const API_BASE_URL = 'https://api.tuponesyocomo.com';
```

**Tiempo estimado:** 5 minutos

---

## ✅ Verificación Final

### 1. Verificar que el tunnel está corriendo:

```bash
sudo systemctl status cloudflared
```

### 2. Verificar logs:

```bash
sudo journalctl -u cloudflared -f
```

### 3. Probar desde Internet:

```bash
# Desde cualquier dispositivo con Internet
curl https://api.tuponesyocomo.com/health
```

Deberías ver:
```json
{
  "status": "ok",
  "ollama_url": "http://192.168.200.45:11434",
  "model": "llama3.2:3b"
}
```

### 4. Probar desde la app móvil:

- Instala el APK actualizado
- Intenta crear una receta con IA
- Debería funcionar desde cualquier lugar

---

## 🔧 Troubleshooting

### Problema: "Tunnel not found"

**Solución:**
```bash
# Listar tunnels
cloudflared tunnel list

# Verificar que el nombre coincide
cloudflared tunnel run tuponesyocomo-api
```

### Problema: "Connection refused"

**Solución:**
```bash
# Verificar que el backend está corriendo
curl http://localhost:3000/health

# Si no responde, inicia el backend
cd /ruta/al/backend
docker-compose up -d
```

### Problema: "DNS not resolving"

**Solución:**
```bash
# Verificar DNS
nslookup api.tuponesyocomo.com

# Si no resuelve, espera unos minutos (DNS puede tardar)
# O verifica en Cloudflare Dashboard → DNS
```

### Problema: "Service unavailable"

**Solución:**
```bash
# Verificar logs del tunnel
sudo journalctl -u cloudflared -n 50

# Verificar que el puerto 3000 está accesible localmente
netstat -tulpn | grep 3000
```

---

## 📊 Comandos Útiles

```bash
# Ver estado del servicio
sudo systemctl status cloudflared

# Ver logs en tiempo real
sudo journalctl -u cloudflared -f

# Reiniciar el servicio
sudo systemctl restart cloudflared

# Detener el servicio
sudo systemctl stop cloudflared

# Listar todos los tunnels
cloudflared tunnel list

# Eliminar un tunnel
cloudflared tunnel delete tuponesyocomo-api
```

---

## 🎯 Resumen de Pasos

1. ✅ Crear cuenta Cloudflare (2 min)
2. ✅ Agregar dominio (5-30 min)
3. ✅ Instalar cloudflared (2 min)
4. ✅ Autenticar (1 min)
5. ✅ Crear tunnel (10 seg)
6. ✅ Configurar tunnel (5 min)
7. ✅ Configurar DNS (2 min)
8. ✅ Probar (2 min)
9. ✅ Configurar como servicio (3 min)
10. ✅ Actualizar app (5 min)

**Tiempo total:** ~30-60 minutos

---

## 🎉 ¡Listo!

Una vez completado, tu backend API será accesible desde Internet en:
```
https://api.tuponesyocomo.com
```

Y todos los usuarios con el APK podrán usar la app desde cualquier lugar del mundo.

---

¿Necesitas ayuda con algún paso específico? Puedo guiarte paso a paso.

