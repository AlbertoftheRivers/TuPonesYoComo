# 🔧 Fix: APK Crash - ExponentImagePicker Error

## Problema
El APK se cierra al iniciar con el error:
```
Error: Cannot find native module 'ExponentImagePicker'
```

## Solución Aplicada

### 1. Manejo Condicional de ImagePicker
Se agregó verificación para que la app no se rompa si `expo-image-picker` no está disponible:

- **AddRecipeScreen.tsx**: Verificación antes de usar ImagePicker
- **EditRecipeScreen.tsx**: Verificación antes de usar ImagePicker
- **Manejo de errores**: Mensajes informativos si el módulo no está disponible

### 2. Cambios Realizados

#### En `useEffect` (inicialización):
```typescript
// Antes: Llamaba directamente a ImagePicker
await ImagePicker.requestCameraPermissionsAsync();

// Ahora: Verifica disponibilidad primero
if (ImagePicker && typeof ImagePicker.requestCameraPermissionsAsync === 'function') {
  await ImagePicker.requestCameraPermissionsAsync();
}
```

#### En funciones de cámara/galería:
```typescript
// Verificación al inicio de cada función
if (!ImagePicker || typeof ImagePicker.requestCameraPermissionsAsync !== 'function') {
  Alert.alert('Error', 'La funcionalidad no está disponible en esta versión de la app.');
  return;
}
```

#### En catch blocks:
```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  if (errorMessage.includes('native module') || errorMessage.includes('ExponentImagePicker')) {
    Alert.alert('Error', 'La funcionalidad no está disponible. Por favor usa texto o dictado.');
  } else {
    Alert.alert('Error', 'No se pudo completar la operación.');
  }
}
```

## Próximos Pasos

### Opción 1: Rebuild APK (Recomendado)
1. **Configurar EAS Secrets** (si no lo has hecho):
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "tu-url"
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-key"
   eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://api.tuponesyocomo.uk"
   ```

2. **Rebuild APK**:
   ```bash
   eas build --platform android --profile preview
   ```

### Opción 2: Verificar Configuración de expo-image-picker
Si quieres que ImagePicker funcione en el APK, asegúrate de:

1. **Verificar versión compatible**:
   ```bash
   npx expo install expo-image-picker
   ```

2. **Verificar app.json**:
   - Los permisos de cámara ya están configurados ✅
   - No se necesita configuración adicional en Expo SDK 54

3. **Limpiar y rebuild**:
   ```bash
   rm -rf node_modules
   npm install
   eas build --platform android --profile preview --clear-cache
   ```

## Nota Importante

Con los cambios aplicados, **la app ya no debería crashear** al iniciar, incluso si ImagePicker no está disponible. Los usuarios verán un mensaje informativo si intentan usar la cámara/galería, pero podrán usar texto y dictado normalmente.

## Testing

1. **Instalar nuevo APK**
2. **Abrir la app** - No debería crashear
3. **Intentar usar cámara/galería** - Debería mostrar mensaje informativo
4. **Usar texto/dictado** - Debería funcionar normalmente


## Problema
El APK se cierra al iniciar con el error:
```
Error: Cannot find native module 'ExponentImagePicker'
```

## Solución Aplicada

### 1. Manejo Condicional de ImagePicker
Se agregó verificación para que la app no se rompa si `expo-image-picker` no está disponible:

- **AddRecipeScreen.tsx**: Verificación antes de usar ImagePicker
- **EditRecipeScreen.tsx**: Verificación antes de usar ImagePicker
- **Manejo de errores**: Mensajes informativos si el módulo no está disponible

### 2. Cambios Realizados

#### En `useEffect` (inicialización):
```typescript
// Antes: Llamaba directamente a ImagePicker
await ImagePicker.requestCameraPermissionsAsync();

// Ahora: Verifica disponibilidad primero
if (ImagePicker && typeof ImagePicker.requestCameraPermissionsAsync === 'function') {
  await ImagePicker.requestCameraPermissionsAsync();
}
```

#### En funciones de cámara/galería:
```typescript
// Verificación al inicio de cada función
if (!ImagePicker || typeof ImagePicker.requestCameraPermissionsAsync !== 'function') {
  Alert.alert('Error', 'La funcionalidad no está disponible en esta versión de la app.');
  return;
}
```

#### En catch blocks:
```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  if (errorMessage.includes('native module') || errorMessage.includes('ExponentImagePicker')) {
    Alert.alert('Error', 'La funcionalidad no está disponible. Por favor usa texto o dictado.');
  } else {
    Alert.alert('Error', 'No se pudo completar la operación.');
  }
}
```

## Próximos Pasos

### Opción 1: Rebuild APK (Recomendado)
1. **Configurar EAS Secrets** (si no lo has hecho):
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "tu-url"
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-key"
   eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://api.tuponesyocomo.uk"
   ```

2. **Rebuild APK**:
   ```bash
   eas build --platform android --profile preview
   ```

### Opción 2: Verificar Configuración de expo-image-picker
Si quieres que ImagePicker funcione en el APK, asegúrate de:

1. **Verificar versión compatible**:
   ```bash
   npx expo install expo-image-picker
   ```

2. **Verificar app.json**:
   - Los permisos de cámara ya están configurados ✅
   - No se necesita configuración adicional en Expo SDK 54

3. **Limpiar y rebuild**:
   ```bash
   rm -rf node_modules
   npm install
   eas build --platform android --profile preview --clear-cache
   ```

## Nota Importante

Con los cambios aplicados, **la app ya no debería crashear** al iniciar, incluso si ImagePicker no está disponible. Los usuarios verán un mensaje informativo si intentan usar la cámara/galería, pero podrán usar texto y dictado normalmente.

## Testing

1. **Instalar nuevo APK**
2. **Abrir la app** - No debería crashear
3. **Intentar usar cámara/galería** - Debería mostrar mensaje informativo
4. **Usar texto/dictado** - Debería funcionar normalmente


