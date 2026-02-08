import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client - use placeholder values if not configured to prevent crashes
// The app will show errors when trying to use Supabase, but won't crash on startup
let supabase;

try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '') {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    // Use placeholder to prevent crashes, but log warning
    console.warn('⚠️ Supabase credentials not configured. Using placeholder client. API calls will fail.');
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
  // Fallback to placeholder to prevent crash
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };

