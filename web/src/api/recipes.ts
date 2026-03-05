import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api";
import type { Recipe } from "@/types/recipe";
import { PROTEIN_LABELS } from "@/types/recipe";

/** Supabase row shape */
interface SupabaseRecipe {
  id: string | number;
  title: string;
  main_protein: string;
  cuisines?: string[] | null;
  raw_text?: string;
  ingredients: Array<{ name: string; quantity?: number | string; unit?: string }>;
  steps: string[];
  gadgets?: string[];
  total_time_minutes: number | null;
  oven_time_minutes?: number | null;
  servings: number;
  created_at?: string;
  updated_at?: string;
  added_by?: string | null;
}

function toLovableRecipe(r: SupabaseRecipe): Recipe {
  const cuisine = Array.isArray(r.cuisines) && r.cuisines.length > 0 ? r.cuisines[0] : "—";
  const info = PROTEIN_LABELS[r.main_protein] || { label: r.main_protein, emoji: "🍽️" };
  const time =
    r.total_time_minutes != null ? `${r.total_time_minutes} min` : "—";
  return {
    id: String(r.id),
    title: r.title || "",
    cuisine,
    category: info.label,
    ingredients: (r.ingredients || []).map((i) => (typeof i === "string" ? i : i.name)),
    instructions: (r.steps || []).join("\n\n"),
    time,
    servings: r.servings ?? 2,
    image: info.emoji,
  };
}

export async function getAllRecipes(): Promise<Recipe[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("title", { ascending: true });
  if (error) throw error;
  return (data || []).map(toLovableRecipe);
}

export async function getRecentRecipes(limit = 8): Promise<Recipe[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map(toLovableRecipe);
}

export async function getRecipesByIngredients(userIngredients: string[]): Promise<Recipe[]> {
  const all = await getAllRecipes();
  const terms = userIngredients.map((i) => i.trim().toLowerCase()).filter(Boolean);
  if (terms.length === 0) return all;
  const scored = all.map((recipe) => {
    const names = recipe.ingredients.map((i) => i.toLowerCase());
    let matches = 0;
    for (const term of terms) {
      if (names.some((n) => n.includes(term) || term.includes(n))) matches++;
    }
    return { recipe, score: matches };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.recipe);
}

export async function getRecipesByCategory(mainProtein: string): Promise<Recipe[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("main_protein", mainProtein)
    .order("title", { ascending: true });
  if (error) throw error;
  return (data || []).map(toLovableRecipe);
}

/** Create recipe in Supabase (payload from Add Recipe form or AI analysis) */
export async function createRecipe(payload: {
  title: string;
  main_protein: string;
  cuisines?: string[];
  raw_text: string;
  ingredients: Array<{ name: string; quantity?: number | string; unit?: string }>;
  steps: string[];
  gadgets?: string[];
  total_time_minutes: number | null;
  oven_time_minutes?: number | null;
  servings: number;
  added_by?: string | null;
}): Promise<Recipe> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: payload.title,
      main_protein: payload.main_protein,
      cuisines: payload.cuisines || [],
      raw_text: payload.raw_text,
      ingredients: payload.ingredients,
      steps: payload.steps,
      gadgets: payload.gadgets || [],
      total_time_minutes: payload.total_time_minutes,
      oven_time_minutes: payload.oven_time_minutes ?? null,
      servings: payload.servings ?? 2,
      added_by: payload.added_by ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toLovableRecipe(data);
}

/** Suggest recipe from ingredients via Ollama (backend) */
export async function suggestRecipeFromIngredients(ingredients: string[]): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/suggest-recipe-from-ingredients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || "Failed to get suggestion");
  }
  const data = await res.json();
  return typeof data.suggestion === "string" ? data.suggestion : "";
}

/** OCR: extract text from image (backend) */
export async function extractTextFromImage(
  file: File,
  language = "spa"
): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  form.append("language", language);
  const res = await fetch(`${API_BASE_URL}/api/ocr`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "OCR failed");
  }
  const data = await res.json();
  return data.text ?? "";
}

/** Transcribe audio (dictation) via backend Whisper */
export async function transcribeAudio(file: File, language = "spa"): Promise<string> {
  const form = new FormData();
  form.append("audio", file);
  form.append("language", language);
  const res = await fetch(`${API_BASE_URL}/api/transcribe`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Transcription failed");
  }
  const data = await res.json();
  return data.text ?? "";
}

/** Analyze raw recipe text with Ollama and return structured fields */
export async function analyzeRecipe(
  rawText: string,
  mainProtein: string
): Promise<{
  ingredients: Array<{ name: string; quantity?: number | string; unit?: string }>;
  steps: string[];
  gadgets: string[];
  total_time_minutes: number | null;
  oven_time_minutes: number | null;
}> {
  const res = await fetch(`${API_BASE_URL}/api/analyze-recipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText, mainProtein }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Analysis failed");
  }
  const data = await res.json();
  return {
    ingredients: data.ingredients || [],
    steps: data.steps || [],
    gadgets: data.gadgets || [],
    total_time_minutes: data.total_time_minutes ?? null,
    oven_time_minutes: data.oven_time_minutes ?? null,
  };
}
