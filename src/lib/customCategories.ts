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
    const customProteins = await getCustomProteins();
    const customProteinsFormatted = customProteins.map(p => ({
      value: p.value,
      label: p.label,
      icon: p.icon,
    }));
    
    return [...MAIN_PROTEINS, ...customProteinsFormatted];
  } catch (error) {
    console.error('Error loading custom proteins:', error);
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
    // Check if conflicts with default
    if (MAIN_PROTEINS.some(p => p.value === protein.value)) {
      throw new Error('Esta categoría ya existe en las categorías predeterminadas');
    }
    
    await addCustomProteinToDB(protein);
  } catch (error) {
    console.error('Error adding custom protein:', error);
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

