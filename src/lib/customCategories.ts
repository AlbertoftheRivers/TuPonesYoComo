import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAIN_PROTEINS, CUISINES } from './constants';

const CUSTOM_PROTEINS_KEY = '@tuponesyocomo:custom_proteins';
const CUSTOM_CUISINES_KEY = '@tuponesyocomo:custom_cuisines';

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

// Get all proteins (default + custom)
export async function getAllProteins(): Promise<Array<{ value: string; label: string; icon: string }>> {
  try {
    const customProteinsJson = await AsyncStorage.getItem(CUSTOM_PROTEINS_KEY);
    const customProteins: CustomProtein[] = customProteinsJson ? JSON.parse(customProteinsJson) : [];
    
    return [...MAIN_PROTEINS, ...customProteins];
  } catch (error) {
    console.error('Error loading custom proteins:', error);
    return MAIN_PROTEINS;
  }
}

// Get all cuisines (default + custom)
export async function getAllCuisines(): Promise<Array<{ value: string; label: string; flag: string }>> {
  try {
    const customCuisinesJson = await AsyncStorage.getItem(CUSTOM_CUISINES_KEY);
    const customCuisines: CustomCuisine[] = customCuisinesJson ? JSON.parse(customCuisinesJson) : [];
    
    return [...CUISINES, ...customCuisines];
  } catch (error) {
    console.error('Error loading custom cuisines:', error);
    return CUISINES;
  }
}

// Add custom protein
export async function addCustomProtein(protein: CustomProtein): Promise<void> {
  try {
    const customProteinsJson = await AsyncStorage.getItem(CUSTOM_PROTEINS_KEY);
    const customProteins: CustomProtein[] = customProteinsJson ? JSON.parse(customProteinsJson) : [];
    
    // Check if already exists
    if (customProteins.some(p => p.value === protein.value)) {
      throw new Error('Esta categoría ya existe');
    }
    
    // Check if conflicts with default
    if (MAIN_PROTEINS.some(p => p.value === protein.value)) {
      throw new Error('Esta categoría ya existe en las categorías predeterminadas');
    }
    
    customProteins.push(protein);
    await AsyncStorage.setItem(CUSTOM_PROTEINS_KEY, JSON.stringify(customProteins));
  } catch (error) {
    console.error('Error adding custom protein:', error);
    throw error;
  }
}

// Add custom cuisine
export async function addCustomCuisine(cuisine: CustomCuisine): Promise<void> {
  try {
    const customCuisinesJson = await AsyncStorage.getItem(CUSTOM_CUISINES_KEY);
    const customCuisines: CustomCuisine[] = customCuisinesJson ? JSON.parse(customCuisinesJson) : [];
    
    // Check if already exists
    if (customCuisines.some(c => c.value === cuisine.value)) {
      throw new Error('Esta cocina ya existe');
    }
    
    // Check if conflicts with default
    if (CUISINES.some(c => c.value === cuisine.value)) {
      throw new Error('Esta cocina ya existe en las cocinas predeterminadas');
    }
    
    customCuisines.push(cuisine);
    await AsyncStorage.setItem(CUSTOM_CUISINES_KEY, JSON.stringify(customCuisines));
  } catch (error) {
    console.error('Error adding custom cuisine:', error);
    throw error;
  }
}

