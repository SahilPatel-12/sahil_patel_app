-- Migration: Drop global unique constraint on offer_pujas slug
-- Date: 2026-06-01

ALTER TABLE public.offer_pujas DROP CONSTRAINT IF EXISTS offer_pujas_slug_key;
