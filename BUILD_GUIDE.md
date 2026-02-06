# Guía para Crear App Standalone - TuPonesYoComo

## Opción 1: EAS Build (Recomendado) ⭐

Esta es la opción más fácil y moderna. Te permite crear builds de desarrollo y producción con tu propio icono.

### Pasos:

#### 1. Instalar EAS CLI

```bash
npm install -g eas-cli
```

#### 2. Iniciar sesión en Expo

```bash
eas login
```

#### 3. Configurar el proyecto

```bash
eas build:configure
```

Esto creará un archivo `eas.json` con la configuración.

#### 4. Configurar app.json con icono y splash screen

Ya tienes `app.json`, pero necesitas agregar:
- Icono de la app (imagen 1024x1024)
- Splash screen (opcional)
- Bundle identifier para Android/iOS

#### 5. Crear build de desarrollo (Android)

```bash
eas build --profile development --platform android
```

Esto creará un archivo `.apk` que puedes instalar directamente en tu teléfono.

#### 6. Crear build de producción

```bash
eas build --profile production --platform android
```

### Ventajas:
- ✅ Más rápido que Expo Go
- ✅ Icono personalizado
- ✅ Instalación directa en el teléfono
- ✅ Mejor rendimiento
- ✅ No necesitas Android Studio

---

## Opción 2: Build Local (Android)

Si prefieres construir localmente sin usar EAS:

### Requisitos:
- Android Studio instalado
- Android SDK configurado
- Java JDK

### Pasos:

#### 1. Instalar dependencias nativas

```bash
npx expo prebuild
```

#### 2. Construir APK

```bash
cd android
./gradlew assembleDebug
```

El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Ventajas:
- ✅ Control total
- ✅ No requiere cuenta de Expo
- ✅ Builds locales

### Desventajas:
- ❌ Más complejo
- ❌ Requiere Android Studio
- ❌ Configuración manual

---

## Configuración de Icono

Para cualquier opción, necesitas:

1. **Crear icono**: Imagen cuadrada 1024x1024px (PNG)
2. **Colocarlo en**: `assets/icon.png`
3. **Actualizar app.json**:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#D2691E"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon.png",
        "backgroundColor": "#D2691E"
      },
      "package": "com.tuponesyocomo.app"
    }
  }
}
```

---

## Recomendación

**Usa EAS Build** porque:
1. Es más fácil de configurar
2. No necesitas Android Studio
3. Los builds son más rápidos
4. Puedes crear builds para iOS también (si tienes Mac)
5. Mejor rendimiento que Expo Go

¿Quieres que configuremos EAS Build ahora?

