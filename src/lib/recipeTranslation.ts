import { Recipe, Ingredient } from '../types/recipe';
import { SupportedLanguage } from './i18n';

// Backend API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.tuponesyocomo.uk';

// Language code mapping for translation API
const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
  es: 'es',
  ca: 'ca',
  fr: 'fr',
  en: 'en',
  pt: 'pt',
};

/**
 * Translate text using the backend API (which can use Ollama or another translation service)
 */
async function translateText(text: string, targetLanguage: SupportedLanguage): Promise<string> {
  try {
    const langCode = LANGUAGE_CODES[targetLanguage];
    console.log(`🌐 [TRANSLATE] Translating text to ${targetLanguage} (${langCode}): "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        target_language: langCode,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`❌ [TRANSLATE] API error ${response.status}: ${errorText}`);
      throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translated = data.translated_text || text;
    console.log(`✅ [TRANSLATE] Translation result: "${translated.substring(0, 50)}${translated.length > 50 ? '...' : ''}"`);
    return translated;
  } catch (error) {
    console.error('❌ [TRANSLATE] Translation error:', error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Translate a recipe to the target language
 */
export async function translateRecipe(
  recipe: Recipe,
  targetLanguage: SupportedLanguage
): Promise<Recipe> {
  try {
    // Translate title
    const translatedTitle = await translateText(recipe.title, targetLanguage);

    // Translate ingredients
    const translatedIngredients: Ingredient[] = await Promise.all(
      recipe.ingredients.map(async (ingredient) => {
        const translatedName = await translateText(ingredient.name, targetLanguage);
        const translatedUnit = ingredient.unit
          ? await translateText(ingredient.unit, targetLanguage)
          : undefined;
        const translatedNotes = ingredient.notes
          ? await translateText(ingredient.notes, targetLanguage)
          : undefined;

        return {
          ...ingredient,
          name: translatedName,
          unit: translatedUnit,
          notes: translatedNotes,
        };
      })
    );

    // Translate steps
    const translatedSteps = await Promise.all(
      recipe.steps.map((step) => translateText(step, targetLanguage))
    );

    // Translate gadgets
    const translatedGadgets = await Promise.all(
      recipe.gadgets.map((gadget) => translateText(gadget, targetLanguage))
    );

    // Translate raw_text
    const translatedRawText = await translateText(recipe.raw_text, targetLanguage);

    return {
      ...recipe,
      title: translatedTitle,
      ingredients: translatedIngredients,
      steps: translatedSteps,
      gadgets: translatedGadgets,
      raw_text: translatedRawText,
    };
  } catch (error) {
    console.error('Error translating recipe:', error);
    // Return original recipe if translation fails
    return recipe;
  }
}

/**
 * Translate a single text string
 */
export async function translateTextToLanguage(
  text: string,
  targetLanguage: SupportedLanguage
): Promise<string> {
  return translateText(text, targetLanguage);
}

