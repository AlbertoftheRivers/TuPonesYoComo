-- Remove CHECK constraint on main_protein to allow custom categories
-- Run this SQL in your Supabase SQL Editor

-- Drop the constraint if it exists
ALTER TABLE public.recipes 
DROP CONSTRAINT IF EXISTS recipes_main_protein_check;

-- Verify the constraint is removed
-- You can check with: SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'recipes' AND constraint_name LIKE '%main_protein%';

