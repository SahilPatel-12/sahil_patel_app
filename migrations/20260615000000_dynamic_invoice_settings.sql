-- Migration: Add invoice_settings to poojas, products, and combo poojas, and seed global_invoice_settings
-- Date: 2026-06-15

-- 1. Alter tables to add JSONB column for invoice_settings
ALTER TABLE public.one_rupee_poojas ADD COLUMN IF NOT EXISTS invoice_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.general_poojas ADD COLUMN IF NOT EXISTS invoice_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.problem_poojas ADD COLUMN IF NOT EXISTS invoice_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.combo_poojas ADD COLUMN IF NOT EXISTS invoice_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.website_pooja_products ADD COLUMN IF NOT EXISTS invoice_settings JSONB DEFAULT '{}'::jsonb;

-- 2. Seed default global invoice settings row if not present
-- Note: ON CONFLICT is used to insert defaults, but does not overwrite user edits if it already exists.
INSERT INTO public.website_settings (key, value)
VALUES (
  'global_invoice_settings',
  '{
    "store_products": {
      "gst_percent": 0,
      "discount_percent": 0,
      "delivery_charge": 100,
      "delivery_free_above": 150
    },
    "one_rupee_poojas": {
      "gst_percent": 0,
      "discount_percent": 0,
      "delivery_charge": 0
    },
    "general_poojas": {
      "gst_percent": 0,
      "discount_percent": 0,
      "delivery_charge": 0
    },
    "problem_poojas": {
      "gst_percent": 0,
      "discount_percent": 0,
      "delivery_charge": 0
    },
    "combo_poojas": {
      "gst_percent": 0,
      "discount_percent": 0,
      "delivery_charge": 0
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 3. Add invoice breakdown columns to orders table to store completed checkout totals
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pandit_dakshina NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;
