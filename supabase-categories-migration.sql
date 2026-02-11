-- Migration for Custom Categories and Cuisines
-- Run this SQL in your Supabase SQL Editor

-- Create custom_proteins table
CREATE TABLE IF NOT EXISTS public.custom_proteins (
  id BIGSERIAL PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create custom_cuisines table
CREATE TABLE IF NOT EXISTS public.custom_cuisines (
  id BIGSERIAL PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  flag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_proteins_value ON public.custom_proteins(value);
CREATE INDEX IF NOT EXISTS idx_custom_cuisines_value ON public.custom_cuisines(value);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_custom_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_proteins_updated_at
  BEFORE UPDATE ON public.custom_proteins
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_updated_at_column();

CREATE TRIGGER update_custom_cuisines_updated_at
  BEFORE UPDATE ON public.custom_cuisines
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_updated_at_column();

-- Disable Row Level Security (RLS) for this personal app
ALTER TABLE public.custom_proteins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_cuisines DISABLE ROW LEVEL SECURITY;

