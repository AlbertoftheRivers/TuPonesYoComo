import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? "";

function getClient() {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  console.warn("Supabase credentials not set. Using placeholder.");
  return createClient("https://placeholder.supabase.co", "placeholder-key");
}

export const supabase = getClient();
