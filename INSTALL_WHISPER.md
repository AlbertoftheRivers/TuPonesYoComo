# Instalación de Whisper en Proxmox

## Paso 1: Conectarse al servidor Proxmox

```bash
ssh logpinkylog@pinkyubuntu240403
# O la IP de tu servidor
```

## Paso 2: Instalar dependencias del sistema

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python 3.11+ y pip
sudo apt install -y python3.11 python3.11-venv python3-pip ffmpeg

# Verificar versión de Python (debe ser 3.11 o superior)
python3.11 --version
```

## Paso 3: Crear entorno virtual para Whisper

```bash
cd /opt/apps/TuPonesYoComo/backend

# Crear entorno virtual
python3.11 -m venv whisper_venv

# Activar entorno virtual
source whisper_venv/bin/activate

# Actualizar pip
pip install --upgrade pip
```

## Paso 4: Instalar Whisper

```bash
# Instalar Whisper (esto puede tardar varios minutos)
pip install openai-whisper

# Verificar instalación
whisper --version
```

## Paso 5: Descargar modelo de Whisper

Whisper necesita descargar un modelo. Hay varios tamaños:

**IMPORTANTE: Para sistemas con poca RAM (< 4GB), usa `base` o `tiny`**

- `tiny` - ~75 MB, ~1 GB RAM, más rápido, menos preciso
- `base` - ~150 MB, ~1.5 GB RAM, balance velocidad/precisión ⭐ **RECOMENDADO para tu sistema**
- `small` - ~500 MB, ~2-4 GB RAM, buen balance (puede ser ajustado con 3.8GB total)
- `medium` - ~1.5 GB, ~5-8 GB RAM, más preciso, más lento
- `large` - ~3 GB, ~10+ GB RAM, más preciso, más lento y pesado

**Para tu sistema (3.8GB RAM total):**
- ✅ **Recomendado: `base`** - Buen balance y funcionará bien
- ✅ Alternativa: `tiny` - Si necesitas más velocidad
- ⚠️ `small` - Puede funcionar pero usará swap y será más lento

```bash
# Descargar modelo base (recomendado para tu sistema)
whisper --model base --help  # Esto descargará el modelo 'base'
```

## Paso 6: Probar Whisper manualmente

```bash
# Crear un archivo de prueba (opcional)
# Puedes grabar un audio de prueba o usar uno existente

# Probar transcripción
whisper audio_test.m4a --language es --model small

# Si funciona, verás el texto transcrito
```

## Paso 7: Instalar dependencias de Node.js para el backend

Necesitamos instalar una librería para procesar audio en Node.js:

```bash
# Asegúrate de estar en el directorio del backend
cd /opt/apps/TuPonesYoComo/backend

# Instalar dependencias adicionales (si no están)
npm install multer  # Para manejar uploads de archivos
```

## Paso 8: Verificar permisos

```bash
# Asegúrate de que el usuario tenga permisos para ejecutar Whisper
which whisper
# Debería mostrar: /opt/apps/TuPonesYoComo/backend/whisper_venv/bin/whisper
```

## Notas importantes:

1. **Espacio en disco**: Los modelos de Whisper ocupan espacio:
   - `tiny`: ~75 MB
   - `base`: ~150 MB ⭐ **Recomendado para tu sistema**
   - `small`: ~500 MB
   - `medium`: ~1.5 GB
   - `large`: ~3 GB

2. **Memoria RAM** (uso aproximado durante transcripción):
   - `tiny`: ~1 GB RAM
   - `base`: ~1.5 GB RAM ⭐ **Ideal para tu sistema (3.8GB total)**
   - `small`: ~2-4 GB RAM (puede usar swap en tu sistema)
   - `medium`: ~5-8 GB RAM (no recomendado)
   - `large`: ~10+ GB RAM (no recomendado)

3. **Tiempo de procesamiento** (aproximado para 1 minuto de audio):
   - `tiny`: 3-5 segundos
   - `base`: 5-8 segundos ⭐
   - `small`: 5-10 segundos
   - `medium`: 15-30 segundos
   - `large`: 30-60 segundos

4. **Primera ejecución**: La primera vez que uses un modelo, Whisper lo descargará automáticamente (puede tardar).

5. **Optimización para sistemas con poca RAM**:
   - Usa el modelo `base` en lugar de `small`
   - Asegúrate de tener swap configurado (ya lo tienes: 3.8GB)
   - Cierra otras aplicaciones si es posible durante la transcripción

## Solución de problemas:

### Error: "ffmpeg not found"
```bash
sudo apt install ffmpeg
```

### Error: "No module named 'whisper'"
```bash
# Asegúrate de que el entorno virtual esté activado
source whisper_venv/bin/activate
pip install openai-whisper
```

### Error de permisos
```bash
# Verificar permisos del directorio
ls -la /opt/apps/TuPonesYoComo/backend
# Si es necesario, cambiar propietario
sudo chown -R logpinkylog:logpinkylog /opt/apps/TuPonesYoComo/backend
```

### Verificar que todo funciona
```bash
# Activar entorno virtual
source /opt/apps/TuPonesYoComo/backend/whisper_venv/bin/activate

# Verificar instalación
whisper --help

# Deberías ver la ayuda de Whisper
```

