# Guía para Crear APK de Android

## Prerrequisitos

1. **Cuenta de Expo**: Necesitas una cuenta en [expo.dev](https://expo.dev)
2. **EAS CLI**: Herramienta para construir aplicaciones con Expo

## Paso 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

## Paso 2: Iniciar sesión en Expo

```bash
eas login
```

Ingresa tus credenciales de Expo.

## Paso 3: Configurar el Proyecto (si es necesario)

El proyecto ya está configurado con:
- ✅ `eas.json` con perfiles de build para APK
- ✅ `projectId` en `app.json`
- ✅ Package name: `com.tuponesyocomo.app`

## Paso 4: Construir el APK

Tienes dos opciones:

### Opción A: Build de Preview (Recomendado para pruebas)

```bash
eas build --platform android --profile preview
```

Este comando:
- Genera un APK (no AAB)
- Es más rápido
- Perfecto para distribuir a usuarios de prueba
- No requiere Google Play Store

### Opción B: Build de Producción

```bash
eas build --platform android --profile production
```

Este comando:
- Genera un APK de producción
- Listo para publicar en Google Play Store
- Puede tardar más tiempo

## Paso 5: Seguir el Proceso

1. EAS te preguntará si quieres construir localmente o en la nube
   - **Nube (recomendado)**: Más fácil, no requiere configuración local
   - **Local**: Más rápido pero requiere Android SDK configurado

2. Si eliges nube, el build comenzará y recibirás un enlace para seguir el progreso

3. Cuando termine, podrás descargar el APK desde:
   - El enlace que te proporciona EAS
   - O desde [expo.dev](https://expo.dev) → Tu proyecto → Builds

## Paso 6: Descargar y Distribuir

1. Descarga el APK desde el enlace proporcionado
2. Distribúyelo a tus usuarios:
   - Por email
   - Por Google Drive/Dropbox
   - Por tu propio servidor web
   - Por QR code (EAS puede generar uno)

## Variables de Entorno

Si necesitas configurar variables de entorno para el build, crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.uk
```

EAS automáticamente las incluirá en el build.

## Comandos Útiles

```bash
# Ver builds anteriores
eas build:list

# Ver detalles de un build específico
eas build:view [BUILD_ID]

# Cancelar un build en progreso
eas build:cancel [BUILD_ID]

# Descargar un build
eas build:download [BUILD_ID]
```

## Notas Importantes

- **Primera vez**: El primer build puede tardar 15-30 minutos
- **Builds subsecuentes**: Suelen ser más rápidos (5-15 minutos)
- **Costo**: EAS ofrece builds gratuitos con límites razonables
- **Tamaño del APK**: Normalmente entre 30-50 MB para una app Expo

## Troubleshooting

### Error: "No credentials found"
```bash
eas credentials
```
Esto te guiará para configurar las credenciales de Android.

### Error: "Project not found"
Asegúrate de estar logueado:
```bash
eas login
```

### Build falla
Revisa los logs en [expo.dev](https://expo.dev) para ver el error específico.

