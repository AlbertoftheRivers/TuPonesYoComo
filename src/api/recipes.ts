import { supabase } from '../lib/supabase';
import { Recipe, RecipeInsertPayload, MainProtein, Cuisine } from '../types/recipe';

export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(normalizeRecipe);
  } catch (error) {
    console.error('Error fetching all recipes:', error);
    throw error;
  }
}

export async function getRecipesByProtein(mainProtein: MainProtein): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('main_protein', mainProtein)
      .order('title', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(normalizeRecipe);
  } catch (error) {
    console.error('Error fetching recipes by protein:', error);
    throw error;
  }
}

export async function getRecipeById(id: string | number): Promise<Recipe | null> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }

    return data ? normalizeRecipe(data) : null;
  } catch (error) {
    console.error('Error fetching recipe by id:', error);
    throw error;
  }
}

export async function createRecipe(payload: RecipeInsertPayload): Promise<Recipe> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        title: payload.title,
        main_protein: payload.main_protein,
        cuisines: payload.cuisines || [],
        raw_text: payload.raw_text,
        ingredients: payload.ingredients,
        steps: payload.steps,
        gadgets: payload.gadgets,
        total_time_minutes: payload.total_time_minutes,
        oven_time_minutes: payload.oven_time_minutes,
        servings: payload.servings || 2,
        added_by: payload.added_by ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return normalizeRecipe(data);
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
}

export async function updateRecipe(
  id: string | number,
  payload: Partial<RecipeInsertPayload>
): Promise<Recipe> {
  try {
    // Prepare update payload, ensuring cuisines is handled correctly
    const updatePayload: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };
    
    // Ensure cuisines is an array or undefined (not null)
    if ('cuisines' in payload) {
      updatePayload.cuisines = payload.cuisines || [];
    }

    const { data, error } = await supabase
      .from('recipes')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return normalizeRecipe(data);
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
}

export async function deleteRecipe(id: string | number): Promise<void> {
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
}

/** Get one random recipe from the database (for "Surprise me" feature) */
export async function getRandomRecipe(): Promise<Recipe | null> {
  try {
    const all = await getAllRecipes();
    if (all.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * all.length);
    return all[randomIndex];
  } catch (error) {
    console.error('Error fetching random recipe:', error);
    return null;
  }
}

/** Get most recently added recipes (by created_at desc) for home "Recent Recipes" section */
export async function getRecentRecipes(limit: number = 8): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(normalizeRecipe);
  } catch (error) {
    console.error('Error fetching recent recipes:', error);
    return [];
  }
}

/**
 * Find stored recipes that match a list of ingredients (e.g. "what's in my fridge").
 * Scores by how many of the given ingredients appear in each recipe; returns sorted by match count.
 */
export async function getRecipesByIngredients(userIngredients: string[]): Promise<Recipe[]> {
  const all = await getAllRecipes();
  const terms = userIngredients.map((i) => i.trim().toLowerCase()).filter(Boolean);
  if (terms.length === 0) return all;

  const scored = all.map((recipe) => {
    const names = recipe.ingredients.map((ing) => (ing.name || '').toLowerCase());
    let matches = 0;
    for (const term of terms) {
      if (names.some((n) => n.includes(term) || term.includes(n))) matches++;
    }
    return { recipe, score: matches };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.recipe);
}
function normalizeRecipe(data: any): Recipe {
  // Handle both old format (cuisine as string) and new format (cuisines as array)
  let cuisines: Cuisine[] | undefined = undefined;
  if (data.cuisines) {
    try {
      cuisines = typeof data.cuisines === 'string' ? JSON.parse(data.cuisines) : data.cuisines;
    } catch {
      cuisines = Array.isArray(data.cuisines) ? data.cuisines : undefined;
    }
  } else if (data.cuisine) {
    // Legacy support: convert old single cuisine to array
    cuisines = [data.cuisine];
  }

  return {
    id: data.id,
    title: data.title || '',
    main_protein: data.main_protein,
    cuisines: cuisines,
    raw_text: data.raw_text || '',
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
    steps: Array.isArray(data.steps) ? data.steps : [],
    gadgets: Array.isArray(data.gadgets) ? data.gadgets : [],
    total_time_minutes: data.total_time_minutes ?? null,
    oven_time_minutes: data.oven_time_minutes ?? null,
    servings: data.servings ?? 2,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
    added_by: data.added_by ?? null,
  };
}
