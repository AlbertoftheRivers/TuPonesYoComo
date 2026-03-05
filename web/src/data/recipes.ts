export type { Recipe } from "@/types/recipe";
export {
  CUISINES,
  CATEGORIES,
  PROTEIN_LABELS,
} from "@/types/recipe";

/** No static sample data; recipes come from Supabase via api/recipes */
export const SAMPLE_RECIPES: import("@/types/recipe").Recipe[] = [];
