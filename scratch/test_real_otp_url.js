const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const ENCRYPTION_KEY = 'sg6XisTlL2QcXSuE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealOtp() {
  try {
    const { data: apiKey, error } = await supabase.rpc('get_decrypted_api_key', {
      p_provider: 'whatsapp_otp',
      p_encryption_key: ENCRYPTION_KEY
    });
    if (error || !apiKey) {
      console.error('Error fetching API key:', error);
      return;
    }

    const url = new URL(apiKey);
    const countryCode = '+91';
    const phoneNumber = '7974478098'; // using test target phone number
    const otpCode = '987654';
    const fullPhoneNumber = `${countryCode}${phoneNumber}`.replace('+', '');

    // Set phone number
    url.searchParams.set('phone', fullPhoneNumber);

    // Set template parameters for BhashSMS
    const templateName = url.searchParams.get('text') || '';
    if (templateName === 'service_rejected_hindi') {
      url.searchParams.set('Params', `${otpCode},Low CIBIL Score`);
    } else {
      url.searchParams.set('Params', otpCode);
    }

    const targetUrl = url.toString();
    const loggableUrl = new URL(targetUrl);
    if (loggableUrl.searchParams.has('pass')) {
      loggableUrl.searchParams.set('pass', '********');
    }
    console.log('Constructed App-equivalent URL:', loggableUrl.toString());

    console.log('Sending request...');
    const response = await fetch(targetUrl);
    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Body:', responseText);
  } catch (err) {
    console.error('Error in test:', err);
  }
}

testRealOtp();
