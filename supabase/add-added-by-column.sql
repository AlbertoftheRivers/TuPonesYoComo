-- Add added_by column to recipes table (name of person who added the recipe)
-- Run this in Supabase SQL Editor after the main migration

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS added_by TEXT;

COMMENT ON COLUMN public.recipes.added_by IS 'Name of the person who added this recipe';
