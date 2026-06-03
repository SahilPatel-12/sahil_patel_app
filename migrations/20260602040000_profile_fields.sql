-- Migration: Add gotra, rashi, nakshatra to profiles table
-- Date: 2026-06-02

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gotra TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rashi TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nakshatra TEXT;
