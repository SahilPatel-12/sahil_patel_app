const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Probing website_store_astrologers...');
  const { data: astros, error: astroErr } = await supabase
    .from('website_store_astrologers')
    .select('*')
    .limit(10);

  if (astroErr) {
    console.error('Error fetching astrologers:', astroErr.message || astroErr);
  } else {
    console.log(`\n--- Registered Astrologers (${astros.length}) ---`);
    astros.forEach(a => {
      console.log(`ID: ${a.id} | Name: "${a.full_name}" | Title: "${a.spiritual_title}" | Online: ${a.is_online} | Specialities: ${a.specialties}`);
    });
  }

  console.log('\nProbing astrologer_bookings...');
  const { data: bookings, error: bookingErr } = await supabase
    .from('astrologer_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (bookingErr) {
    console.error('Error fetching bookings:', bookingErr.message || bookingErr);
  } else {
    console.log(`\n--- Recent Consultations/Bookings (${bookings.length}) ---`);
    bookings.forEach(b => {
      console.log(`ID: ${b.id} | AstroID: ${b.astrologer_id} | User: ${b.devotee_name} | Type: ${b.consult_type} | Status: ${b.status} | Time: ${b.booking_time}`);
    });
  }

  console.log('\nProbing astrologer_chat_messages...');
  const { data: messages, error: msgErr } = await supabase
    .from('astrologer_chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);

  if (msgErr) {
    console.error('Error fetching chat messages:', msgErr.message || msgErr);
  } else {
    console.log(`\n--- Recent Chat Messages (${messages.length}) ---`);
    messages.forEach(m => {
      console.log(`ID: ${m.id} | Session: ${m.booking_id} | Sender: ${m.sender_type} | Text: "${m.message_text}" | Time: ${m.created_at}`);
    });
  }
}

check();
