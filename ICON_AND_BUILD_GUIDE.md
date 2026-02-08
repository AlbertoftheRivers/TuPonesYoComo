# 🎨 Icono y Build para Android/iOS

## 📱 Parte 1: Crear el Icono (OBLIGATORIO)

### Opción A: Generador Online (Más Fácil) ⭐

1. **Ve a:** https://www.favicon-generator.org/ o https://realfavicongenerator.net/
2. **Sube cualquier imagen** (puede ser un logo, emoji, foto, etc.)
3. **Genera el icono** en tamaño 1024x1024px
4. **Descarga** el archivo
5. **Guárdalo como:** `assets/icon.png` en tu proyecto

### Opción B: Usar una Imagen Existente

1. **Toma cualquier imagen cuadrada** (puede ser una foto, logo, etc.)
2. **Redimensiona a 1024x1024px:**
   - Usa Paint, Photoshop, GIMP, o cualquier editor
   - O usa: https://www.iloveimg.com/resize-image
3. **Guárdala como:** `assets/icon.png`

### Opción C: Icono Simple con Texto

Si quieres algo rápido, puedes crear un icono simple:
- Fondo: Color bourbon (#D2691E) o amarillo huevo
- Texto: "TYC" o "🍳" o lo que quieras
- Tamaño: 1024x1024px
- Guarda como: `assets/icon.png`

### ⚠️ IMPORTANTE:
- **Nombre exacto:** `icon.png` (no `Icon.png` ni `ICON.PNG`)
- **Ubicación:** `assets/icon.png` (en la carpeta `assets`)
- **Tamaño:** 1024x1024px (cuadrado)
- **Formato:** PNG

---

## 🤖 Parte 2: Build para Android

### ✅ Android es FÁCIL y GRATIS

```bash
# 1. Instalar EAS CLI (solo una vez)
npm install -g eas-cli

# 2. Iniciar sesión en Expo
eas login
# (Crea cuenta gratis en https://expo.dev/signup si no tienes)

# 3. Crear APK
eas build --profile preview --platform android
```

**Tiempo:** 10-20 minutos  
**Costo:** Gratis  
**Resultado:** Un archivo `.apk` que puedes instalar directamente

### Instalar el APK en Android:

1. **Habilita "Fuentes desconocidas":**
   - Configuración → Seguridad → Permitir instalación de apps de fuentes desconocidas

2. **Descarga el APK** del enlace que te da EAS

3. **Abre el APK** en tu teléfono e instala

---

## 🍎 Parte 3: Build para iOS

### ⚠️ iOS es MÁS COMPLEJO

**Requisitos:**
1. **Mac** (necesario para builds locales, o usar EAS Cloud)
2. **Cuenta de Desarrollador de Apple** ($99/año)
3. **Xcode** instalado (si haces build local)

### Opción A: EAS Build Cloud (Recomendado) ⭐

Puedes crear el build en la nube sin Mac:

```bash
# 1. Instalar EAS CLI (si no lo tienes)
npm install -g eas-cli

# 2. Iniciar sesión
eas login

# 3. Crear build para iOS
eas build --profile preview --platform ios
```

**Pero necesitas:**
- ✅ Cuenta de Expo (gratis)
- ✅ Cuenta de Desarrollador de Apple ($99/año)
- ❌ NO necesitas Mac (EAS lo hace en la nube)

### Opción B: Build Local (Requiere Mac)

```bash
eas build --profile preview --platform ios --local
```

**Requisitos:**
- Mac con Xcode
- Cuenta de Desarrollador de Apple
- Certificados configurados

---

## 📊 Comparación: Android vs iOS

| Característica | Android | iOS |
|----------------|---------|-----|
| **Dificultad** | ⭐ Fácil | ⭐⭐⭐ Complejo |
| **Costo** | ✅ Gratis | ❌ $99/año (Apple Developer) |
| **Tiempo** | 10-20 min | 20-30 min |
| **Requiere Mac** | ❌ No | ✅ Sí (para local) |
| **Formato** | `.apk` | `.ipa` |
| **Instalación** | Directa | Requiere TestFlight o App Store |

---

## 🎯 Recomendación

### Para empezar:
1. **Crea el icono** (ver Parte 1)
2. **Haz build de Android** primero (más fácil)
3. **Prueba el APK** en tu teléfono Android
4. **Si necesitas iOS después**, entonces configúralo

### ¿Necesitas iOS ahora?

**Solo si:**
- Tienes usuarios con iPhone
- Quieres publicar en App Store
- Estás dispuesto a pagar $99/año a Apple

**Si no:**
- Empieza solo con Android
- Es más fácil y gratis

---

## 📋 Checklist antes de Build

### Para Android:
- [ ] Icono creado en `assets/icon.png` (1024x1024px)
- [ ] EAS CLI instalado
- [ ] Sesión iniciada (`eas login`)
- [ ] Probado en Expo Go que funciona

### Para iOS:
- [ ] Todo lo de Android ✅
- [ ] Cuenta de Desarrollador de Apple ($99/año)
- [ ] Decidido si usar EAS Cloud o build local

---

## 🚀 Pasos Rápidos (Android)

```bash
# 1. Crear icono (usa opción A, B o C de arriba)
# Guarda como: assets/icon.png

# 2. Instalar EAS
npm install -g eas-cli

# 3. Login
eas login

# 4. Build
eas build --profile preview --platform android

# 5. Esperar 10-20 minutos
# 6. Descargar APK del enlace
# 7. Instalar en tu teléfono
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo crear el APK sin icono?

**No.** EAS requiere el icono. Crea uno temporal si no tienes uno definitivo.

### ¿El icono tiene que ser perfecto?

**No.** Puedes usar uno temporal y cambiarlo después. Solo necesita existir.

### ¿Puedo hacer build de iOS sin Mac?

**Sí**, usando EAS Cloud, pero necesitas cuenta de Apple Developer ($99/año).

### ¿Puedo hacer build de iOS gratis?

**No.** Apple requiere pago anual de $99 para publicar apps (incluso para TestFlight).

### ¿Cuánto cuesta EAS Build?

**Gratis** para uso personal/ocasional. Si haces muchos builds, hay límites, pero para empezar es suficiente.

---

## 🎨 Ideas para el Icono

- 🍳 Emoji de sartén/cocina
- 📝 Texto "TYC" o "TuPonesYoComo"
- 🥘 Imagen de comida
- 🧑‍🍳 Chef/cocinero
- Tu logo personal

**Lo importante:** Que sea 1024x1024px y se guarde como `assets/icon.png`

