import { RecipeAIAnalysis, Ingredient } from '../types/recipe';

const OLLAMA_BASE_URL = process.env.EXPO_PUBLIC_OLLAMA_BASE_URL || 'http://192.168.200.45:11434';
const OLLAMA_MODEL = process.env.EXPO_PUBLIC_OLLAMA_MODEL || 'llama3.2:3b';

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  format?: string;
}

export interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * Analyzes raw recipe text and extracts structured data using Ollama LLM
 */
export async function analyzeRecipe(
  rawText: string,
  mainProtein: string
): Promise<RecipeAIAnalysis> {
  const systemPrompt = `You are a recipe analysis assistant. Your task is to extract structured information from raw recipe text and return it as valid JSON.

The JSON schema you must return is:
{
  "ingredients": [
    {
      "name": "string (required)",
      "quantity": "number or string (optional)",
      "unit": "string (optional)",
      "notes": "string (optional)"
    }
  ],
  "steps": ["string (ordered list of cooking instructions)"],
  "gadgets": ["string (list of kitchen tools/equipment needed)"],
  "total_time_minutes": number or null (approximate total recipe time),
  "oven_time_minutes": number or null (approximate oven time if relevant, otherwise null)
}

Rules:
- Extract all ingredients with their quantities and units if mentioned
- Break down the recipe into clear, ordered steps
- List all kitchen tools/gadgets needed (e.g., "oven", "pan", "blender", "knife")
- Estimate total_time_minutes as the approximate time for the entire recipe
- Only set oven_time_minutes if the recipe uses an oven; otherwise set to null
- Return ONLY valid JSON, no additional text or markdown formatting
- If information is missing, use reasonable defaults (empty arrays, null for times)`;

  const userPrompt = `Analyze this recipe for ${mainProtein}:

${rawText}

Extract the ingredients, steps, gadgets, and time estimates. Return the result as JSON matching the schema above.`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        format: 'json',
      } as OllamaChatRequest),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data: OllamaChatResponse = await response.json();
    
    if (!data.message || !data.message.content) {
      throw new Error('Invalid response from Ollama: missing message content');
    }

    // Parse the JSON response
    let parsed: RecipeAIAnalysis;
    try {
      parsed = JSON.parse(data.message.content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks if present
      const content = data.message.content.trim();
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       content.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON from Ollama response');
      }
    }

    // Validate and normalize the response
    return {
      ingredients: Array.isArray(parsed.ingredients) 
        ? parsed.ingredients.map((ing: any) => ({
            name: ing.name || String(ing),
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
          }))
        : [],
      steps: Array.isArray(parsed.steps) 
        ? parsed.steps.map((s: any) => String(s))
        : [],
      gadgets: Array.isArray(parsed.gadgets) 
        ? parsed.gadgets.map((g: any) => String(g))
        : [],
      total_time_minutes: typeof parsed.total_time_minutes === 'number' 
        ? parsed.total_time_minutes 
        : null,
      oven_time_minutes: typeof parsed.oven_time_minutes === 'number' 
        ? parsed.oven_time_minutes 
        : null,
    };
  } catch (error) {
    console.error('Error analyzing recipe with Ollama:', error);
    throw error;
  }
}

