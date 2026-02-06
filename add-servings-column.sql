-- Add servings column to recipes table
-- Run this SQL in your Supabase SQL Editor

-- Add the servings column if it doesn't exist
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS servings INTEGER DEFAULT 2;

-- Update existing recipes to have default servings of 2
UPDATE public.recipes 
SET servings = 2 
WHERE servings IS NULL;

