-- Migration: Add custom package fields for Single and Family packages
-- Date: 2026-05-31

ALTER TABLE public.one_rupee_poojas
ADD COLUMN IF NOT EXISTS single_title TEXT DEFAULT 'Single Sankalp',
ADD COLUMN IF NOT EXISTS single_description TEXT DEFAULT 'Individual name & gotra Sankalp + Holy Prasad transit box.',
ADD COLUMN IF NOT EXISTS single_price TEXT DEFAULT '₹1',
ADD COLUMN IF NOT EXISTS single_original_price TEXT DEFAULT '₹751',
ADD COLUMN IF NOT EXISTS family_title TEXT DEFAULT 'Family Pariwar',
ADD COLUMN IF NOT EXISTS family_description TEXT DEFAULT 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
ADD COLUMN IF NOT EXISTS family_price TEXT DEFAULT '₹2',
ADD COLUMN IF NOT EXISTS family_original_price TEXT DEFAULT '₹1502';

-- Enable Supabase Realtime for ₹1 poojas table
ALTER PUBLICATION supabase_realtime ADD TABLE public.one_rupee_poojas;

