export type MainProtein = 
  | 'chicken' 
  | 'fish' 
  | 'pork' 
  | 'seafood' 
  | 'beef' 
  | 'vegetables' 
  | 'beans_legumes' 
  | 'desserts'
  | 'guisos'
  | 'other';

export type Cuisine = 
  | 'española'
  | 'italiana'
  | 'mexicana'
  | 'francesa'
  | 'asiática'
  | 'mediterránea'
  | 'americana'
  | 'india'
  | 'japonesa'
  | 'tailandesa'
  | 'griega'
  | 'turca'
  | 'marroquí'
  | 'otra';

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
  cuisine?: Cuisine;
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
  cuisine?: Cuisine;
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


