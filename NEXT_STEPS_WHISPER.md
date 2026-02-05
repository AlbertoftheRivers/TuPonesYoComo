# Próximos Pasos - Whisper Instalado

## ✅ Lo que ya está hecho:
- Whisper Python instalado
- Modelo `base` descargado
- Backend actualizado con endpoint `/api/transcribe`
- `multer` instalado para manejar uploads de audio

## Paso 1: Reiniciar el servicio del backend

```bash
# Reiniciar el servicio para cargar los cambios
sudo systemctl restart tuponesyocomo-api

# Verificar que está funcionando
sudo systemctl status tuponesyocomo-api

# Ver logs en tiempo real
sudo journalctl -u tuponesyocomo-api -f
```

Deberías ver en los logs:
```
🚀 Backend API server running on port 3000
📡 Ollama URL: http://192.168.200.45:11434
🤖 Ollama Model: llama3.2:3b
🎤 Whisper Model: base
🌐 Health check: http://localhost:3000/health
```

## Paso 2: Verificar el endpoint de salud

```bash
# Probar el endpoint de salud (debería mostrar información de Whisper)
curl http://localhost:3000/health
```

Deberías ver algo como:
```json
{
  "status": "ok",
  "ollama_url": "http://192.168.200.45:11434",
  "model": "llama3.2:3b",
  "whisper_model": "base",
  "whisper_venv": "/opt/apps/TuPonesYoComo/backend/whisper_venv"
}
```

## Paso 3: Probar el endpoint de transcripción (opcional)

Si tienes un archivo de audio de prueba:

```bash
# Probar transcripción
curl -X POST http://localhost:3000/api/transcribe \
  -F "audio=@/ruta/a/tu/audio.m4a" \
  -F "language=es"
```

## Paso 4: Continuar con el frontend

Ahora necesitamos:
1. Agregar botón de micrófono en `AddRecipeScreen` y `EditRecipeScreen`
2. Implementar grabación de audio con `expo-av`
3. Enviar audio al backend para transcripción
4. Insertar texto transcrito en el campo `raw_text`

¿Listo para continuar con el frontend?

