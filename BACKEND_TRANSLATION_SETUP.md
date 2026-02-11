# Configuración de Traducción de Recetas en el Backend

## ✅ Estado: IMPLEMENTADO

El endpoint de traducción ya ha sido añadido al backend en `backend/server.js`.

## Endpoint Implementado

El endpoint `POST /translate` está disponible y funciona de la siguiente manera:

**Request:**
```json
POST /translate
{
  "text": "Texto a traducir",
  "target_language": "fr"
}
```

**Response:**
```json
{
  "translated_text": "Texte traduit"
}
```

**Idiomas soportados:**
- `es` - Español
- `ca` - Catalán
- `fr` - Francés
- `en` - Inglés
- `pt` - Portugués

## Cómo Funciona

1. El frontend llama a `translateRecipe()` desde `src/lib/recipeTranslation.ts`
2. Esta función traduce cada parte de la receta (título, ingredientes, pasos, etc.)
3. Cada traducción llama al endpoint `/translate` del backend
4. El backend usa Ollama para traducir el texto
5. La receta se muestra traducida en la pantalla

## Cómo Funciona

1. **Frontend**: Cuando el usuario cambia el idioma, el frontend llama a `translateRecipe()` desde `recipeTranslation.ts`
2. **Backend**: El endpoint `/translate` recibe el texto y el idioma objetivo
3. **Ollama**: El backend usa Ollama para traducir el texto
4. **Resultado**: La receta se muestra traducida en la pantalla

## Integración en el Frontend

El frontend ya está preparado. Solo necesitas:

1. Añadir el endpoint `/translate` en tu backend
2. El frontend automáticamente usará `translateRecipe()` cuando detecte un cambio de idioma

## Nota

- Las traducciones se hacen en tiempo real (no se guardan en la base de datos)
- Cada vez que cambias el idioma, se traduce la receta nuevamente
- Si quieres guardar traducciones, necesitarías modificar el esquema de la base de datos

