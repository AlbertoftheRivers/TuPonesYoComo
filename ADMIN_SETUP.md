# Configuración del Panel de Administración

## Problema Resuelto

Las categorías personalizadas ahora se sincronizan entre la app móvil (APK) y la versión web porque se almacenan en Supabase en lugar de AsyncStorage (almacenamiento local).

## Paso 1: Ejecutar la Migración SQL

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `supabase-categories-migration.sql`
4. Ejecuta la consulta

Esto creará dos tablas:
- `custom_proteins`: Para categorías personalizadas
- `custom_cuisines`: Para cocinas personalizadas

## Paso 2: Acceder al Panel de Administración

1. Abre la app en la versión web
2. En la pantalla principal (HomeScreen), verás un nuevo botón ⚙️ junto a los botones de idioma y ayuda
3. Haz clic en el botón ⚙️ para acceder al Panel de Administración

## Funcionalidades del Panel Admin

### Gestión de Categorías
- **Ver**: Lista todas las categorías personalizadas (no muestra las predeterminadas)
- **Añadir**: Crea nuevas categorías personalizadas
- **Editar**: Modifica categorías existentes (valor, etiqueta, icono)
- **Eliminar**: Elimina categorías personalizadas

### Gestión de Cocinas
- **Ver**: Lista todas las cocinas personalizadas (no muestra las predeterminadas)
- **Añadir**: Crea nuevas cocinas personalizadas
- **Editar**: Modifica cocinas existentes (valor, etiqueta, bandera)
- **Eliminar**: Elimina cocinas personalizadas

## Notas Importantes

- Las categorías y cocinas predeterminadas (definidas en `constants.ts`) **no se pueden editar ni eliminar** desde el panel admin
- Solo se muestran las categorías/cocinas personalizadas que has creado
- Los cambios se sincronizan automáticamente entre la app móvil y la web
- El botón de admin (⚙️) está disponible en la versión web

## Estructura de Datos

### Categoría Personalizada
```typescript
{
  id: number;
  value: string;      // Identificador único (sin espacios, minúsculas)
  label: string;      // Nombre mostrado
  icon: string;       // Emoji del icono
  created_at: string;
  updated_at: string;
}
```

### Cocina Personalizada
```typescript
{
  id: number;
  value: string;      // Identificador único (sin espacios, minúsculas)
  label: string;      // Nombre mostrado
  flag: string;       // Emoji de la bandera
  created_at: string;
  updated_at: string;
}
```

