-- Migration: Expand one_rupee_poojas for combo and faqs
-- Date: 2026-05-31

-- Add Combo Offer and FAQs columns (JSONB)
ALTER TABLE public.one_rupee_poojas
ADD COLUMN IF NOT EXISTS combo_offer JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;
