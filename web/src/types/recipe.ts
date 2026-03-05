/**
 * Lovable UI recipe shape (used by Index, FridgePanel, RecipeDetail, RecipeBookModal).
 * Supabase stores a different shape; we adapt in api/recipes.ts.
 */
export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  category: string;
  ingredients: string[];
  instructions: string;
  time: string;
  servings: number;
  image: string;
}

/** Main protein / category from Supabase -> display label and emoji */
export const PROTEIN_LABELS: Record<string, { label: string; emoji: string }> = {
  chicken: { label: "Chicken", emoji: "🐔" },
  fish: { label: "Fish", emoji: "🐟" },
  pork: { label: "Pork", emoji: "🐷" },
  seafood: { label: "Seafood", emoji: "🦐" },
  beef: { label: "Beef", emoji: "🐄" },
  vegetables: { label: "Vegetables", emoji: "🥕" },
  beans_legumes: { label: "Beans & Legumes", emoji: "🫘" },
  desserts: { label: "Desserts", emoji: "🍰" },
  guisos: { label: "Stews", emoji: "🍲" },
};

export const CUISINES = [
  "Italian",
  "Mexican",
  "Japanese",
  "Indian",
  "French",
  "Thai",
  "American",
  "Mediterranean",
  "Spanish",
  "Chinese",
];

export const CATEGORIES = Object.entries(PROTEIN_LABELS).map(([value, { label, emoji }]) => ({
  name: label,
  value,
  emoji,
}));
