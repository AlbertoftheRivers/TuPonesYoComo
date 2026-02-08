# 📦 Guía: Crear APK para TuPonesYoComo

## ⚠️ Antes de empezar: Necesitas un icono

El `app.json` requiere un icono en `assets/icon.png` (1024x1024px).

### Opción 1: Crear icono rápido (temporal)

Puedes usar cualquier imagen cuadrada 1024x1024px. Si no tienes una:

1. **Usa un generador online:**
   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/
   - Crea una imagen 1024x1024px y guárdala como `assets/icon.png`

2. **O usa una imagen existente:**
   - Toma cualquier imagen cuadrada
   - Redimensiona a 1024x1024px
   - Guárdala como `assets/icon.png`

### Opción 2: Icono temporal simple

Si quieres algo rápido para probar, puedo ayudarte a crear uno básico.

---

## 🚀 Pasos para crear el APK

### 1. Instalar EAS CLI (solo una vez)

```bash
npm install -g eas-cli
```

### 2. Iniciar sesión en Expo

```bash
eas login
```

Si no tienes cuenta, créala en: https://expo.dev/signup (es gratis)

### 3. Verificar que tienes el icono

```bash
# Verifica que existe
dir assets\icon.png
```

Si no existe, créalo primero (ver arriba).

### 4. Crear APK de preview (recomendado para empezar)

```bash
eas build --profile preview --platform android
```

Este comando:
- ✅ Crea un APK (no AAB)
- ✅ Es más rápido que production
- ✅ Perfecto para compartir directamente

### 5. Esperar el build

- El build tarda **10-20 minutos**
- EAS te mostrará el progreso
- Al finalizar, te dará un enlace para descargar el APK

### 6. Descargar el APK

1. Abre el enlace que te da EAS
2. Descarga el archivo `.apk`
3. Compártelo con quien quieras

---

## 📱 Instalar el APK en tu teléfono

### Android:

1. **Habilita "Fuentes desconocidas":**
   - Configuración → Seguridad → Permitir instalación de apps de fuentes desconocidas

2. **Transfiere el APK:**
   - Envía el APK por WhatsApp/Email a tu teléfono
   - O transfiere por USB

3. **Instala:**
   - Abre el archivo APK
   - Toca "Instalar"
   - ¡Listo!

---

## 🎯 Build de Producción (opcional)

Si quieres un build más optimizado:

```bash
eas build --profile production --platform android
```

**Diferencia:**
- `preview`: Más rápido, para probar
- `production`: Más optimizado, para distribución final

---

## ❓ Preguntas Frecuentes

### ¿Cuánto cuesta EAS Build?

**Gratis** para builds ocasionales. Si haces muchos builds, hay límites, pero para uso personal es suficiente.

### ¿Puedo crear el APK sin EAS?

Sí, pero necesitas Android Studio. EAS es más fácil.

### ¿El APK funcionará sin internet?

**No.** La app necesita internet para:
- Conectarse a Supabase
- Conectarse a tu API (`https://api.tuponesyocomo.uk`)

### ¿Puedo compartir el APK con otros?

**Sí.** Una vez creado, puedes:
- Enviarlo por WhatsApp/Email
- Subirlo a Google Drive
- Instalarlo en cualquier Android

---

## 🚨 Solución de Problemas

### Error: "icon.png not found"

**Solución:** Crea el icono en `assets/icon.png` (1024x1024px)

### Error: "Not logged in"

**Solución:** Ejecuta `eas login` primero

### El build falla

1. Revisa los logs que te muestra EAS
2. Verifica que `app.json` está correcto
3. Asegúrate de que el icono existe

### El APK no se instala

1. Verifica que habilitaste "Fuentes desconocidas"
2. Asegúrate de que el APK se descargó completamente
3. Prueba en otro dispositivo

---

## 📋 Checklist antes de crear el APK

- [ ] Icono creado en `assets/icon.png` (1024x1024px)
- [ ] EAS CLI instalado (`npm install -g eas-cli`)
- [ ] Sesión iniciada en EAS (`eas login`)
- [ ] Probado en Expo Go que todo funciona
- [ ] API funcionando (`https://api.tuponesyocomo.uk/health`)

---

## 🎉 ¡Listo!

Una vez que tengas el APK, puedes:
- Instalarlo en tu teléfono
- Compartirlo con amigos/familia
- Usarlo sin necesidad de Expo Go

