-- Add cuisines column to existing recipes table
-- Run this SQL in your Supabase SQL Editor

-- Add the cuisines column if it doesn't exist
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS cuisines JSONB DEFAULT '[]'::jsonb;

-- If you have existing data with a 'cuisine' column (singular), migrate it:
-- First, check if the old column exists:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'recipes' AND column_name = 'cuisine';

-- If the old 'cuisine' column exists, run this to migrate:
-- UPDATE public.recipes 
-- SET cuisines = CASE 
--   WHEN cuisine IS NOT NULL AND cuisine != '' THEN jsonb_build_array(cuisine) 
--   ELSE '[]'::jsonb 
-- END 
-- WHERE cuisines IS NULL OR cuisines = '[]'::jsonb;

-- After migration, you can drop the old column:
-- ALTER TABLE public.recipes DROP COLUMN IF EXISTS cuisine;

-- Refresh the schema cache (Supabase will do this automatically, but you can force it)
-- by running a simple query like: SELECT * FROM public.recipes LIMIT 1;

