# 📱 Cómo Ver Logs de la App en el Móvil

## 🔧 Opción 1: ADB Logcat (Android) - Recomendado

### Requisitos:
- Teléfono Android conectado por USB
- Depuración USB habilitada
- `adb` instalado (viene con Android SDK)

### Pasos:

#### 1. Habilitar Depuración USB en el teléfono:

1. Ve a: **Configuración → Acerca del teléfono**
2. Toca **"Número de compilación"** 7 veces (aparecerá "Ahora eres desarrollador")
3. Ve a: **Configuración → Opciones de desarrollador**
4. Activa **"Depuración USB"**

#### 2. Conectar y ver logs:

```bash
# Ver todos los logs relacionados con tu app
adb logcat | grep -i "tuponesyocomo"

# Ver solo errores y logs de React Native
adb logcat *:E ReactNative:V ReactNativeJS:V

# Ver logs en tiempo real filtrados
adb logcat -s ReactNativeJS:V ReactNative:V

# Guardar logs en un archivo
adb logcat > app_logs.txt
```

#### 3. Filtrar por tu app específicamente:

```bash
# Ver logs solo de tu app
adb logcat | grep -E "tuponesyocomo|ReactNativeJS|ReactNative"
```

---

## 📲 Opción 2: Expo Go (Más Fácil)

Si usas Expo Go, los logs aparecen automáticamente en la terminal:

```bash
npm start
# Escanea el QR
# Los logs aparecerán en la terminal cuando uses la app
```

**Ventajas:**
- ✅ No necesitas USB
- ✅ Logs en tiempo real
- ✅ Fácil de usar

**Desventajas:**
- ❌ Solo funciona con Expo Go (no con APK standalone)

---

## 🔍 Opción 3: React Native Debugger

1. Instala React Native Debugger: https://github.com/jhen0409/react-native-debugger
2. En la app, agita el teléfono (o presiona `Cmd+D` / `Ctrl+M`)
3. Selecciona "Debug"
4. Los logs aparecerán en React Native Debugger

---

## 📋 Opción 4: Ver Logs del Sistema Android

En el teléfono:

1. **Configuración → Sistema → Acerca del teléfono**
2. Toca **"Número de compilación"** 7 veces
3. Ve a **Configuración → Sistema → Opciones de desarrollador**
4. Activa **"Registro de errores"** o **"Informes de errores"**
5. Los crashes se guardan automáticamente

Para verlos:
- **Configuración → Apps → TuPonesYoComo → Información → Informes de errores**

---

## 🚨 Opción 5: Logs de Crash Específicos

Si la app se cierra inmediatamente:

```bash
# Ver solo crashes y errores fatales
adb logcat *:F *:E

# Ver el último crash
adb logcat -d | tail -100

# Ver logs del último minuto
adb logcat -t "01-01 00:00:00.000" | grep -i error
```

---

## 💡 Comandos Útiles

```bash
# Limpiar logs anteriores
adb logcat -c

# Ver logs con timestamps
adb logcat -v time

# Ver logs con colores (si tu terminal lo soporta)
adb logcat -v color

# Filtrar por nivel de log (E=Error, W=Warning, I=Info, D=Debug, V=Verbose)
adb logcat *:E  # Solo errores
adb logcat *:W  # Warnings y errores
adb logcat *:I  # Info, warnings y errores
```

---

## 🎯 Para Debuggear el Crash Específico

```bash
# 1. Limpia logs anteriores
adb logcat -c

# 2. Abre la app en tu teléfono

# 3. Cuando se cierre, ejecuta:
adb logcat -d | grep -i -E "error|exception|crash|fatal|tuponesyocomo" > crash_log.txt

# 4. Revisa crash_log.txt para ver el error exacto
```

---

## 📱 iOS (si tienes Mac)

```bash
# Conecta iPhone por USB
# Abre Xcode → Window → Devices and Simulators
# Selecciona tu dispositivo
# Ve a "Open Console" para ver logs
```

---

## ✅ Recomendación

**Para APK standalone:** Usa **ADB Logcat** (Opción 1)  
**Para desarrollo rápido:** Usa **Expo Go** (Opción 2)


## 🔧 Opción 1: ADB Logcat (Android) - Recomendado

### Requisitos:
- Teléfono Android conectado por USB
- Depuración USB habilitada
- `adb` instalado (viene con Android SDK)

### Pasos:

#### 1. Habilitar Depuración USB en el teléfono:

1. Ve a: **Configuración → Acerca del teléfono**
2. Toca **"Número de compilación"** 7 veces (aparecerá "Ahora eres desarrollador")
3. Ve a: **Configuración → Opciones de desarrollador**
4. Activa **"Depuración USB"**

#### 2. Conectar y ver logs:

```bash
# Ver todos los logs relacionados con tu app
adb logcat | grep -i "tuponesyocomo"

# Ver solo errores y logs de React Native
adb logcat *:E ReactNative:V ReactNativeJS:V

# Ver logs en tiempo real filtrados
adb logcat -s ReactNativeJS:V ReactNative:V

# Guardar logs en un archivo
adb logcat > app_logs.txt
```

#### 3. Filtrar por tu app específicamente:

```bash
# Ver logs solo de tu app
adb logcat | grep -E "tuponesyocomo|ReactNativeJS|ReactNative"
```

---

## 📲 Opción 2: Expo Go (Más Fácil)

Si usas Expo Go, los logs aparecen automáticamente en la terminal:

```bash
npm start
# Escanea el QR
# Los logs aparecerán en la terminal cuando uses la app
```

**Ventajas:**
- ✅ No necesitas USB
- ✅ Logs en tiempo real
- ✅ Fácil de usar

**Desventajas:**
- ❌ Solo funciona con Expo Go (no con APK standalone)

---

## 🔍 Opción 3: React Native Debugger

1. Instala React Native Debugger: https://github.com/jhen0409/react-native-debugger
2. En la app, agita el teléfono (o presiona `Cmd+D` / `Ctrl+M`)
3. Selecciona "Debug"
4. Los logs aparecerán en React Native Debugger

---

## 📋 Opción 4: Ver Logs del Sistema Android

En el teléfono:

1. **Configuración → Sistema → Acerca del teléfono**
2. Toca **"Número de compilación"** 7 veces
3. Ve a **Configuración → Sistema → Opciones de desarrollador**
4. Activa **"Registro de errores"** o **"Informes de errores"**
5. Los crashes se guardan automáticamente

Para verlos:
- **Configuración → Apps → TuPonesYoComo → Información → Informes de errores**

---

## 🚨 Opción 5: Logs de Crash Específicos

Si la app se cierra inmediatamente:

```bash
# Ver solo crashes y errores fatales
adb logcat *:F *:E

# Ver el último crash
adb logcat -d | tail -100

# Ver logs del último minuto
adb logcat -t "01-01 00:00:00.000" | grep -i error
```

---

## 💡 Comandos Útiles

```bash
# Limpiar logs anteriores
adb logcat -c

# Ver logs con timestamps
adb logcat -v time

# Ver logs con colores (si tu terminal lo soporta)
adb logcat -v color

# Filtrar por nivel de log (E=Error, W=Warning, I=Info, D=Debug, V=Verbose)
adb logcat *:E  # Solo errores
adb logcat *:W  # Warnings y errores
adb logcat *:I  # Info, warnings y errores
```

---

## 🎯 Para Debuggear el Crash Específico

```bash
# 1. Limpia logs anteriores
adb logcat -c

# 2. Abre la app en tu teléfono

# 3. Cuando se cierre, ejecuta:
adb logcat -d | grep -i -E "error|exception|crash|fatal|tuponesyocomo" > crash_log.txt

# 4. Revisa crash_log.txt para ver el error exacto
```

---

## 📱 iOS (si tienes Mac)

```bash
# Conecta iPhone por USB
# Abre Xcode → Window → Devices and Simulators
# Selecciona tu dispositivo
# Ve a "Open Console" para ver logs
```

---

## ✅ Recomendación

**Para APK standalone:** Usa **ADB Logcat** (Opción 1)  
**Para desarrollo rápido:** Usa **Expo Go** (Opción 2)

