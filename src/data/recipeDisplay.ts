import type { Recipe } from "@/types/recipe";
import type { CustomProtein } from "@/api/categories";
import { MAIN_PROTEINS } from "@/lib/constants";

/** One row in the recipe book category grid (built-in, custom from DB, or inferred from recipes). */
export interface RecipeBookCategoryRow {
  value: string;
  label: string;
  emoji: string;
  builtIn: boolean;
}

/**
 * Built-in proteins first (constants order), then custom from Supabase (by label),
 * then any main_protein values on recipes not already listed (legacy / deleted custom).
 */
export function buildRecipeBookCategories(
  customProteins: CustomProtein[],
  recipeMainProteins: string[]
): RecipeBookCategoryRow[] {
  const builtInRows: RecipeBookCategoryRow[] = MAIN_PROTEINS.map((p) => ({
    value: p.value,
    label: p.label,
    emoji: p.icon,
    builtIn: true,
  }));

  const seen = new Set(builtInRows.map((r) => r.value));

  const customRows: RecipeBookCategoryRow[] = customProteins
    .filter((c) => c.value && !seen.has(c.value))
    .map((c) => {
      seen.add(c.value);
      return {
        value: c.value,
        label: c.label,
        emoji: c.icon?.trim() || "🍽️",
        builtIn: false,
      };
    });
  customRows.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

  const orphanValues = [...new Set(recipeMainProteins)]
    .filter((v) => v && !seen.has(v))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const orphanRows: RecipeBookCategoryRow[] = orphanValues.map((value) => ({
    value,
    label: value,
    emoji: "🍽️",
    builtIn: false,
  }));

  return [...builtInRows, ...customRows, ...orphanRows];
}

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
