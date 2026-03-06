-- ============================================================================
-- Enable Row Level Security (RLS) for Anonymous Access
-- This works with your current app setup (no authentication required)
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Enable RLS on the recipes table
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Step 2: Grant necessary permissions to anonymous role
GRANT ALL ON TABLE public.recipes TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.recipes_id_seq TO anon;

-- Step 3: Create policies for anonymous users
-- This allows all anonymous users to read, create, update, and delete recipes
CREATE POLICY "recipes_all_anonymous" ON public.recipes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- NOTE: This configuration:
-- - ✅ Enables RLS (fixes the security advisor warning)
-- - ✅ Works with your current app (no auth changes needed)
-- - ✅ Allows all users with app access to edit recipes
-- - ⚠️  Still allows anyone with your Supabase URL and anon key to access
--
-- For better security, consider:
-- 1. Restricting your anon key exposure
-- 2. Using environment variables (already done)
-- 3. Adding authentication later (see enable-rls-policies.sql for Option A)
-- ============================================================================

