import { MAIN_PROTEINS, CUISINES } from './constants';
import { 
  getCustomProteins, 
  getCustomCuisines, 
  addCustomProtein as addCustomProteinToDB,
  addCustomCuisine as addCustomCuisineToDB,
  CustomProtein as DBCustomProtein,
  CustomCuisine as DBCustomCuisine
} from '../api/categories';

export interface CustomProtein {
  value: string;
  label: string;
  icon: string;
}

export interface CustomCuisine {
  value: string;
  label: string;
  flag: string;
}

// Get all proteins (default + custom from database)
export async function getAllProteins(): Promise<Array<{ value: string; label: string; icon: string }>> {
  try {
    console.log('📡 [CUSTOM_CATEGORIES] Fetching custom proteins from Supabase...');
    const customProteins = await getCustomProteins();
    console.log('✅ [CUSTOM_CATEGORIES] Fetched', customProteins.length, 'custom proteins');
    const customProteinsFormatted = customProteins.map(p => ({
      value: p.value,
      label: p.label,
      icon: p.icon,
    }));
    
    const allProteins = [...MAIN_PROTEINS, ...customProteinsFormatted];
    console.log('✅ [CUSTOM_CATEGORIES] Total proteins:', allProteins.length, '(default:', MAIN_PROTEINS.length, '+ custom:', customProteinsFormatted.length, ')');
    return allProteins;
  } catch (error) {
    console.error('❌ [CUSTOM_CATEGORIES] Error loading custom proteins:', error);
    // Fallback to default if database fails
    return MAIN_PROTEINS;
  }
}

// Get all cuisines (default + custom from database)
export async function getAllCuisines(): Promise<Array<{ value: string; label: string; flag: string }>> {
  try {
    const customCuisines = await getCustomCuisines();
    const customCuisinesFormatted = customCuisines.map(c => ({
      value: c.value,
      label: c.label,
      flag: c.flag,
    }));
    
    return [...CUISINES, ...customCuisinesFormatted];
  } catch (error) {
    console.error('Error loading custom cuisines:', error);
    // Fallback to default if database fails
    return CUISINES;
  }
}

// Add custom protein
export async function addCustomProtein(protein: CustomProtein): Promise<void> {
  try {
    console.log('💾 [CUSTOM_CATEGORIES] Adding custom protein to Supabase:', protein);
    // Check if conflicts with default
    if (MAIN_PROTEINS.some(p => p.value === protein.value)) {
      throw new Error('Esta categoría ya existe en las categorías predeterminadas');
    }
    
    const result = await addCustomProteinToDB(protein);
    console.log('✅ [CUSTOM_CATEGORIES] Custom protein added to Supabase:', result);
  } catch (error: any) {
    console.error('❌ [CUSTOM_CATEGORIES] Error adding custom protein:', error);
    console.error('❌ [CUSTOM_CATEGORIES] Error details:', error?.message, error?.code);
    throw error;
  }
}

// Add custom cuisine
export async function addCustomCuisine(cuisine: CustomCuisine): Promise<void> {
  try {
    // Check if conflicts with default
    if (CUISINES.some(c => c.value === cuisine.value)) {
      throw new Error('Esta cocina ya existe en las cocinas predeterminadas');
    }
    
    await addCustomCuisineToDB(cuisine);
  } catch (error) {
    console.error('Error adding custom cuisine:', error);
    throw error;
  }
}

