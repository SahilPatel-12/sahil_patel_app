-- Create daans table to store Rashi and Weekday recommendations
CREATE TABLE IF NOT EXISTS public.daans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rashi TEXT, -- e.g. 'aries', 'taurus', etc.
    weekday TEXT, -- e.g. 'Sunday', 'Monday', etc.
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    benefit TEXT NOT NULL,
    color TEXT NOT NULL,
    lucky_number INTEGER NOT NULL DEFAULT 7,
    mantra TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 251,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_daan_rashi_or_weekday CHECK (rashi IS NOT NULL OR weekday IS NOT NULL)
);

-- Create unique index to quickly fetch/query
CREATE INDEX IF NOT EXISTS idx_daans_rashi ON public.daans(rashi);
CREATE INDEX IF NOT EXISTS idx_daans_weekday ON public.daans(weekday);

-- Enable RLS on daans
ALTER TABLE public.daans ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
DROP POLICY IF EXISTS "Allow anon read access to daans" ON public.daans;
CREATE POLICY "Allow anon read access to daans" ON public.daans FOR SELECT TO anon USING (true);


-- Create daan_bookings table to store user Daan donations
CREATE TABLE IF NOT EXISTS public.daan_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daan_id UUID REFERENCES public.daans(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    devotee_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    rashi TEXT NOT NULL,
    gotra TEXT,
    sankalp TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Pending', 'Paid', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on daan_bookings
ALTER TABLE public.daan_bookings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous select/insert/update
DROP POLICY IF EXISTS "Allow anon read access to daan_bookings" ON public.daan_bookings;
CREATE POLICY "Allow anon read access to daan_bookings" ON public.daan_bookings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert to daan_bookings" ON public.daan_bookings;
CREATE POLICY "Allow anon insert to daan_bookings" ON public.daan_bookings FOR INSERT TO anon WITH CHECK (true);


-- Seed Daan Recommendations
-- 1. Seeding 12 Rashi Daans
INSERT INTO public.daans (rashi, weekday, title, description, benefit, color, lucky_number, mantra, price) VALUES
('aries', NULL, 'Sacred Red Lentils & Copper Vessel donation', 'Donating red lentils (Masur Dal) and copper items helps pacify Mars (Mangal), bringing immense courage and removing structural obstacles from career and health.', 'Removes planetary delays & boosts career energy', 'Red', 9, 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः', 251),
('taurus', NULL, 'Sacred White Rice & Sugar donation', 'Donating white foods like rice, sugar, or dairy helps seek blessings from Venus (Shukra), enhancing marital harmony, creativity, and financial prosperity.', 'Enhances peace, luxury & relationship harmony', 'White', 6, 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः', 251),
('gemini', NULL, 'Green Moong Dal & Spinach feed donation', 'Donating green moong dal or organic spinach helps pacify Mercury (Budha), boosting intellect, business clarity, and communication skills.', 'Improves business clarity, learning & logic', 'Green', 5, 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः', 251),
('cancer', NULL, 'Pure Silver item & Curd donation', 'Donating curd, milk, or pure silver items pacifies the Moon (Chandra), stabilizing emotions, enhancing mental clarity, and resolving family dynamics.', 'Brings mental peace & emotional balance', 'White', 2, 'ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः', 251),
('leo', NULL, 'Organic Jaggery & Wheat donation', 'Donating jaggery and whole wheat strengthens the Sun (Surya), boosting self-confidence, leadership traits, and societal respect.', 'Enhances social respect, health & leadership', 'Saffron', 1, 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः', 251),
('virgo', NULL, 'Green Clothes & Sacred Herb donation', 'Donating green-colored fabrics or sacred herbs pacifies Mercury (Budha), bringing sharp analytical skills, educational success, and sound health.', 'Sharpens intellect & removes memory blockages', 'Green', 5, 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः', 251),
('libra', NULL, 'Pure Ghee & Sandalwood donation', 'Donating pure cow ghee, sandalwood, or high-quality perfumes pacifies Venus (Shukra), attracting beauty, prosperity, and wealth.', 'Attracts prosperity, financial ease & luxury', 'White', 6, 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः', 251),
('scorpio', NULL, 'Red Clothes & Jaggery donation', 'Donating red garments, jaggery, or copper pacifies Mars (Mangal), helping overcome hidden fears, debts, and planetary conflicts.', 'Overcomes spiritual obstacles, fear & debts', 'Red', 9, 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः', 251),
('sagittarius', NULL, 'Turmeric & Yellow Books donation', 'Donating raw turmeric or spiritual books strengthens Jupiter (Guru), accelerating wisdom, luck, spiritual learning, and general good fortune.', 'Attains wisdom, divine luck & academic growth', 'Yellow', 3, 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः', 251),
('capricorn', NULL, 'Black Sesame & Mustard Oil donation', 'Donating black sesame seeds, iron items, or mustard oil pacifies Saturn (Shani), shielding from delays, hard work failures, and physical pain.', ' Shields from Saturn delays & removes career hurdles', 'Black', 8, 'ॐ प्रां प्रीं प्रौं सः शनये नमः', 251),
('aquarius', NULL, 'Blue Clothes & Iron vessel donation', 'Donating blue-colored garments or iron utensils pacifies Saturn (Shani), accelerating career progress, professional rewards, and longevity.', 'Accelerates career promotions & steady wealth', 'Blue', 8, 'ॐ प्रां प्रीं प्रौं सः शनये नमः', 251),
('pisces', NULL, 'Yellow Sweets & Saffron donation', 'Donating yellow sweets (Besan Ladoo), saffron, or yellow clothes strengthens Jupiter (Guru), bringing spiritual growth, family expansion, and luck.', 'Brings family harmony, luck & spiritual success', 'Yellow', 3, 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः', 251)
ON CONFLICT DO NOTHING;

-- 2. Seeding 7 Weekday Fallback Daans (for users without a Rashi)
INSERT INTO public.daans (rashi, weekday, title, description, benefit, color, lucky_number, mantra, price) VALUES
(NULL, 'Sunday', 'Sacred Jaggery & Wheat donation', 'Sunday is dedicated to Lord Surya (the Sun). Donating jaggery and wheat strengthens the Sun, bringing health, energy, and success in professional affairs.', 'Enhances social respect, health & leadership', 'Saffron', 1, 'ॐ सूर्याय नमः', 251),
(NULL, 'Monday', 'Sacred Milk & White Rice donation', 'Monday is ruled by the Moon and dedicated to Lord Shiva. Donating milk and white rice brings emotional stability, inner peace, and smooth relationship dynamics.', 'Brings mental peace & emotional balance', 'White', 2, 'ॐ सोमाय नमः', 251),
(NULL, 'Tuesday', 'Sacred Red Lentils & Copper Vessel donation', 'Tuesday is ruled by Mars and dedicated to Lord Hanuman. Donating red lentils (Masur Dal) and copper removes planet conflicts, fear, and delays.', 'Removes planetary delays & boosts career energy', 'Red', 9, 'ॐ भौमाय नमः', 251),
(NULL, 'Wednesday', 'Green Moong Dal & Spinach feed donation', 'Wednesday is ruled by Mercury and dedicated to Lord Ganesha. Donating green moong dal or organic spinach improves wisdom, memory, business success, and networking.', 'Improves business clarity, learning & logic', 'Green', 5, 'ॐ बुधाय नमः', 251),
(NULL, 'Thursday', 'Sacred Bananas & Yellow Clothes donation', 'Thursday is ruled by Jupiter and dedicated to Lord Vishnu. Donating bananas, split chickpeas (Chana Dal), and yellow clothes brings immense wisdom and prosperity.', 'Attains knowledge, wisdom & good fortune', 'Yellow', 3, 'ॐ बृहस्पतये नमः', 251),
(NULL, 'Friday', 'Sacred Sugar & Curd donation', 'Friday is ruled by Venus and dedicated to Goddess Laxmi. Donating sugar, curd, and white items attracts wealth, material prosperity, and marital joy.', 'Attracts prosperity, financial ease & luxury', 'White', 6, 'ॐ शुक्राय नमः', 251),
(NULL, 'Saturday', 'Sacred Black Sesame & Mustard Oil donation', 'Saturday is ruled by Saturn and dedicated to Lord Shani. Donating mustard oil and black sesame seeds shields from planetary obstacles, accidents, and financial pain.', 'Shields from Saturn delays & removes career hurdles', 'Black', 8, 'ॐ शनैश्चराय नमः', 251)
ON CONFLICT DO NOTHING;
