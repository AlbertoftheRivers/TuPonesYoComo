import { RecipeAIAnalysis, Ingredient } from '../types/recipe';

// Backend API URL - points to the containerized backend service
// This backend has VPN access to Ollama, so the phone doesn't need VPN
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.tuponesyocomo.uk';

/**
 * Analyzes raw recipe text and extracts structured data using the backend API
 * The backend API proxies requests to Ollama LLM (which is accessible via VPN)
 */
export async function analyzeRecipe(
  rawText: string,
  mainProtein: string
): Promise<RecipeAIAnalysis> {
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout (LLM can be slow)

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/analyze-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText,
          mainProtein,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 2 minutes. The AI server may be slow or unreachable. Please try again.');
      }
      if (fetchError.message?.includes('Network request failed') || fetchError.message?.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to API server at ${API_BASE_URL}. Please check:\n- The backend API is running\n- The API URL is correct in your .env file\n- Your device can reach the server`);
      }
      throw new Error(`Network error: ${fetchError.message || 'Unknown error'}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `API error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data: RecipeAIAnalysis = await response.json();

    // Validate and normalize the response
    return {
      ingredients: Array.isArray(data.ingredients) 
        ? data.ingredients.map((ing: any) => ({
            name: ing.name || String(ing),
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
          }))
        : [],
      steps: Array.isArray(data.steps) 
        ? data.steps.map((s: any) => String(s))
        : [],
      gadgets: Array.isArray(data.gadgets) 
        ? data.gadgets.map((g: any) => String(g))
        : [],
      total_time_minutes: typeof data.total_time_minutes === 'number' 
        ? data.total_time_minutes 
        : null,
      oven_time_minutes: typeof data.oven_time_minutes === 'number' 
        ? data.oven_time_minutes 
        : null,
    };
  } catch (error) {
    console.error('Error analyzing recipe:', error);
    // Re-throw with user-friendly message if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap in a generic error
    throw new Error('Failed to analyze recipe. Please check your API server connection.');
  }
}

