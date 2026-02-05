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
- `tiny` - Más rápido, menos preciso
- `base` - Balance velocidad/precisión
- `small` - Buen balance
- `medium` - Más preciso, más lento
- `large` - Más preciso, más lento y pesado

Para español y recetas, recomiendo `small` o `medium`:

```bash
# Descargar modelo (esto descargará automáticamente la primera vez que lo uses)
# O puedes descargarlo manualmente:
whisper --model small --help  # Esto descargará el modelo 'small'
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
   - `base`: ~150 MB
   - `small`: ~500 MB
   - `medium`: ~1.5 GB
   - `large`: ~3 GB

2. **Memoria RAM**: 
   - `small`: ~2-4 GB RAM
   - `medium`: ~5-8 GB RAM
   - `large`: ~10+ GB RAM

3. **Tiempo de procesamiento** (aproximado para 1 minuto de audio):
   - `small`: 5-10 segundos
   - `medium`: 15-30 segundos
   - `large`: 30-60 segundos

4. **Primera ejecución**: La primera vez que uses un modelo, Whisper lo descargará automáticamente (puede tardar).

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

