-- Migration: Drop image alignment adjustments from god_images table
-- Date: 2026-06-09

ALTER TABLE public.god_images 
DROP COLUMN IF EXISTS resize_mode,
DROP COLUMN IF EXISTS margin_top;
