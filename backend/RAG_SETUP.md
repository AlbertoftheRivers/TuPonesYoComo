# Configuración del Sistema RAG (Retrieval Augmented Generation)

El sistema RAG mejora la precisión del análisis de recetas usando recetas similares guardadas como ejemplos.

## Cómo Funciona

1. **Recetas de Ejemplo**: Se cargan 3 recetas de ejemplo (Crêpes, Tortilla de Patatas, Lubina a la Sal)
2. **Búsqueda en Base de Datos**: Si Supabase está configurado, busca recetas similares por categoría
3. **Mejora del Prompt**: Añade ejemplos al prompt para que Ollama aprenda del formato
4. **Mejora Continua**: Cuantas más recetas guardes, mejor será el análisis

## Configuración Opcional (Supabase)

Para que el sistema use recetas guardadas en Supabase, añade estas variables al `.env` del backend:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key
```

**Nota**: Usa la **Service Role Key** (no la anon key) para acceso completo desde el backend.

### Cómo obtener las credenciales:

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Settings → API
3. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_KEY`

## Sin Supabase

Si no configuras Supabase, el sistema funcionará igual usando solo las 3 recetas de ejemplo incluidas.

## Recetas de Ejemplo Incluidas

1. **Crêpes** - 4 personas, 60 minutos
2. **Tortilla de Patatas** - 4 personas, 45 minutos  
3. **Lubina a la Sal con Patatas Panaderas** - 4 personas, 75 minutos

Estas recetas se usan automáticamente como ejemplos para mejorar el análisis.

## Beneficios

- ✅ Mejor reconocimiento de ingredientes
- ✅ Mejor extracción de pasos
- ✅ Mejor identificación de utensilios
- ✅ Mejora continua con cada receta guardada
- ✅ Soporte multilingüe mejorado

