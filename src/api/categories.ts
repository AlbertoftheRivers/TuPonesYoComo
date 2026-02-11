import { supabase } from '../lib/supabase';

export interface CustomProtein {
  id?: number;
  value: string;
  label: string;
  icon: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomCuisine {
  id?: number;
  value: string;
  label: string;
  flag: string;
  created_at?: string;
  updated_at?: string;
}

// Get all custom proteins
export async function getCustomProteins(): Promise<CustomProtein[]> {
  try {
    console.log('📡 [API] Fetching custom proteins from Supabase...');
    const { data, error } = await supabase
      .from('custom_proteins')
      .select('*')
      .order('label', { ascending: true });

    if (error) {
      console.error('❌ [API] Supabase error fetching custom proteins:', error);
      console.error('❌ [API] Error code:', error.code);
      console.error('❌ [API] Error message:', error.message);
      console.error('❌ [API] Error details:', error.details);
      throw error;
    }

    console.log('✅ [API] Fetched custom proteins:', data?.length || 0, 'items');
    return data || [];
  } catch (error) {
    console.error('❌ [API] Error fetching custom proteins:', error);
    throw error;
  }
}

// Get all custom cuisines
export async function getCustomCuisines(): Promise<CustomCuisine[]> {
  try {
    console.log('📡 [API] Fetching custom cuisines from Supabase...');
    const { data, error } = await supabase
      .from('custom_cuisines')
      .select('*')
      .order('label', { ascending: true });

    if (error) {
      console.error('❌ [API] Supabase error fetching custom cuisines:', error);
      console.error('❌ [API] Error code:', error.code);
      console.error('❌ [API] Error message:', error.message);
      console.error('❌ [API] Error details:', error.details);
      throw error;
    }

    console.log('✅ [API] Fetched custom cuisines:', data?.length || 0, 'items');
    return data || [];
  } catch (error) {
    console.error('❌ [API] Error fetching custom cuisines:', error);
    throw error;
  }
}

// Add custom protein
export async function addCustomProtein(protein: Omit<CustomProtein, 'id' | 'created_at' | 'updated_at'>): Promise<CustomProtein> {
  try {
    const { data, error } = await supabase
      .from('custom_proteins')
      .insert({
        value: protein.value,
        label: protein.label,
        icon: protein.icon,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error adding custom protein:', error);
    throw error;
  }
}

// Add custom cuisine
export async function addCustomCuisine(cuisine: Omit<CustomCuisine, 'id' | 'created_at' | 'updated_at'>): Promise<CustomCuisine> {
  try {
    const { data, error } = await supabase
      .from('custom_cuisines')
      .insert({
        value: cuisine.value,
        label: cuisine.label,
        flag: cuisine.flag,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error adding custom cuisine:', error);
    throw error;
  }
}

// Update custom protein
export async function updateCustomProtein(id: number, updates: Partial<Omit<CustomProtein, 'id' | 'created_at' | 'updated_at'>>): Promise<CustomProtein> {
  try {
    const { data, error } = await supabase
      .from('custom_proteins')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating custom protein:', error);
    throw error;
  }
}

// Update custom cuisine
export async function updateCustomCuisine(id: number, updates: Partial<Omit<CustomCuisine, 'id' | 'created_at' | 'updated_at'>>): Promise<CustomCuisine> {
  try {
    const { data, error } = await supabase
      .from('custom_cuisines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating custom cuisine:', error);
    throw error;
  }
}

// Delete custom protein
export async function deleteCustomProtein(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('custom_proteins')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting custom protein:', error);
    throw error;
  }
}

// Delete custom cuisine
export async function deleteCustomCuisine(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('custom_cuisines')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting custom cuisine:', error);
    throw error;
  }
}

