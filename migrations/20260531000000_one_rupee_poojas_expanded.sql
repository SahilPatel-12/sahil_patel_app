-- Migration: Expand one_rupee_poojas for detailed content and drafts
-- Date: 2026-05-31

-- Add status column
ALTER TABLE public.one_rupee_poojas
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- Add detail content columns
ALTER TABLE public.one_rupee_poojas
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS steps TEXT,
ADD COLUMN IF NOT EXISTS samagri TEXT,
ADD COLUMN IF NOT EXISTS pandit TEXT,
ADD COLUMN IF NOT EXISTS temple TEXT,
ADD COLUMN IF NOT EXISTS prasad TEXT,
ADD COLUMN IF NOT EXISTS other_info TEXT;

-- Add translations column (JSONB)
ALTER TABLE public.one_rupee_poojas
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
