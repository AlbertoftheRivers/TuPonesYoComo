# 🚀 Crear el APK - Pasos Rápidos

## ✅ Ya tienes:
- ✅ Icono en `assets/icon.png`
- ✅ API funcionando
- ✅ Todo configurado

## 📦 Ahora crea el APK:

### Paso 1: Instalar EAS CLI (solo una vez)

```bash
npm install -g eas-cli
```

### Paso 2: Iniciar sesión en Expo

```bash
eas login
```

Si no tienes cuenta, créala en: https://expo.dev/signup (gratis)

### Paso 3: Crear el APK

```bash
eas build --profile preview --platform android
```

**Esto tomará 10-20 minutos.**

### Paso 4: Descargar el APK

1. Cuando termine, EAS te dará un enlace
2. Abre el enlace en tu navegador
3. Descarga el archivo `.apk`

### Paso 5: Instalar en tu teléfono Android

1. **Habilita "Fuentes desconocidas":**
   - Configuración → Seguridad → Permitir instalación de apps de fuentes desconocidas

2. **Transfiere el APK a tu teléfono:**
   - Envíalo por WhatsApp/Email
   - O transfiere por USB

3. **Abre el APK e instala**

---

## ⏱️ Tiempo estimado:

- Instalación EAS: 1-2 minutos
- Login: 1 minuto
- Build: 10-20 minutos
- **Total: ~15-25 minutos**

---

## 🎯 Ejecuta estos comandos en orden:

```bash
# 1. Instalar EAS
npm install -g eas-cli

# 2. Login
eas login

# 3. Crear APK
eas build --profile preview --platform android
```

¡Eso es todo! 🎉

