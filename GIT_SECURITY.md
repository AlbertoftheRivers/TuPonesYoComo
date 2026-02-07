# 🔒 Guía de Seguridad para Git/GitHub

## ✅ Lo que SÍ se sube a GitHub

- Código fuente (`.ts`, `.tsx`, `.js`, `.json`)
- Archivos de configuración públicos (`package.json`, `app.json`)
- Documentación (`.md`)
- Estructura del proyecto

## ❌ Lo que NUNCA se sube a GitHub

- **Archivos `.env`** - Contienen credenciales
- **Claves privadas** (`.p8`, `.jks`, `.key`)
- **Certificados** (`.mobileprovision`, `.p12`)
- **Tokens de API**
- **Contraseñas**
- **URLs con credenciales embebidas**

## 🛡️ Cómo proteger tus datos confidenciales

### 1. Usa `.env` para datos sensibles

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-aqui
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.uk
```

**✅ El archivo `.env` ya está en `.gitignore`** - nunca se subirá a GitHub.

### 2. Usa `.env.example` como plantilla

El archivo `.env.example` contiene las variables necesarias **sin valores reales**:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.uk
```

**✅ Este archivo SÍ se sube a GitHub** - es solo una plantilla.

### 3. Flujo de trabajo seguro

#### Cuando haces cambios en tu máquina:

```bash
# 1. Asegúrate de que .env existe y tiene tus valores
# (no lo subas nunca)

# 2. Haz tus cambios en el código
git add src/
git commit -m "feat: nueva funcionalidad"

# 3. Sube solo el código (no .env)
git push origin main
```

#### Cuando clonas el proyecto en otra máquina:

```bash
# 1. Clona el repositorio
git clone https://github.com/AlbertoftheRivers/TuPonesYoComo.git
cd TuPonesYoComo

# 2. Copia la plantilla y rellena tus valores
cp .env.example .env
# Edita .env con tus credenciales reales

# 3. Instala dependencias
npm install

# 4. Ya puedes trabajar normalmente
```

### 4. Verificar antes de hacer push

Antes de hacer `git push`, verifica que no estás subiendo datos sensibles:

```bash
# Ver qué archivos se van a subir
git status

# Ver el contenido de los cambios
git diff

# Si ves .env en los cambios, NO hagas push
# Elimínalo del staging:
git reset HEAD .env
```

### 5. Si accidentalmente subiste datos sensibles

**⚠️ Si ya subiste `.env` o credenciales a GitHub:**

1. **Cambia inmediatamente todas las credenciales**:
   - Genera nuevas claves en Supabase
   - Actualiza las variables de entorno en tu servidor
   - Regenera cualquier token que hayas expuesto

2. **Elimina el archivo del historial de Git**:
   ```bash
   # Elimina .env del historial (CUIDADO: esto reescribe el historial)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Fuerza el push (esto puede afectar a otros colaboradores)
   git push origin --force --all
   ```

3. **Mejor opción**: Si el repositorio es privado y solo tú lo usas, simplemente:
   - Elimina el archivo del último commit
   - Cambia todas las credenciales
   - Asegúrate de que `.env` esté en `.gitignore`

## 📋 Checklist antes de cada push

- [ ] `git status` no muestra `.env`
- [ ] `git diff` no muestra credenciales en el código
- [ ] No hay URLs con tokens embebidos
- [ ] No hay claves privadas en los archivos
- [ ] `.gitignore` incluye `.env` y otros archivos sensibles

## 🔍 Comandos útiles

```bash
# Ver qué archivos están siendo ignorados
git status --ignored

# Ver el contenido de .gitignore
cat .gitignore

# Buscar posibles credenciales en el código (antes de commit)
grep -r "supabase.co" --exclude-dir=node_modules --exclude="*.md"
grep -r "eyJ" --exclude-dir=node_modules  # Busca tokens JWT
```

## 📚 Recursos

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Expo: Environment Variables](https://docs.expo.dev/guides/environment-variables/)

