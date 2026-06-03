const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const ENCRYPTION_KEY = 'sg6XisTlL2QcXSuE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOtp() {
  try {
    console.log('Fetching decrypted api key...');
    const { data, error } = await supabase.rpc('get_decrypted_api_key', {
      p_provider: 'whatsapp_otp',
      p_encryption_key: ENCRYPTION_KEY
    });
    if (error) {
      console.error('RPC Error:', error);
      return;
    }
    console.log('Decrypted API Key/Gateway URL:', data);

    if (!data) {
      console.log('No API key configured in database.');
      return;
    }

    if (data.startsWith('http://') || data.startsWith('https://')) {
      const url = new URL(data);
      console.log('Original gateway hostname:', url.hostname);
      console.log('Original search params:', url.searchParams.toString());
      
      const countryCode = '+91';
      const phoneNumber = '7974478098'; // using target phone number
      const otpCode = '123456';
      const fullPhoneNumber = `${countryCode}${phoneNumber}`.replace('+', '');
      
      const isBhashSMSGateway = data.includes('bhashsms.com') || data.includes('sixthsensit.com');
      const hasPriority = url.searchParams.get('priority') === 'wa';
      const hasParams = url.searchParams.has('Params');
      
      const phoneForApi = hasPriority
        ? fullPhoneNumber
        : fullPhoneNumber.slice(2);
      
      url.searchParams.set('phone', phoneForApi);
      
      if (hasPriority && hasParams) {
        url.searchParams.set('Params', otpCode);
      } else {
        const existingText = url.searchParams.get('text') || '';
        const messageText = existingText
          ? `${existingText}${otpCode}`
          : `Your OTP is ${otpCode}. Valid for 10 minutes.`;
        url.searchParams.set('text', messageText);
      }
      
      const targetUrl = url.toString();
      
      // Mask password parameter in logs
      const loggableUrl = new URL(targetUrl);
      if (loggableUrl.searchParams.has('pass')) {
        loggableUrl.searchParams.set('pass', '********');
      }
      console.log('Constructed URL:', loggableUrl.toString());
      
      console.log('Sending request to gateway...');
      const response = await fetch(targetUrl);
      const text = await response.text();
      console.log('Response Status:', response.status);
      console.log('Response Body:', text);
    } else {
      console.log('API key format is not a URL (might be test/dummy key).');
    }
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testOtp();
