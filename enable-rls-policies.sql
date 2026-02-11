-- ============================================================================
-- Enable Row Level Security (RLS) on recipes table
-- This SQL script enables RLS and creates policies
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Enable RLS on the recipes table
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTION A: Authenticated Users Only (RECOMMENDED - Most Secure)
-- Use this if you want to add authentication to your app
-- ============================================================================

-- Step 2A: Revoke public access (safety measure)
REVOKE ALL ON TABLE public.recipes FROM PUBLIC;
REVOKE ALL ON SEQUENCE public.recipes_id_seq FROM PUBLIC;

-- Step 3A: Grant necessary permissions to authenticated role
GRANT ALL ON TABLE public.recipes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.recipes_id_seq TO authenticated;

-- Step 4A: Create policies for authenticated users
-- These policies allow all authenticated users to read, create, update, and delete recipes

-- SELECT policy: All authenticated users can read all recipes
CREATE POLICY "recipes_select_authenticated" ON public.recipes
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policy: All authenticated users can create recipes
CREATE POLICY "recipes_insert_authenticated" ON public.recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE policy: All authenticated users can update any recipe
CREATE POLICY "recipes_update_authenticated" ON public.recipes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE policy: All authenticated users can delete any recipe
CREATE POLICY "recipes_delete_authenticated" ON public.recipes
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- OPTION B: Anonymous Access (Less Secure, but works with current app)
-- Use this ONLY if you want to keep anonymous access without adding auth
-- This is safer than no RLS, but still allows anyone with your anon key
-- ============================================================================
-- 
-- If you choose Option B, comment out Option A (steps 2A-4A above) and uncomment below:
--
-- -- Step 2B: Grant necessary permissions to anonymous role
-- GRANT ALL ON TABLE public.recipes TO anon;
-- GRANT USAGE, SELECT ON SEQUENCE public.recipes_id_seq TO anon;
-- 
-- -- Step 3B: Create policies for anonymous users
-- CREATE POLICY "recipes_all_anonymous" ON public.recipes
--   FOR ALL
--   TO anon
--   USING (true)
--   WITH CHECK (true);
--
-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 
-- Option A (Authenticated):
--   - Most secure: Only authenticated users can access recipes
--   - Requires: Adding authentication to your app (Supabase Auth)
--   - Recommended for production apps
--
-- Option B (Anonymous):
--   - Works with your current app setup (no auth required)
--   - Less secure: Anyone with your Supabase URL and anon key can access
--   - Better than no RLS, but still a security risk
--   - Consider restricting anon key exposure or using API keys
--
-- ============================================================================

