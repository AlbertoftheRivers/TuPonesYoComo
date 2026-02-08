# 🔍 Debug: APK se cierra al abrir

## Posibles Causas

### 1. Variables de Entorno Faltantes
El APK necesita las variables de entorno configuradas en EAS Build, no solo en tu `.env` local.

### 2. Errores en Inicialización
- Notificaciones fallando al iniciar
- Supabase sin credenciales
- Módulos nativos no disponibles

## 🔧 Soluciones Aplicadas

He mejorado el manejo de errores para que la app no se cierre:

1. ✅ Notificaciones ahora son no-bloqueantes
2. ✅ Supabase tiene mejor manejo de errores
3. ✅ Errores capturados en ErrorBoundary

## 📱 Cómo Obtener Logs del Crash

### Opción 1: Android Logcat (Recomendado)

```bash
# Conecta tu teléfono por USB
# Habilita "Depuración USB" en opciones de desarrollador
adb logcat | grep -i "tuponesyocomo\|react\|error"
```

O más específico:
```bash
adb logcat *:E ReactNative:V ReactNativeJS:V
```

### Opción 2: Desde el Teléfono

1. Abre la app
2. Cuando se cierre, ve a: **Configuración → Apps → TuPonesYoComo → Información**
3. Busca "Informes de errores" o "Crash logs"

### Opción 3: Usar Expo Go para Debug

Mientras arreglamos el APK, puedes usar Expo Go para ver los errores:

```bash
npm start
# Escanea el QR con Expo Go
# Los errores aparecerán en la terminal
```

## 🔑 Configurar Variables de Entorno en EAS

Si el problema es variables de entorno, configúralas en EAS:

```bash
# Configurar Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "tu-url-de-supabase"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-clave-de-supabase"

# API URL (opcional, ya tiene valor por defecto)
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://api.tuponesyocomo.uk"
```

Luego reconstruye:
```bash
eas build --profile preview --platform android
```

## 🧪 Probar el Fix

1. **Haz commit de los cambios:**
   ```bash
   git add -A
   git commit -m "fix: improve error handling to prevent app crashes"
   git push
   ```

2. **Reconstruye el APK:**
   ```bash
   eas build --profile preview --platform android
   ```

3. **Instala el nuevo APK y prueba**

## 📋 Checklist de Debugging

- [ ] ¿Tienes las credenciales de Supabase configuradas?
- [ ] ¿El API está accesible desde tu teléfono?
- [ ] ¿Puedes ver los logs con adb logcat?
- [ ] ¿La app funciona en Expo Go?

## 🚨 Si sigue crasheando

Comparte los logs de `adb logcat` para identificar el error exacto.


