# ✅ Verificación del Icono

## 📋 Sobre los Bordes Redondeados

### ⚠️ Importante para Expo/React Native:

**Los bordes redondeados NO deben estar en la imagen.**

- ✅ **Correcto:** Icono cuadrado (1024x1024px) sin bordes redondeados
- ❌ **Incorrecto:** Icono con bordes redondeados ya aplicados

**¿Por qué?**
- Android e iOS aplican sus propios bordes redondeados automáticamente
- Si ya tienes bordes redondeados en la imagen, el sistema aplicará más redondeo encima
- Esto puede hacer que el icono se vea mal o que se corten partes importantes

### ✅ Lo que SÍ debe tener el icono:

1. **Tamaño:** 1024x1024px (cuadrado perfecto)
2. **Formato:** PNG
3. **Fondo:** Puede ser transparente o sólido
4. **Contenido:** Centrado, con espacio de seguridad (margen) en los bordes
5. **Bordes:** Rectos, sin redondeo

### 🎨 Si tu icono tiene bordes redondeados:

**Opción 1: Usarlo así (puede funcionar)**
- Si los bordes redondeados son sutiles y el contenido está bien centrado
- Puede funcionar, pero no es ideal

**Opción 2: Crear versión sin bordes (recomendado)**
- Abre el icono en un editor (Photoshop, GIMP, Paint.NET, etc.)
- Recorta los bordes redondeados para hacerlo cuadrado
- O recrea el icono sin los bordes redondeados

---

## 🔍 Verificar Dimensiones

Para verificar que tu icono es 1024x1024px:

### En Windows:
1. Click derecho en `assets/icon.png`
2. Propiedades → Detalles
3. Busca "Dimensiones" o "Ancho" y "Alto"
4. Debe decir: 1024 x 1024

### O usa PowerShell:
```powershell
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$PWD\assets\icon.png")
Write-Host "Width: $($img.Width) Height: $($img.Height)"
$img.Dispose()
```

---

## ✅ Checklist del Icono

- [ ] Tamaño: 1024x1024px (cuadrado)
- [ ] Formato: PNG
- [ ] Bordes: Rectos (sin redondeo aplicado)
- [ ] Contenido: Centrado con margen de seguridad
- [ ] Ubicación: `assets/icon.png`

---

## 🎯 Recomendación

Si tu icono tiene bordes redondeados pero se ve bien centrado, **puedes probarlo así**. Si el build falla o el icono se ve mal en el teléfono, entonces crea una versión sin bordes redondeados.

**Para el build de prueba, si el icono existe y es PNG, debería funcionar.**

