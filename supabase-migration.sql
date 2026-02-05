-- MyRecipes Supabase Migration
-- Run this SQL in your Supabase SQL Editor

-- Create the recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  main_protein TEXT NOT NULL CHECK (main_protein IN ('chicken', 'fish', 'pork', 'seafood', 'beef', 'vegetables', 'beans_legumes', 'desserts', 'guisos', 'other')),
  cuisines JSONB DEFAULT '[]'::jsonb,
  raw_text TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  gadgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_time_minutes INTEGER,
  oven_time_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on main_protein for faster filtering
CREATE INDEX IF NOT EXISTS idx_recipes_main_protein ON public.recipes(main_protein);

-- Create an index on title for faster sorting
CREATE INDEX IF NOT EXISTS idx_recipes_title ON public.recipes(title);

-- Migrate existing cuisine column to cuisines array (if column exists)
-- Run this only if you have existing data with the old 'cuisine' column
-- ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS cuisines JSONB DEFAULT '[]'::jsonb;
-- UPDATE public.recipes SET cuisines = CASE WHEN cuisine IS NOT NULL THEN jsonb_build_array(cuisine) ELSE '[]'::jsonb END WHERE cuisines IS NULL;
-- ALTER TABLE public.recipes DROP COLUMN IF EXISTS cuisine;

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at on row updates
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Disable Row Level Security (RLS) for this personal app
-- This allows anonymous access to all operations
ALTER TABLE public.recipes DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS enabled but allow all operations,
-- you can use these policies instead:
-- 
-- CREATE POLICY "Allow all operations for anonymous users" ON public.recipes
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- Grant necessary permissions to anon role
GRANT ALL ON public.recipes TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.recipes_id_seq TO anon;


