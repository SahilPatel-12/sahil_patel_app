# Astrologer Registration Portal Setup Guide

This folder contains the database schema and React Native registration screen files required to register astrologers on the platform.

---

## 1. Database Setup

Deploy the [schema.sql](file:///Applications/sahil_MP_app/APP/mantrapuja/astrologer_registration/schema.sql) file directly on your Supabase SQL editor. It performs the following setup:
1. Creates the `website_store_astrologers` table representing the astrologer directories.
2. Creates the `astrologer_bookings` table to log consultation calls and chats.
3. Enables Row Level Security (RLS) policies allowing public selects and own profile writes.
4. Activates Realtime replication so mobile clients automatically receive profile and availability changes.

---

## 2. Astrologer Data Fields

Each registered astrologer has the following profile schema:

| Field | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| **id** | UUID | Unique record identifier (default `gen_random_uuid()`) | **Yes** |
| **user_id** | UUID | Linked user ID referencing `app_users(id)` | **Yes** |
| **full_name** | TEXT | Astrologer's displayed name | **Yes** |
| **spiritual_title** | TEXT | Headline title (e.g. "Vedic Hora & Vastu Authority") | **Yes** |
| **bio** | TEXT | Description of experience and remedies | **No** |
| **profile_photo** | TEXT | Direct HTTPS URL link to profile picture | **No** |
| **charge_per_min** | INTEGER | Fee charged per minute in coins (default `30`) | **Yes** |
| **experience_years**| INTEGER | Number of years active (default `5`) | **Yes** |
| **readings_count** | INTEGER | Total consultations completed (default `100`) | **Yes** |
| **specialties** | TEXT[] | Selected checklist tags (Kundli, Gemstones, etc.) | **Yes** |
| **languages** | TEXT[] | Supported language list (Hindi, English, etc.) | **Yes** |
| **city** / **state** | TEXT | Geographic location details | **No** |
| **rating** | NUMERIC | Calculated customer rating (default `4.5`) | **Yes** |
| **is_online** | BOOLEAN | Real-time consultation status indicator | **Yes** |

---

## 3. Form Component Usage

Include [RegisterAstrologer.tsx](file:///Applications/sahil_MP_app/APP/mantrapuja/astrologer_registration/RegisterAstrologer.tsx) in your screen router configs to allow users to register as astrologers directly from the application settings page or a separate registration routing tab.
