const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomBooking() {
  console.log('Fetching a sample user_id from existing orders...');
  try {
    const { data: orderData, error: orderFetchError } = await supabase
      .from('orders')
      .select('user_id')
      .limit(1);

    if (orderFetchError) throw orderFetchError;
    if (!orderData || orderData.length === 0) {
      console.log('No user session found in orders. Please seed a user first.');
      return;
    }

    const userId = orderData[0].user_id;
    console.log(`Using user_id: ${userId}`);

    console.log('Inserting pending custom order...');
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_type: 'puja',
        total_amount: 0,
        payment_status: 'pending',
        order_status: 'Pending',
        subtotal: 0,
        discount: 0,
        pandit_dakshina: 0,
        tax: 0,
        shipping_cost: 0
      })
      .select('id')
      .single();

    if (orderError) throw orderError;
    const orderId = newOrder.id;
    console.log(`Order created successfully with ID: ${orderId}`);

    console.log('Inserting custom order item...');
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        item_type: 'puja',
        item_id: 'custom_puja',
        quantity: 1,
        price: 0
      });

    if (itemError) throw itemError;
    console.log('Order item inserted successfully.');

    console.log('Inserting custom puja booking details...');
    const notes = `[Custom Request for Pandit: Acharya Guru Ji] Need specialized shanti paths for family peace.`;
    const { error: pujaError } = await supabase
      .from('puja_booking_details')
      .insert({
        order_id: orderId,
        devotee_name: 'Test Devotee Name',
        gotra: 'Kashyap',
        special_notes: notes,
        preferred_date: '2026-07-01',
        preferred_time: '10:00 AM'
      });

    if (pujaError) throw pujaError;
    console.log('Puja booking details inserted successfully.');

    // Success clean up or logs
    console.log('SUCCESS! Full custom booking flow executed successfully in Supabase.');
  } catch (err) {
    console.error('Failed verification test:', err.message || err);
  }
}

testCustomBooking();
