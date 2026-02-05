# Verificar Acceso de Red - Expo Ya Está Escuchando Correctamente

## ✅ Buenas Noticias

El comando `sudo lsof -i :8082` muestra:
```
TCP *:8082 (LISTEN)
```

El `*` significa que está escuchando en **TODAS las interfaces** (0.0.0.0), no solo localhost. ✅

## 🔍 Verificaciones

### 1. Verificar Firewall

```bash
sudo ufw status
```

**Debe mostrar:**
```
8082/tcp                     ALLOW       Anywhere
```

**Si no está, agregarlo:**
```bash
sudo ufw allow 8082/tcp
sudo ufw allow 19000:19002/tcp
```

### 2. Verificar IP del Servidor

```bash
hostname -I
```

**Anota la IP** (ejemplo: `192.168.200.44`)

### 3. Probar desde el Servidor

```bash
# Desde el servidor mismo
curl http://localhost:8082
curl http://192.168.200.44:8082
```

**Ambos deberían funcionar.**

### 4. Probar desde tu Laptop/PC

**En tu máquina Windows, abre PowerShell o CMD y ejecuta:**
```powershell
curl http://192.168.200.44:8082
```

**O abre el navegador y ve a:**
```
http://192.168.200.44:8082
```

**Deberías ver la página de Expo DevTools.**

### 5. Verificar que el Teléfono Está en la Misma Red

**En tu teléfono:**
- Configuración Wi-Fi
- Verifica que estás conectado a la misma red que el servidor

### 6. Probar desde el Navegador del Teléfono

**En el navegador del teléfono, ve a:**
```
http://192.168.200.44:8082
```

**Deberías ver la página de Expo DevTools.**

**Si esto NO funciona:**
- El problema es de red/firewall
- Verifica que el teléfono y servidor están en la misma red
- Verifica el firewall del servidor

**Si esto SÍ funciona:**
- El problema es con Expo Go
- Sigue con el paso 7

### 7. Conectar desde Expo Go

**En Expo Go:**
1. Toca "Enter URL manually"
2. Escribe:
   ```
   exp://192.168.200.44:8082
   ```
   (Reemplaza con la IP real de tu servidor)

**Si no funciona, prueba también:**
```
exp://192.168.200.44:8082?dev=true
```

### 8. Verificar Logs de Expo

**En el servidor:**
```bash
sudo journalctl -u tuponesyocomo-expo -f
```

**Intenta conectar desde Expo Go y mira si aparecen logs de conexión.**

---

## 🔧 Soluciones Comunes

### Problema: "Cannot connect" en Expo Go

**Solución 1: Verificar formato de URL**
- Debe ser: `exp://192.168.200.44:8082`
- NO usar: `http://` o `https://`
- NO usar: `exp://192.168.200.44:8082/`

**Solución 2: Agregar parámetros**
```
exp://192.168.200.44:8082?dev=true&hot=false
```

**Solución 3: Verificar que Metro está listo**
```bash
sudo journalctl -u tuponesyocomo-expo -n 20
```

**Debe mostrar algo como:**
```
Metro waiting on http://192.168.200.44:8082
```

Si muestra `localhost`, el problema es la configuración.

### Problema: Firewall bloqueando

```bash
# Ver reglas actuales
sudo ufw status numbered

# Agregar reglas específicas
sudo ufw allow from 192.168.0.0/16 to any port 8082
sudo ufw allow from 192.168.200.0/24 to any port 8082
```

### Problema: Red diferente

**Si el teléfono está en una red diferente (por ejemplo, móvil vs Wi-Fi):**
- Asegúrate de que ambos están en la misma red Wi-Fi
- O usa un túnel (más complejo)

---

## 📋 Checklist Final

- [ ] Expo está escuchando en `*:8082` (verificado con `lsof`)
- [ ] Firewall permite puerto 8082
- [ ] IP del servidor es correcta
- [ ] Teléfono y servidor en la misma red Wi-Fi
- [ ] Navegador del teléfono puede acceder a `http://IP:8082`
- [ ] URL en Expo Go es `exp://IP:8082` (sin http, sin trailing slash)
- [ ] Logs de Expo muestran actividad cuando intentas conectar

---

## 🚨 Si Nada Funciona

**Probar con tunnel mode (requiere cuenta Expo):**
```bash
sudo nano /etc/systemd/system/tuponesyocomo-expo.service
```

**Cambiar a:**
```ini
ExecStart=/bin/bash -c 'cd /opt/apps/TuPonesYoComo && REACT_NATIVE_PACKAGER_HOSTNAME=192.168.200.44 EXPO_PORT=8082 npx expo start --tunnel --port 8082'
```

**Luego reiniciar:**
```bash
sudo systemctl daemon-reload
sudo systemctl restart tuponesyocomo-expo
```

**Esto creará un túnel público, pero requiere cuenta Expo y puede ser más lento.**

