# 🏗️ Arquitectura del Sistema TuPonesYoComo

## 📐 Diagrama Completo de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERNET (Público)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        │                                                           │
        │                    ☁️ CLOUDFLARE TUNNEL                  │
        │                    (Público - Gratis)                    │
        │                                                           │
        │  • DDoS Protection                                       │
        │  • SSL/TLS Automático                                     │
        │  • WAF (Web Application Firewall)                         │
        │  • Rate Limiting                                          │
        │  • IP Masking (oculta tu IP real)                        │
        └───────────────────────────┬───────────────────────────┘
                                    │
                                    │ Túnel Seguro
                                    │
┌───────────────────────────────────┴───────────────────────────────────┐
│                    TU SERVIDOR PROXMOX (Privado)                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  🔒 RED PRIVADA (192.168.x.x)                                │    │
│  │                                                               │    │
│  │  ┌────────────────────────────────────────────────────┐     │    │
│  │  │  🐳 CONTENEDOR: Backend API (Node.js/Express)      │     │    │
│  │  │  Puerto: 3000 (Solo accesible localmente)          │     │    │
│  │  │                                                      │     │    │
│  │  │  Funciones:                                          │     │    │
│  │  │  • /api/analyze-recipe → Ollama                      │     │    │
│  │  │  • /api/transcribe → Whisper                         │     │    │
│  │  │  • /api/ocr → Tesseract.js                           │     │    │
│  │  │                                                      │     │    │
│  │  │  🔐 PRIVADO: Solo accesible desde Cloudflare Tunnel │     │    │
│  │  └────────────────────────────────────────────────────┘     │    │
│  │                                                               │    │
│  │  ┌────────────────────────────────────────────────────┐     │    │
│  │  │  🤖 Ollama LLM Server                               │     │    │
│  │  │  IP: 192.168.200.45:11434                           │     │    │
│  │  │                                                      │     │    │
│  │  │  🔐 PRIVADO: Solo accesible por VPN                 │     │    │
│  │  │  • Backend API accede por VPN                       │     │    │
│  │  │  • NO expuesto a Internet                           │     │    │
│  │  └────────────────────────────────────────────────────┘     │    │
│  │                                                               │    │
│  │  ┌────────────────────────────────────────────────────┐     │    │
│  │  │  🎤 Whisper (Speech-to-Text)                        │     │    │
│  │  │  Instalado en el contenedor del Backend            │     │    │
│  │  │                                                      │     │    │
│  │  │  🔐 PRIVADO: Solo accesible desde Backend API       │     │    │
│  │  └────────────────────────────────────────────────────┘     │    │
│  │                                                               │    │
│  │  ┌────────────────────────────────────────────────────┐     │    │
│  │  │  📷 Tesseract.js (OCR)                              │     │    │
│  │  │  Instalado en el contenedor del Backend            │     │    │
│  │  │                                                      │     │    │
│  │  │  🔐 PRIVADO: Solo accesible desde Backend API       │     │    │
│  │  └────────────────────────────────────────────────────┘     │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS (Público)
                                    │
┌───────────────────────────────────┴───────────────────────────────────┐
│                    ☁️ SUPABASE (Cloud - Público)                       │
│                                                                         │
│  • PostgreSQL Database                                                 │
│  • API REST Pública                                                    │
│  • Row Level Security (RLS) deshabilitado                              │
│  • Accesible desde cualquier lugar                                     │
│                                                                         │
│  🔓 PÚBLICO: Cualquier usuario con las credenciales puede acceder      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS (Público)
                                    │
┌───────────────────────────────────┴───────────────────────────────────┐
│                    📱 DISPOSITIVOS MÓVILES (Usuarios)                  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │  📱 Usuario 1│  │  📱 Usuario 2│  │  📱 Usuario 3│                │
│  │  (Tu teléfono)│  │  (Amigo)    │  │  (Familia)   │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                         │
│  App TuPonesYoComo instalada (APK)                                     │
│                                                                         │
│  Conexiones:                                                           │
│  • → Cloudflare Tunnel → Backend API (para IA, OCR, Whisper)          │
│  • → Supabase directamente (para CRUD de recetas)                      │
│                                                                         │
│  🔓 PÚBLICO: Cualquier usuario con el APK puede usar la app           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Resumen: Privado vs Público

### 🔒 **PRIVADO** (No accesible desde Internet)

1. **Tu Servidor Proxmox**
   - Solo accesible desde tu red local o VPN
   - No expuesto directamente a Internet

2. **Backend API (Puerto 3000)**
   - Solo accesible localmente en Proxmox
   - Accesible desde Internet SOLO a través de Cloudflare Tunnel
   - No tiene IP pública directa

3. **Ollama LLM Server (192.168.200.45:11434)**
   - **Completamente privado**
   - Solo accesible por VPN
   - Backend API accede por VPN interna
   - **NUNCA expuesto a Internet**

4. **Whisper y Tesseract.js**
   - Ejecutados dentro del contenedor del Backend
   - Solo accesibles desde el Backend API
   - No expuestos directamente

### 🔓 **PÚBLICO** (Accesible desde Internet)

1. **Cloudflare Tunnel**
   - Punto de entrada público
   - URL: `https://api.tuponesyocomo.com` (ejemplo)
   - Protegido por Cloudflare (DDoS, WAF, SSL)

2. **Supabase**
   - Completamente público en la nube
   - URL: `https://tu-proyecto.supabase.co`
   - Accesible desde cualquier lugar con credenciales

3. **App Móvil (APK)**
   - Una vez compartido, cualquier usuario puede instalarlo
   - Se conecta a servicios públicos (Cloudflare Tunnel y Supabase)

---

## 🔄 Flujo de Datos

### Escenario 1: Usuario crea una receta con IA

```
📱 App Móvil
    │
    ├─→ 1. Texto de receta ingresado
    │
    ├─→ 2. POST https://api.tuponesyocomo.com/api/analyze-recipe
    │       │
    │       └─→ ☁️ Cloudflare Tunnel (Público)
    │              │
    │              └─→ 🔒 Backend API (Privado en Proxmox)
    │                     │
    │                     └─→ 🔒 Ollama por VPN (192.168.200.45)
    │                            │
    │                            └─→ Respuesta JSON con ingredientes, pasos, etc.
    │
    └─→ 3. Guardar receta en Supabase
           │
           └─→ ☁️ Supabase (Público)
                  │
                  └─→ ✅ Receta guardada en PostgreSQL
```

### Escenario 2: Usuario lista recetas

```
📱 App Móvil
    │
    └─→ GET https://tu-proyecto.supabase.co/rest/v1/recipes
           │
           └─→ ☁️ Supabase (Público)
                  │
                  └─→ ✅ Devuelve lista de recetas
```

### Escenario 3: Usuario usa dictado por voz

```
📱 App Móvil
    │
    ├─→ 1. Graba audio
    │
    ├─→ 2. POST https://api.tuponesyocomo.com/api/transcribe
    │       │
    │       └─→ ☁️ Cloudflare Tunnel (Público)
    │              │
    │              └─→ 🔒 Backend API (Privado)
    │                     │
    │                     └─→ 🔒 Whisper (en el contenedor)
    │                            │
    │                            └─→ ✅ Texto transcrito
```

---

## 🛡️ Capas de Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 1: Cloudflare (Público)                               │
│  • DDoS Protection                                           │
│  • WAF (Web Application Firewall)                            │
│  • Rate Limiting                                             │
│  • SSL/TLS Automático                                        │
│  • IP Masking                                                │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA 2: Backend API (Privado)                              │
│  • Rate Limiting adicional                                   │
│  • Validación de requests                                    │
│  • Solo accesible desde Cloudflare Tunnel                    │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA 3: Ollama (Privado - VPN)                             │
│  • Solo accesible por VPN interna                            │
│  • Nunca expuesto a Internet                                 │
│  • Backend API es el único cliente                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Tabla de Accesibilidad

| Componente | Ubicación | Accesible desde Internet | Protección |
|------------|-----------|-------------------------|------------|
| **Cloudflare Tunnel** | Cloudflare (Cloud) | ✅ Sí (Público) | DDoS, WAF, SSL |
| **Backend API** | Proxmox (Tu servidor) | ⚠️ Solo vía Tunnel | Rate limiting |
| **Ollama** | Red VPN (192.168.200.45) | ❌ No (Privado) | VPN |
| **Whisper** | Contenedor Backend | ❌ No (Privado) | Contenedor |
| **Tesseract.js** | Contenedor Backend | ❌ No (Privado) | Contenedor |
| **Supabase** | Cloud (Supabase) | ✅ Sí (Público) | RLS, SSL |
| **App Móvil** | Dispositivos usuarios | ✅ Sí (Público) | - |

---

## 🎯 Puntos Clave

### ✅ **Lo que está bien protegido:**

1. **Ollama**: Completamente privado, solo accesible por VPN
2. **Backend API**: Solo accesible a través de Cloudflare Tunnel (no IP pública directa)
3. **Tu red Proxmox**: No expuesta directamente a Internet

### ⚠️ **Lo que es público pero seguro:**

1. **Cloudflare Tunnel**: Público pero protegido por Cloudflare
2. **Supabase**: Público pero con autenticación y RLS
3. **App Móvil**: Pública una vez compartida, pero solo se conecta a servicios seguros

### 🔐 **Recomendaciones de Seguridad:**

1. ✅ **Backend API**: Agregar rate limiting adicional
2. ✅ **Supabase**: Considerar habilitar RLS si compartes con muchos usuarios
3. ✅ **Cloudflare**: Configurar reglas de WAF personalizadas
4. ✅ **Monitoreo**: Revisar logs periódicamente

---

## 🚀 Ventajas de esta Arquitectura

1. **Seguridad**: Ollama nunca expuesto, Backend solo vía Tunnel
2. **Escalabilidad**: Cloudflare maneja tráfico y DDoS
3. **Simplicidad**: Usuarios solo necesitan el APK
4. **Costo**: Gratis (Cloudflare Tunnel free tier)
5. **Rendimiento**: Cloudflare CDN acelera respuestas

---

¿Quieres que configuremos Cloudflare Tunnel ahora? Es gratis y toma solo 5 minutos.

