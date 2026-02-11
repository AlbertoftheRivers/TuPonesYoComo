# 📱 Ver Logs de la App - Guía Rápida

## ✅ Opción 1: Usar Expo Go (MÁS FÁCIL - Sin instalar nada)

### Pasos:

1. **Abre una terminal en tu proyecto:**
   ```bash
   cd C:\Users\beto1\Projects\TuPonesYoComo
   ```

2. **Inicia Expo:**
   ```bash
   npm start
   ```

3. **Abre Expo Go en tu teléfono y escanea el QR**

4. **Abre la app en Expo Go**

5. **Los logs aparecerán automáticamente en la terminal** donde ejecutaste `npm start`

   - Verás errores en rojo
   - Verás warnings en amarillo
   - Verás logs normales en blanco

6. **Cuando la app se cierre o tenga un error, verás el mensaje exacto en la terminal**

---

## 🔧 Opción 2: Instalar ADB (Para APK Standalone)

Si quieres ver logs del APK instalado (no Expo Go):

### Instalar ADB:

1. **Descarga Android Platform Tools:**
   - Ve a: https://developer.android.com/tools/releases/platform-tools
   - Descarga para Windows
   - O usa este enlace directo: https://dl.google.com/android/repository/platform-tools-latest-windows.zip

2. **Extrae el ZIP** en una carpeta (ej: `C:\platform-tools`)

3. **Agrega a PATH:**
   - Busca "Variables de entorno" en Windows
   - Edita "Path" en Variables del sistema
   - Agrega: `C:\platform-tools` (o donde extrajiste)

4. **Reinicia PowerShell/CMD**

5. **Verifica:**
   ```bash
   adb version
   ```

### Usar ADB:

1. **Conecta tu teléfono por USB**

2. **Habilita Depuración USB:**
   - Configuración → Acerca del teléfono → Toca "Número de compilación" 7 veces
   - Configuración → Opciones de desarrollador → Activa "Depuración USB"

3. **Abre PowerShell en tu proyecto:**
   ```bash
   cd C:\Users\beto1\Projects\TuPonesYoComo
   ```

4. **Ejecuta los comandos:**
   ```bash
   # Limpiar logs anteriores
   adb logcat -c
   
   # Abre la app en tu teléfono
   # (espera a que se cierre)
   
   # Ver logs de error
   adb logcat -d | Select-String -Pattern "error|exception|crash|fatal|tuponesyocomo" | Out-File crash_log.txt
   
   # Ver el archivo
   notepad crash_log.txt
   ```

---

## 🎯 Recomendación

**Para debug rápido:** Usa **Expo Go** (Opción 1) - Es instantáneo y no requiere configuración.

**Para APK standalone:** Instala **ADB** (Opción 2) - Requiere más setup pero funciona con el APK instalado.

---

## 📋 Comandos ADB en PowerShell (Windows)

Nota: En PowerShell, `grep` no funciona. Usa `Select-String`:

```powershell
# Limpiar logs
adb logcat -c

# Ver logs en tiempo real (filtrado)
adb logcat | Select-String -Pattern "tuponesyocomo|ReactNative|error"

# Guardar logs de error
adb logcat -d | Select-String -Pattern "error|exception|crash|fatal" | Out-File crash_log.txt

# Ver el archivo
notepad crash_log.txt
```



