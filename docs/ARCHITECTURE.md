# TuPonesYoComo - Arquitectura del Sistema

## Diagrama de Arquitectura Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Móvil/Web)                            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              React Native App (Expo)                            │  │
│  │  - iOS PWA / Android APK / Web PWA                              │  │
│  │  - TypeScript + React Native                                    │  │
│  │                                                                  │  │
│  │  Pantallas:                                                      │  │
│  │  ├─ HomeScreen (categorías de proteínas)                        │  │
│  │  ├─ RecipeListScreen (lista de recetas)                         │  │
│  │  ├─ RecipeDetailScreen (detalles + ajuste porciones)            │  │
│  │  ├─ AddRecipeScreen (añadir: texto/dictado/OCR)                  │  │
│  │  └─ EditRecipeScreen (editar recetas)                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Funcionalidades:                                                       │
│  ├─ 📝 Entrada de texto                                                │
│  ├─ 🎤 Dictado por voz (Whisper)                                      │
│  ├─ 📷 OCR de imágenes (Tesseract.js)                                │
│  └─ 🤖 Análisis con IA (Ollama)                                       │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js/Express)                        │
│                    https://api.tuponesyocomo.uk                         │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Express Server                                │  │
│  │                    Puerto: 3000                                 │  │
│  │                                                                  │  │
│  │  Endpoints:                                                      │  │
│  │  ├─ POST /api/analyze-recipe  → Ollama LLM                      │  │
│  │  ├─ POST /api/transcribe      → Whisper STT                     │  │
│  │  └─ POST /api/ocr             → Tesseract.js                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│                              │                                           │
│        ┌──────────────────────┼──────────────────────┐                  │
│        │                      │                      │                  │
│        ▼                      ▼                      ▼                  │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐               │
│  │  Ollama  │         │ Whisper  │         │Supabase  │               │
│  │   LLM    │         │   STT    │         │   RAG    │               │
│  └──────────┘         └──────────┘         └──────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
        │                      │                      │
        │ VPN                  │ Local                 │ HTTPS
        │                      │                       │
        ▼                      ▼                       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Ollama      │      │  Whisper     │      │  Supabase    │
│  Server      │      │  (Python)   │      │  PostgreSQL  │
│              │      │              │      │              │
│  192.168.    │      │  Local/Venv │      │  Cloud DB    │
│  200.45:11434│      │              │      │              │
│              │      │              │      │  - Recipes    │
│  Models:     │      │  Model: base │      │  - RAG data  │
│  - llama3.2:3b│     │              │      │              │
│  - llama3.1:8b│     │              │      │              │
│  - mistral   │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
```

## Flujo de Datos Detallado

### 1. Añadir Receta con Texto
```
Usuario escribe texto
    ↓
AddRecipeScreen
    ↓
POST /api/analyze-recipe
    ↓
Backend busca recetas similares (RAG)
    ↓
Ollama analiza texto + ejemplos
    ↓
Retorna JSON estructurado
    ↓
Usuario revisa y guarda
    ↓
POST a Supabase
    ↓
Receta guardada (disponible para RAG futuro)
```

### 2. Añadir Receta con Dictado
```
Usuario presiona 🎤
    ↓
Web: MediaRecorder → Blob
Native: expo-av → Audio file
    ↓
POST /api/transcribe
    ↓
Backend recibe audio
    ↓
Whisper transcribe (español/portugués/catalán/francés)
    ↓
Retorna texto transcrito
    ↓
Texto → Análisis con Ollama (igual que flujo 1)
```

### 3. Añadir Receta con OCR
```
Usuario presiona 📷
    ↓
Web: Camera/Gallery → Base64
Native: expo-image-picker → File URI
    ↓
POST /api/ocr
    ↓
Backend recibe imagen
    ↓
Tesseract.js extrae texto
    ↓
Retorna texto extraído
    ↓
Texto → Análisis con Ollama (igual que flujo 1)
```

## Componentes del Sistema

### Frontend (React Native/Expo)
- **Plataformas**: iOS (PWA), Android (APK), Web (PWA)
- **Tecnologías**: 
  - React Native + TypeScript
  - Expo SDK 54
  - React Navigation
  - Supabase Client

### Backend API (Node.js)
- **Framework**: Express.js
- **Funciones**:
  - Proxy a Ollama (LLM)
  - Integración Whisper (STT)
  - Integración Tesseract.js (OCR)
  - Sistema RAG con Supabase

### Servicios Externos

#### Ollama (LLM)
- **Ubicación**: Servidor local (192.168.200.45:11434)
- **Acceso**: VPN desde backend
- **Modelos recomendados**:
  - `llama3.1:8b` - Balance calidad/velocidad
  - `llama3.1:70b` - Máxima calidad
  - `mistral:7b` - Bueno en francés
  - `mixtral:8x7b` - Excelente multilingüe

#### Whisper (Speech-to-Text)
- **Ubicación**: Backend local
- **Modelo**: `base` (recomendado para < 4GB RAM)
- **Idiomas**: Español, Portugués, Catalán, Francés

#### Tesseract.js (OCR)
- **Ubicación**: Backend (Node.js)
- **Idiomas**: Español, Inglés, Francés, Italiano, Portugués, Alemán
- **Preprocesamiento**: Ajuste de contraste/brillo

#### Supabase (Base de Datos)
- **Tipo**: PostgreSQL (cloud)
- **Uso**:
  - Almacenamiento de recetas
  - Sistema RAG (búsqueda de recetas similares)
  - Row Level Security (RLS) habilitado

## Variables de Entorno

### Frontend (.env en raíz)
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.uk
```

### Backend (.env en backend/)
```env
# Requeridas
PORT=3000
OLLAMA_BASE_URL=http://192.168.200.45:11434
OLLAMA_MODEL=llama3.2:3b

# Opcionales
WHISPER_MODEL=base
WHISPER_VENV_PATH=/ruta/a/whisper_venv
NODE_ENV=production

# Opcionales (para RAG mejorado)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key
```

## Sistema RAG (Retrieval Augmented Generation)

```
Nueva receta a analizar
    ↓
Backend busca recetas similares:
    ├─ Por categoría (main_protein)
    ├─ De Supabase (si configurado)
    └─ De ejemplos (3 recetas base)
    ↓
Selecciona hasta 3 ejemplos más relevantes
    ↓
Añade ejemplos al prompt de Ollama
    ↓
Ollama analiza usando:
    ├─ Prompt mejorado con vocabulario culinario
    ├─ Ejemplos de formato correcto
    └─ Contexto de recetas similares
    ↓
Resultado más preciso
    ↓
Receta guardada → Disponible para futuros análisis
```

## Seguridad

- **Frontend**: Usa `anon key` de Supabase (público, seguro con RLS)
- **Backend**: Usa `service_role key` de Supabase (privado, solo backend)
- **API**: Acceso público vía Cloudflare Tunnel
- **Ollama**: Acceso privado vía VPN (solo desde backend)
- **RLS**: Habilitado en Supabase para protección de datos

## Despliegue

### Frontend
- **Web**: Cloudflare Pages (PWA)
- **Android**: APK generado con EAS Build
- **iOS**: PWA instalable desde Safari

### Backend
- **Ubicación**: Proxmox Container
- **Acceso público**: Cloudflare Tunnel
- **URL**: https://api.tuponesyocomo.uk

### Infraestructura
- **Ollama**: Servidor local (VPN)
- **Supabase**: Cloud (PostgreSQL)
- **Whisper**: Backend local (Python venv)

