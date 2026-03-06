import type { Recipe } from "@/types/recipe";
import { MAIN_PROTEINS } from "@/lib/constants";

/** Display model for the Loveable UI (title, cuisine string, time, servings, image emoji, etc.) */
export interface RecipeDisplay {
  id: string;
  title: string;
  cuisine: string;
  category: string;
  ingredients: string[];
  instructions: string;
  time: string;
  servings: number;
  image: string;
  /** Backend recipe for detail/edits */
  _recipe: Recipe;
}

const MAIN_PROTEIN_TO_EMOJI: Record<string, string> = Object.fromEntries(
  MAIN_PROTEINS.map((p) => [p.value, p.icon])
);

export function recipeToDisplay(r: Recipe): RecipeDisplay {
  const cuisine = Array.isArray(r.cuisines) && r.cuisines.length > 0
    ? r.cuisines[0]
    : "";
  const time =
    r.total_time_minutes != null ? `${r.total_time_minutes} min` : "—";
  const ingredients = (r.ingredients || []).map((i) =>
    typeof i === "string" ? i : (i.name || "")
  ).filter(Boolean);
  const instructions = Array.isArray(r.steps) ? r.steps.join("\n\n") : "";
  const image = MAIN_PROTEIN_TO_EMOJI[r.main_protein] ?? "🍽️";
  const category = MAIN_PROTEINS.find((p) => p.value === r.main_protein)?.label ?? r.main_protein ?? "";

  return {
    id: String(r.id),
    title: r.title || "",
    cuisine,
    category,
    ingredients,
    instructions,
    time,
    servings: r.servings ?? 2,
    image,
    _recipe: r,
  };
}

/** Categories for Recipe Book = main proteins with emoji and label */
export const CATEGORIES = MAIN_PROTEINS.map((p) => ({
  name: p.label,
  value: p.value,
  emoji: p.icon,
}));
