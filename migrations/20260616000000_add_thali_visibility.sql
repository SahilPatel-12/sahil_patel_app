-- Migration: Add is_visible to god_thalis
-- Description: Adds is_visible column to allow hiding/unhiding aarti thalis in the mobile client.

ALTER TABLE public.god_thalis ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
