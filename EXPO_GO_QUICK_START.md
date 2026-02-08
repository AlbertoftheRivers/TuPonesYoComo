# 🚀 Guía Rápida: Usar Expo Go y Crear APK

## Parte 1: Usar Expo Go (Ahora mismo) 📱

### ✅ No necesitas configurar nada

La app ya está configurada para usar `https://api.tuponesyocomo.uk` por defecto. Solo sigue estos pasos:

### Pasos:

1. **Abre una terminal en el proyecto:**
   ```bash
   cd C:\Users\beto1\Projects\TuPonesYoComo
   ```

2. **Inicia Expo:**
   ```bash
   npm start
   ```
   
   O si prefieres:
   ```bash
   npx expo start
   ```

3. **Escanea el QR con Expo Go:**
   - Abre la app **Expo Go** en tu teléfono
   - Escanea el código QR que aparece en la terminal
   - La app se cargará automáticamente

4. **¡Listo!** La app debería funcionar con la API en `https://api.tuponesyocomo.uk`

### 🔧 Si necesitas cambiar la URL (opcional):

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.uk
EXPO_PUBLIC_SUPABASE_URL=tu-url-de-supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-de-supabase
```

Luego reinicia Expo:
```bash
# Detén Expo (Ctrl+C) y vuelve a iniciar
npm start
```

---

## Parte 2: Crear APK para Compartir 📦

### Opción A: EAS Build (Recomendado) ⭐

#### 1. Instalar EAS CLI

```bash
npm install -g eas-cli
```

#### 2. Iniciar sesión en Expo

```bash
eas login
```

Si no tienes cuenta, créala en: https://expo.dev/signup

#### 3. Verificar configuración

El archivo `eas.json` ya está configurado. Solo necesitas:

- **Icono de la app** (1024x1024px) en `assets/icon.png`
- **Splash screen** (opcional) en `assets/splash.png`

Si no tienes iconos, puedes usar placeholders por ahora.

#### 4. Crear APK de desarrollo (más rápido para probar)

```bash
eas build --profile preview --platform android
```

Esto creará un APK que puedes instalar directamente.

#### 5. Crear APK de producción (para compartir)

```bash
eas build --profile production --platform android
```

#### 6. Descargar el APK

- EAS te dará un enlace cuando termine el build
- Descarga el APK desde ese enlace
- Compártelo con quien quieras

### Opción B: Build Local (Más rápido, pero requiere Android Studio)

Si ya tienes Android Studio instalado:

```bash
# 1. Generar carpetas nativas
npx expo prebuild

# 2. Construir APK
cd android
./gradlew assembleRelease

# El APK estará en:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📋 Checklist antes de crear el APK

- [ ] Icono creado en `assets/icon.png` (1024x1024px)
- [ ] Splash screen en `assets/splash.png` (opcional)
- [ ] Variables de entorno configuradas (si usas `.env`)
- [ ] Probado en Expo Go que todo funciona

---

## 🎯 Recomendación

**Para probar rápido:** Usa Expo Go (Parte 1)

**Para compartir:** Usa EAS Build con `--profile preview` (más rápido) o `--profile production` (más completo)

---

## ❓ Preguntas Frecuentes

### ¿Necesito configurar algo para Expo Go?

**No.** La URL ya está configurada por defecto. Solo ejecuta `npm start` y escanea el QR.

### ¿El APK funcionará sin internet?

**No.** La app necesita internet para:
- Conectarse a Supabase (base de datos)
- Conectarse a tu API (Cloudflare Tunnel)

### ¿Puedo compartir el APK con otros?

**Sí.** Una vez creado el APK, puedes:
- Enviarlo por WhatsApp/Email
- Subirlo a Google Drive/Dropbox
- Instalarlo directamente en cualquier Android

### ¿Necesito Google Play Store?

**No.** El APK se instala directamente sin necesidad de Play Store.

---

## 🚨 Solución de Problemas

### Expo Go no se conecta

1. Asegúrate de que tu teléfono y PC están en la misma red Wi-Fi
2. O usa el modo tunnel:
   ```bash
   npx expo start --tunnel
   ```

### El build falla

1. Verifica que tienes el icono en `assets/icon.png`
2. Si no tienes icono, crea uno temporal (cualquier imagen 1024x1024)
3. Revisa los logs de EAS para ver el error específico

### La app no se conecta a la API

1. Verifica que el tunnel de Cloudflare está corriendo
2. Prueba `curl https://api.tuponesyocomo.uk/health` desde tu servidor
3. Verifica que la URL en el código es correcta

