# Configuración de Whisper

## Variables de Entorno

Agrega estas variables a tu archivo `.env` en el directorio `backend/`:

```bash
# Whisper Configuration
WHISPER_MODEL=base
# Opciones: tiny, base, small, medium, large
# Para sistemas con < 4GB RAM: usa 'base' o 'tiny'
# Recomendado para tu sistema (3.8GB RAM): base

WHISPER_VENV_PATH=/opt/apps/TuPonesYoComo/backend/whisper_venv
# Ruta al entorno virtual de Whisper
# Si no se establece, intentará usar Whisper del sistema
```

## Modelos Disponibles

- `tiny`: ~75 MB, más rápido, menos preciso
- `base`: ~150 MB, balance velocidad/precisión
- `small`: ~500 MB, **recomendado** - buen balance
- `medium`: ~1.5 GB, más preciso, más lento
- `large`: ~3 GB, más preciso, más lento y pesado

## Uso del Endpoint

El endpoint `/api/transcribe` acepta:
- **Método**: POST
- **Content-Type**: multipart/form-data
- **Campo**: `audio` (archivo de audio)
- **Parámetro opcional**: `language` (default: 'es' para español)

Ejemplo de uso:
```bash
curl -X POST http://localhost:3000/api/transcribe \
  -F "audio=@recording.m4a" \
  -F "language=es"
```

Respuesta:
```json
{
  "text": "Texto transcrito aquí...",
  "language": "es",
  "model": "small"
}
```

