-- Migration: Add custom sorting/numbering indexes for ₹1 poojas
-- Date: 2026-05-31

ALTER TABLE public.one_rupee_poojas
ADD COLUMN IF NOT EXISTS sort_order_home INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sort_order_puja INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sort_order_store INTEGER DEFAULT NULL;
