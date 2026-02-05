export type MainProtein = 
  | 'chicken' 
  | 'fish' 
  | 'pork' 
  | 'seafood' 
  | 'beef' 
  | 'vegetables' 
  | 'beans_legumes' 
  | 'other';

export interface Ingredient {
  name: string;
  quantity?: number | string;
  unit?: string;
  notes?: string;
}

export interface Recipe {
  id: string | number;
  title: string;
  main_protein: MainProtein;
  raw_text: string;
  ingredients: Ingredient[];
  steps: string[];
  gadgets: string[];
  total_time_minutes: number | null;
  oven_time_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeInsertPayload {
  title: string;
  main_protein: MainProtein;
  raw_text: string;
  ingredients: Ingredient[];
  steps: string[];
  gadgets: string[];
  total_time_minutes: number | null;
  oven_time_minutes: number | null;
}

export interface RecipeAIAnalysis {
  ingredients: Ingredient[];
  steps: string[];
  gadgets: string[];
  total_time_minutes: number | null;
  oven_time_minutes: number | null;
}

