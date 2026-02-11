# Configuración de Traducción de Recetas en el Backend

## Resumen

Para que las recetas se traduzcan automáticamente cuando el usuario cambia el idioma, necesitas añadir un endpoint de traducción en tu backend API.

## Endpoint Necesario

Añade este endpoint en tu backend (Node.js/Express):

```javascript
// POST /translate
app.post('/translate', async (req, res) => {
  try {
    const { text, target_language } = req.body;
    
    if (!text || !target_language) {
      return res.status(400).json({ 
        error: 'Missing required fields: text, target_language' 
      });
    }

    // Usar Ollama para traducir
    const ollamaResponse = await fetch('http://192.168.200.45:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2', // o el modelo que uses
        prompt: `Translate the following text to ${target_language}. Only return the translation, nothing else:\n\n${text}`,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error('Ollama translation failed');
    }

    const data = await ollamaResponse.json();
    const translatedText = data.response.trim();

    res.json({ translated_text: translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      details: error.message 
    });
  }
});
```

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

