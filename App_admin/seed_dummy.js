const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const dummyPooja = {
  title: 'Maha Laxmi Puja',
  original_price: '₹751',
  offer_price: '₹1',
  rating: '4.9',
  reviews: '280',
  provider: 'Mahalakshmi Temple',
  image_url: 'https://images.unsplash.com/photo-1609137144814-6c3614275f7e?auto=format&fit=crop&w=600&q=80',
  tag: 'Wealth',
  requirement: 'Book Puja to claim',
  category: 'Wealth',
  is_active_on_home: true,
  is_active: true,
  status: 'published',
  tagline: 'Attracts financial abundance, clears outstanding debts, and brings luck to your home.',
  benefits: '• Unlocks new wealth avenues, business growth, and professional success\n• Cleanses negative financial blocks and helps in debt clearance\n• Welcomes lasting household abundance and luxury',
  steps: '1. Laxmi Aavahan Puja & Sankalp\n2. Ashta-Laxmi Stotram Recitation by priests\n3. Sacred Havan offering with lotus seeds',
  samagri: 'Lotus seed mala, saffron threads, red rose petals, and cow ghee.',
  pandit: 'Pandit Ramesh Chaturvedi - Mahalakshmi Head Priest',
  temple: 'Mahalakshmi Temple, Kolhapur',
  prasad: 'Consecrated copper Shree Yantra shield, dry fruit panchamrit, and sacred thread.',
  other_info: 'A personal video recording of the sankalp chanting will be sent on WhatsApp.',
  combo_offer: {
    title: 'Maha Laxmi & Ganesh Combo Offer',
    description: 'Double blessings bundle including energized copper Shree Yantra and Ganesh gold locket.',
    original_price: '₹1502',
    offer_price: '₹501',
    image_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80'
  },
  faqs: [
    {
      q: 'How will I join the Puja live?',
      a: 'The Vedic pandits will take your name and gotra sankalp in the temple. We will share a WhatsApp video recording of the sankalp ritual within 24 hours.'
    },
    {
      q: 'What will I receive in the Prasad transit box?',
      a: 'You will receive an energized copper Shree Yantra shield, dry fruit panchamrit, temple modak sweets, and a sacred orange protection thread.'
    },
    {
      q: 'Can I add names of my family members?',
      a: 'Yes! If you select the Family Pariwar package, you can add up to 4 family member names and gotra details for personalized sankalps.'
    }
  ],
  single_title: 'Single Sankalp',
  single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
  single_price: '₹1',
  single_original_price: '₹751',
  family_title: 'Family Pariwar',
  family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
  family_price: '₹2',
  family_original_price: '₹1502'
};

async function seed() {
  console.log('Seeding high-fidelity dummy ₹1 Pooja into Supabase...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/one_rupee_poojas`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(dummyPooja)
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase REST error: ${response.status} - ${errText}`);
    }
    
    const result = await response.json();
    console.log('Success! Dummy pooja seeded successfully in database:', result);
  } catch (err) {
    console.error('Failed to seed dummy entry:', err);
  }
}

seed();
