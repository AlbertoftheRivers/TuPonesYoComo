# 🚀 Cloudflare Tunnel - Guía Rápida (5 Pasos)

## ⚠️ IMPORTANTE: No necesitas instalar el código en Cloudflare

**Cloudflare Tunnel solo necesita:**
- Tu backend API corriendo en Proxmox (puerto 3000)
- Cloudflared instalado en Proxmox
- Configurar el tunnel para apuntar a `localhost:3000`

---

## 📝 Paso 1: Crear Cuenta en Cloudflare (2 minutos)

1. Ve a: https://dash.cloudflare.com/sign-up
2. Crea cuenta gratis
3. Verifica tu email

**Listo. Siguiente paso.**

---

## 📝 Paso 2: Instalar Cloudflared en Proxmox (2 minutos)

**Conéctate por SSH a tu servidor Proxmox:**

```bash
ssh usuario@tu-ip-proxmox
```

**Luego ejecuta:**

```bash
# Descargar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Hacer ejecutable
chmod +x cloudflared-linux-amd64

# Mover a /usr/local/bin
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Verificar
cloudflared --version
```

**Listo. Siguiente paso.**

---

## 📝 Paso 3: Autenticar y Crear Tunnel (3 minutos)

**En tu servidor Proxmox, ejecuta:**

```bash
# 1. Autenticar (abrirá tu navegador)
cloudflared tunnel login

# 2. Crear el tunnel
cloudflared tunnel create tuponesyocomo-api

# 3. Ver el UUID del tunnel (lo necesitarás)
cloudflared tunnel list
```

**Anota el UUID que aparece (algo como: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)**

**Listo. Siguiente paso.**

---

## 📝 Paso 4: Configurar el Tunnel (5 minutos)

**Crear archivo de configuración:**

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

**Pega esto (reemplaza `[UUID]` con el UUID que anotaste):**

```yaml
tunnel: tuponesyocomo-api
credentials-file: /home/tu-usuario/.cloudflared/[UUID].json

ingress:
  - hostname: api.tuponesyocomo.com
    service: http://localhost:3000
  - service: http_status:404
```

**Para encontrar el UUID exacto:**
```bash
ls ~/.cloudflared/
# Verás algo como: a1b2c3d4-e5f6-7890-abcd-ef1234567890.json
# Usa ese nombre completo en credentials-file
```

**Guardar:** `Ctrl+X`, luego `Y`, luego `Enter`

**Listo. Siguiente paso.**

---

## 📝 Paso 5: Configurar DNS y Probar (3 minutos)

**Opción A: Automático (más fácil)**

```bash
cloudflared tunnel route dns tuponesyocomo-api api.tuponesyocomo.com
```

**Opción B: Manual en Cloudflare Dashboard**

1. Ve a: https://dash.cloudflare.com
2. Selecciona tu dominio (o crea uno si no tienes)
3. Ve a **DNS** → **Records**
4. Agrega:
   - **Type:** CNAME
   - **Name:** `api`
   - **Target:** `[UUID].cfargotunnel.com` (el UUID del tunnel)
   - **Proxy status:** ✅ Proxied (naranja)

**Probar:**

```bash
# Ejecutar el tunnel
cloudflared tunnel run tuponesyocomo-api
```

**Deberías ver:**
```
Your quick Tunnel has been created! Visit it:
https://api.tuponesyocomo.com
```

**Abre otra terminal y prueba:**
```bash
curl https://api.tuponesyocomo.com/health
```

**Si funciona, ve al Paso 6. Si no, revisa que tu backend esté corriendo en puerto 3000.**

---

## 📝 Paso 6: Configurar como Servicio (Para que corra siempre) (3 minutos)

**Crear servicio:**

```bash
sudo nano /etc/systemd/system/cloudflared.service
```

**Pega esto (reemplaza `tu-usuario` con tu usuario de Proxmox):**

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

**Activar:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

**Deberías ver `active (running)` ✅**

---

## ✅ ¡Listo!

Tu backend API ahora es accesible en:
```
https://api.tuponesyocomo.com
```

**Próximo paso:** Actualizar tu app móvil para usar esta URL.

---

## 🔧 Si algo falla:

**Ver logs:**
```bash
sudo journalctl -u cloudflared -f
```

**Verificar que el backend está corriendo:**
```bash
curl http://localhost:3000/health
```

**Reiniciar el servicio:**
```bash
sudo systemctl restart cloudflared
```

---

¿En qué paso estás? ¿Necesitas ayuda con alguno específico?

