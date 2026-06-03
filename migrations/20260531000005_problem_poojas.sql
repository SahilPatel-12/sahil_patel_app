-- Migration: Create life_problems and problem_poojas tables & seed values
-- Date: 2026-05-31

-- 1. Create life_problems table
CREATE TABLE IF NOT EXISTS public.life_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  gradient_start TEXT NOT NULL,
  gradient_end TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT NULL
);

-- Enable RLS for life_problems
ALTER TABLE public.life_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.life_problems
  FOR SELECT USING (true);

CREATE POLICY "Allow auth all access" ON public.life_problems
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for life_problems
ALTER PUBLICATION supabase_realtime ADD TABLE public.life_problems;

-- 2. Create problem_poojas table
CREATE TABLE IF NOT EXISTS public.problem_poojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  original_price TEXT,
  offer_price TEXT,
  rating TEXT DEFAULT '4.9',
  reviews TEXT DEFAULT '120',
  provider TEXT NOT NULL,
  image_url TEXT,
  tag TEXT,
  requirement TEXT,
  problem_category TEXT NOT NULL DEFAULT 'Health', -- Maps to 'Health', 'Wealth', 'Job & Career', 'Marriage & Love', 'Grah Dosh'
  is_active_on_home BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'published',
  tagline TEXT,
  benefits TEXT,
  steps TEXT,
  samagri TEXT,
  pandit TEXT,
  temple TEXT,
  prasad TEXT,
  other_info TEXT,
  translations JSONB DEFAULT '{}'::jsonb,
  combo_offer JSONB DEFAULT '{}'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  single_title TEXT DEFAULT 'Single Sankalp',
  single_description TEXT DEFAULT 'Individual name & gotra Sankalp + Holy Prasad transit box.',
  single_price TEXT DEFAULT '₹501',
  single_original_price TEXT DEFAULT '₹1501',
  family_title TEXT DEFAULT 'Family Pariwar',
  family_description TEXT DEFAULT 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
  family_price TEXT DEFAULT '₹1001',
  family_original_price TEXT DEFAULT '₹3001',
  sort_order INTEGER DEFAULT NULL
);

-- Enable RLS for problem_poojas
ALTER TABLE public.problem_poojas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.problem_poojas
  FOR SELECT USING (true);

CREATE POLICY "Allow auth all access" ON public.problem_poojas
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for problem_poojas
ALTER PUBLICATION supabase_realtime ADD TABLE public.problem_poojas;

-- 3. Seed life_problems
INSERT INTO public.life_problems (title, color, gradient_start, gradient_end, image_url, sort_order) VALUES
('HEALTH\nPROBLEMS', '#b91c1c', '#fee2e2', '#fecaca', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/health_problem.png', 1),
('WEALTH &\nMONEY', '#a16207', '#fef9c3', '#fef08a', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Welth&Money.png', 2),
('JOB &\nCAREER', '#1d4ed8', '#dbeafe', '#bfdbfe', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Job&career.png', 3),
('MARRIAGE\n& LOVE', '#be185d', '#fce7f3', '#fbcfe8', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Marriage&Love.png', 4),
('GRAH DOSH\n& SHANTI', '#6d28d9', '#f3e8ff', '#e9d5ff', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/grah_dosh.png', 5);

-- 4. Seed problem_poojas with high-fidelity items
INSERT INTO public.problem_poojas (
  title, original_price, offer_price, rating, reviews, provider, image_url, tag, requirement, problem_category, tagline, benefits, steps, samagri, pandit, temple, prasad, other_info, single_title, single_description, single_price, single_original_price, family_title, family_description, family_price, family_original_price, sort_order
) VALUES 
(
  'Shiv Puja', '₹999', '₹351', '4.7', '190', 'Omkareshwar Dham', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Omkarashwar.png', 'Vedic Seva', '30-45 mins', 'Health', 
  'Bestows perfect health, protects against sudden illness & negative forces.', 
  '• Bestows perfect health and extreme longevity\n• Protects against sudden illnesses & evil eye\n• Establishes mental peace & divine security', 
  '• Personalized Shiv Sankalp with Name & Gotra\n• Rudrabhishek of Shiva Lingam with pure cow milk and honey\n• Recitation of Shiva Tandava Stotra by temple acharyas', 
  'Bilva leaves, sacred ashes (Bhasma), raw honey, gangajal, kusha grass', 
  'Acharya Vishwanath Dwivedi', 'Omkareshwar Dham, Madhya Pradesh', 'Blessed Shiva Rudraksha bead, Mahadev Bhasma pack, sacred black thread.', 
  'Video proof of Sankalp shared on WhatsApp within 24 hours.', 
  'Single Sankalp', 'Individual name & gotra Sankalp + Holy Prasad transit box.', '₹351', '₹999', 
  'Family Pariwar', 'Full household (4 names) Sankalps + Consecrated copper yantra shield.', '₹700', '₹2,000', 
  1
),
(
  'Shanti Path', '₹499', '₹151', '4.9', '150', 'Haridwar Acharyas', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god1.png', 'Vedic Seva', '30 mins', 'Health', 
  'Brings absolute mental peace, family harmony, and removes home stress.', 
  '• Resolves severe family stress, arguments, and hot tempers\n• Bestows absolute mental peace, sleep, and emotional balance\n• Cleanses negative home vibes (vastu blocks)', 
  '• Personalized Shanti Sankalp with Name & Gotra\n• Shanti Mantra chanting and Vedic peace prayers\n• Offering of sacred grains into the holy fire', 
  'White sandalwood, sacred grains, cow ghee, gangajal, pure incense', 
  'Acharya Ramanand Shastri', 'Ganga Ghat Altar, Haridwar', 'Holy gangajal bottle, sacred white thread, crystal sphatik bead.', 
  'Video proof of Sankalp shared on WhatsApp within 24 hours.', 
  'Single Sankalp', 'Individual name & gotra Sankalp + Holy Prasad transit box.', '₹151', '₹499', 
  'Family Pariwar', 'Full household (4 names) Sankalps + Consecrated copper yantra shield.', '₹300', '₹1,000', 
  2
),
(
  'Laxmi Puja', '₹3,100', '₹1,100', '4.9', '280', 'Mahalakshmi Priests', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Jai_Mahalakshmi.jpeg', 'Wealth', '60-90 mins', 'Wealth', 
  'Attracts financial abundance, clears outstanding debts, and brings luck to your home.', 
  '• Unlocks new wealth avenues, business growth, and professional success\n• Cleanses negative financial blocks and helps in debt clearance\n• Welcomes lasting household abundance and luxury', 
  '• Personalized Laxmi Sankalp with Name & Gotra\n• Chanting of Sri Suktam and Lakshmi Ashtothra Shatanamavali\n• Shringar offering with red lotus flowers and dry fruits', 
  'Lotus seed kamalgatta, fresh red lotus, yellow cowries, pure cow ghee', 
  'Pandit Ramesh Chaturvedi', 'Mahalakshmi Temple, Mumbai', 'Saffron-infused sweets, blessed red thread, golden Lakshmi-Kuber card.', 
  'Video proof of Sankalp shared on WhatsApp within 24 hours.', 
  'Single Sankalp', 'Individual name & gotra Sankalp + Holy Prasad transit box.', '₹1,100', '₹3,100', 
  'Family Pariwar', 'Full household (4 names) Sankalps + Consecrated copper yantra shield.', '₹2,200', '₹6,200', 
  1
),
(
  'Tirupati Puja', '₹5,100', '₹2,100', '5.0', '420', 'Tirumala Devasthanam', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Lord_Venkateswara.png', 'Wealth', '120 mins', 'Wealth', 
  'Bestows divine protection, health, and extreme wealth blessings.', 
  '• Bestows divine protection and family peace\n• Grants extreme wealth, property, and career abundance\n• Removes negatives, curses, and legal discords', 
  '• Personalized Tirupati Sankalp with Name & Gotra\n• Venkateswara Archana and Kalyanotsavam chants\n• Pushpa Yagam flower offering to the deity', 
  'Sacred tulsi leaves, chandan, camphor, coconut, banana offerings', 
  'Swami Venkatesh Acharya', 'Tirumala Hills Shrine, Andhra Pradesh', 'Authentic Tirupati Laddu, consecrated Tulsi leaves, holy yellow thread.', 
  'Video proof of Sankalp shared on WhatsApp within 24 hours.', 
  'Single Sankalp', 'Individual name & gotra Sankalp + Holy Prasad transit box.', '₹2,100', '₹5,100', 
  'Family Pariwar', 'Full household (4 names) Sankalps + Consecrated copper yantra shield.', '₹4,200', '₹10,200', 
  2
),
(
  'Ganesh Puja', '₹1,501', '₹501', '4.8', '120', 'Siddhi Vinayak Mandir', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god.png', 'Vedic Seva', '45-60 mins', 'Job & Career', 
  'Removes all obstacles and brings success, peace, and auspicious beginnings.', 
  '• Bestows divine blessings of Lord Ganesha for success in all ventures\n• Clears negative vibes and obstacles from your career or business\n• Brings home peace, harmony, and infinite prosperity', 
  '• Personalized Ganesha Sankalp with Name & Gotra\n• Recitation of Ganapati Atharvashirsha by Kashi Pandits\n• Sweet modak and red flower offerings at temple shrine', 
  'Sacred Durva grass, fresh modaks, red hibiscus, raw saffron, gangajal', 
  'Acharya Ramachandra Shastri', 'Siddhi Vinayak Temple, Mumbai', 'Special modak prasad box, blessed raksha sutra, Ganesha pocket photo.', 
  'Video proof of Sankalp shared on WhatsApp within 24 hours.', 
  'Single Sankalp', 'Individual name & gotra Sankalp + Holy Prasad transit box.', '₹501', '₹1,501', 
  'Family Pariwar', 'Full household (4 names) Sankalps + Consecrated copper yantra shield.', '₹1,001', '₹3,001', 
  1
),
(
  'Navgrah Homa', '₹4,500', '₹1,500', '4.7', '175', 'Kashi Vedic Pandits', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god5.jpeg', 'Protection', '90 mins', 'Grah Dosh', 
  'Balances all 9 planets in your birth chart, removing doshas & obstacles.', 
  '• Calms down unfavorable planets (Rahu, Ketu, Shani) in chart\n• Unlocks massive career, marriage, and financial opportunities\n• Protects against unexpected accidents and blockages', 
  '• Personalized Navgrah Sankalp with Name & Gotra\n• Vedic chants for all 9 planets performed by 3 Kashi Pandits\n• Dynamic Navgrah Havan ritual using planetary herbs', 
  '9 types of sacred grains (Navadhanya), planet-specific herbs, ghee', 
  'Pandit Somnath Dwivedi', 'Sacred Altar of Kashi, Varanasi', 'Energized Navgrah copper yantra, planet-blessed black thread, dry fruit mewa.', 
  'Video proof of Sankalp shared on WhatsApp within 24 hours.', 
  'Single Sankalp', 'Individual name & gotra Sankalp + Holy Prasad transit box.', '₹1,500', '₹4,500', 
  'Family Pariwar', 'Full household (4 names) Sankalps + Consecrated copper yantra shield.', '₹3,000', '₹9,000', 
  1
),
(
  'Hanuman Puja', '₹799', '₹251', '4.9', '230', 'Bajrang Dham', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Mahakal_Ujjain.png', 'Protection', '45 mins', 'Grah Dosh', 
  'Overcomes all fear, destroys negative forces, and brings victory.', 
  '• Overcomes fear, anxiety, and internal psychological blockages\n• Destroys negative energies, curses, and evil eye blocks\n• Bestows absolute physical strength and career victory', 
  '• Personalized Hanuman Sankalp with Name & Gotra\n• Recitation of Hanuman Chalisa & Bajrang Baan 11 times\n• Sindoor & jasmine oil offering to Lord Hanuman', 
  'Orange vermilion sindoor, jasmine oil, basil leaves, red flowers, coconut', 
  'Pandit Somnath Vyas', 'Bajrang Dham Temple', 'Hanuman protection thread, consecrated orange vermilion pack, Hanuman locket.', 
  'Video proof of Sankalp shared on WhatsApp within 24 hours.', 
  'Single Sankalp', 'Individual name & gotra Sankalp + Holy Prasad transit box.', '₹251', '₹799', 
  'Family Pariwar', 'Full household (4 names) Sankalps + Consecrated copper yantra shield.', '₹500', '₹1,600', 
  2
);
