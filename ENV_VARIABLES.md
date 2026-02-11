# Variables de Entorno - Guía Completa

## Frontend (.env en la raíz del proyecto)

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Supabase Configuration (REQUERIDO)
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Backend API URL (REQUERIDO)
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.uk
```

**Nota**: Para desarrollo local, puedes usar:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Backend (.env en backend/)

Crea un archivo `.env` en la carpeta `backend/` con:

```env
# Server Configuration (OPCIONAL - tiene defaults)
PORT=3000
NODE_ENV=production

# Ollama Configuration (REQUERIDO)
OLLAMA_BASE_URL=http://192.168.200.45:11434
OLLAMA_MODEL=llama3.2:3b

# Whisper Configuration (OPCIONAL - tiene defaults)
WHISPER_MODEL=base
WHISPER_VENV_PATH=/opt/apps/TuPonesYoComo/backend/whisper_venv

# Supabase Configuration (OPCIONAL - solo para RAG mejorado)
# Si no lo configuras, el sistema funcionará con las 3 recetas de ejemplo
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key-aqui
```

## Cómo Obtener las Credenciales

### Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL` (frontend) y `SUPABASE_URL` (backend)
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY` (frontend)
   - **service_role key** (secret) → `SUPABASE_SERVICE_KEY` (backend, solo para RAG)

### Backend API URL

- **Producción**: `https://api.tuponesyocomo.uk` (Cloudflare Tunnel)
- **Desarrollo local**: `http://localhost:3000` o `http://tu-ip-local:3000`

## Variables Opcionales vs Requeridas

### Frontend - REQUERIDAS
- ✅ `EXPO_PUBLIC_SUPABASE_URL`
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `EXPO_PUBLIC_API_BASE_URL`

### Backend - REQUERIDAS
- ✅ `OLLAMA_BASE_URL` (o usa default: `http://192.168.200.45:11434`)
- ✅ `OLLAMA_MODEL` (o usa default: `llama3.2:3b`)

### Backend - OPCIONALES (tienen defaults)
- ⚪ `PORT` (default: 3000)
- ⚪ `WHISPER_MODEL` (default: base)
- ⚪ `WHISPER_VENV_PATH` (default: ./whisper_venv)
- ⚪ `NODE_ENV` (default: production)

### Backend - OPCIONALES (solo para RAG mejorado)
- ⚪ `SUPABASE_URL` - Si no está, RAG usa solo ejemplos
- ⚪ `SUPABASE_SERVICE_KEY` - Si no está, RAG usa solo ejemplos

## Verificación

### Frontend
Si faltan variables, verás errores en la consola:
- `⚠️ Supabase credentials not configured`
- Errores de conexión al API

### Backend
Al iniciar el servidor, verás:
- `✅ Supabase client initialized for RAG` (si está configurado)
- `⚠️ Supabase not configured - RAG will use example recipes only` (si no está)
- `📡 Ollama URL: ...`
- `🤖 Model: ...`

## Ejemplo Completo

### Frontend/.env
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.uk
```

### Backend/.env
```env
PORT=3000
NODE_ENV=production
OLLAMA_BASE_URL=http://192.168.200.45:11434
OLLAMA_MODEL=llama3.1:8b
WHISPER_MODEL=base
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...service_role
```

