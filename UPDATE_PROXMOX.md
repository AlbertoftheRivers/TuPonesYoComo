# Actualizar Código en Proxmox

## Pasos para actualizar y ver los cambios

### 1. Conectarse al servidor Proxmox
```bash
ssh tu_usuario@tu_servidor_proxmox
```

### 2. Ir al directorio del proyecto
```bash
cd /opt/apps/TuPonesYoComo
```

### 3. Hacer backup (opcional pero recomendado)
```bash
cp -r . ../TuPonesYoComo_backup_$(date +%Y%m%d_%H%M%S)
```

### 4. Actualizar el código desde GitHub
```bash
git pull origin main
```

### 5. Instalar nuevas dependencias
```bash
npm install
```

**IMPORTANTE:** Esto instalará `@react-native-async-storage/async-storage` que es necesario para las nuevas funcionalidades.

### 6. Verificar que no haya errores de sintaxis
```bash
npm run start --dry-run 2>&1 | head -20
```

### 7. Reiniciar el servicio de Expo
```bash
sudo systemctl restart tuponesyocomo-expo
```

### 8. Verificar que el servicio esté corriendo
```bash
sudo systemctl status tuponesyocomo-expo
```

### 9. Ver los logs en tiempo real
```bash
sudo journalctl -u tuponesyocomo-expo -f
```

## Si hay errores

### Error: "Cannot find module '@react-native-async-storage/async-storage'"
```bash
cd /opt/apps/TuPonesYoComo
npm install @react-native-async-storage/async-storage
sudo systemctl restart tuponesyocomo-expo
```

### Error: "Module not found" o errores de importación
```bash
cd /opt/apps/TuPonesYoComo
rm -rf node_modules
npm install
sudo systemctl restart tuponesyocomo-expo
```

### El servicio no inicia
```bash
# Ver errores detallados
sudo journalctl -u tuponesyocomo-expo -n 100

# Verificar permisos
ls -la /opt/apps/TuPonesYoComo

# Verificar que el archivo existe
ls -la /opt/apps/TuPonesYoComo/src/lib/emojiMapper.ts
ls -la /opt/apps/TuPonesYoComo/src/lib/customCategories.ts
```

## Verificar que los cambios estén presentes

### Verificar archivos nuevos
```bash
ls -la src/lib/emojiMapper.ts
ls -la src/lib/customCategories.ts
```

### Verificar que HomeScreen tenga el modal
```bash
grep -n "Añadir Categoría" src/screens/HomeScreen.tsx
grep -n "showAddCategoryModal" src/screens/HomeScreen.tsx
```

### Verificar que AddRecipeScreen tenga selección múltiple de cocinas
```bash
grep -n "cuisineSelector" src/screens/AddRecipeScreen.tsx
grep -n "cuisineChip" src/screens/AddRecipeScreen.tsx
```

## Comando todo-en-uno (copia y pega)

```bash
cd /opt/apps/TuPonesYoComo && \
git pull origin main && \
npm install && \
sudo systemctl restart tuponesyocomo-expo && \
echo "✅ Actualización completada. Revisa los logs:" && \
sudo journalctl -u tuponesyocomo-expo -n 20
```

## Qué deberías ver después de actualizar

1. **En la pantalla principal:**
   - Una tarjeta con "+ Añadir Categoría" al final de las categorías
   - Al tocarla, se abre un modal para agregar categorías

2. **En "Añadir Receta":**
   - Las cocinas aparecen como chips seleccionables (no dropdown)
   - Puedes seleccionar múltiples cocinas
   - Las seleccionadas muestran un ✓

3. **En la lista de recetas:**
   - Las recetas muestran todas las cocinas como badges

