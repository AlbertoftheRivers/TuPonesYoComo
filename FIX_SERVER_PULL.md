# 🔧 Fix: Error al hacer pull en el servidor

## Problema
```
error: Your local changes to the following files would be overwritten by merge:
        package-lock.json
Please commit your changes or stash them before you merge.
```

## Solución

Tienes 3 opciones:

### Opción 1: Stash (Guardar cambios temporalmente) - RECOMENDADO
```bash
cd /opt/apps/TuPonesYoComo
git stash
git pull origin main
git stash pop  # Si quieres recuperar los cambios después
```

### Opción 2: Descartar cambios locales (Si no necesitas los cambios)
```bash
cd /opt/apps/TuPonesYoComo
git checkout -- package-lock.json
git pull origin main
```

### Opción 3: Commit los cambios locales primero
```bash
cd /opt/apps/TuPonesYoComo
git add package-lock.json
git commit -m "Update package-lock.json"
git pull origin main
# Si hay conflictos, resuélvelos y luego:
git push origin main
```

## Recomendación

**Usa la Opción 2** (descartar cambios) porque `package-lock.json` se regenera automáticamente con `npm install`, así que no necesitas conservar cambios locales en ese archivo.


## Problema
```
error: Your local changes to the following files would be overwritten by merge:
        package-lock.json
Please commit your changes or stash them before you merge.
```

## Solución

Tienes 3 opciones:

### Opción 1: Stash (Guardar cambios temporalmente) - RECOMENDADO
```bash
cd /opt/apps/TuPonesYoComo
git stash
git pull origin main
git stash pop  # Si quieres recuperar los cambios después
```

### Opción 2: Descartar cambios locales (Si no necesitas los cambios)
```bash
cd /opt/apps/TuPonesYoComo
git checkout -- package-lock.json
git pull origin main
```

### Opción 3: Commit los cambios locales primero
```bash
cd /opt/apps/TuPonesYoComo
git add package-lock.json
git commit -m "Update package-lock.json"
git pull origin main
# Si hay conflictos, resuélvelos y luego:
git push origin main
```

## Recomendación

**Usa la Opción 2** (descartar cambios) porque `package-lock.json` se regenera automáticamente con `npm install`, así que no necesitas conservar cambios locales en ese archivo.



