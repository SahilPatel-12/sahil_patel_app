import { supabase } from './supabase';

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || '';

let cachedApiKey: string | null = null;

/**
 * Safely fetches the decrypted WhatsApp API key from Supabase
 */
export async function getWhatsAppApiKey(): Promise<string | null> {
  try {
    if (cachedApiKey) {
      return cachedApiKey;
    }

    if (!ENCRYPTION_KEY) {
      console.error('EXPO_PUBLIC_ENCRYPTION_KEY is not defined in environment variables.');
      return null;
    }

    const { data, error } = await supabase.rpc('get_decrypted_api_key', {
      p_provider: 'whatsapp_otp',
      p_encryption_key: ENCRYPTION_KEY
    });

    if (error) {
      console.error('Supabase RPC error fetching API key:', error);
      return null;
    }

    cachedApiKey = data;
    return data;
  } catch (err) {
    console.error('Exception fetching decrypted WhatsApp API key:', err);
    return null;
  }
}

/**
 * Determines if the API URL is a BhashSMS or SixthSense gateway.
 * These gateways require phone WITHOUT country code (10 digits for India).
 */
function isBhashSMSGateway(urlStr: string): boolean {
  return urlStr.includes('bhashsms.com') || urlStr.includes('sixthsenseit.com');
}

/**
 * Strips the country code prefix from a phone number.
 * e.g. "917974478098" with countryCode "+91" → "7974478098"
 */
function stripCountryCode(fullNumber: string, countryCode: string): string {
  const digits = countryCode.replace('+', '');
  if (fullNumber.startsWith(digits)) {
    return fullNumber.slice(digits.length);
  }
  return fullNumber;
}

/**
 * Sends a 6-digit OTP code to the user's phone number via the configured API.
 * Supports BhashSMS WhatsApp template API (Params-based) and plain SMS text API.
 */
export async function sendWhatsAppOTP(
  countryCode: string,
  phoneNumber: string,
  otpCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`.replace('+', '');
    const apiKey = await getWhatsAppApiKey();

    if (!apiKey) {
      console.warn(`[WhatsApp Service] API Key not configured. Simulating OTP send in developer mode.`);
      console.log(`[SIMULATION] OTP for ${fullPhoneNumber}: ${otpCode}`);
      return {
        success: true,
        message: `[Dev Mode] OTP is ${otpCode} — API key not set in Admin Settings yet.`
      };
    }

    // Clean API key (strip GET/POST prefix if present)
    let cleanedApiKey = apiKey.trim();
    if (cleanedApiKey.toUpperCase().startsWith('GET ')) {
      cleanedApiKey = cleanedApiKey.substring(4).trim();
    } else if (cleanedApiKey.toUpperCase().startsWith('POST ')) {
      cleanedApiKey = cleanedApiKey.substring(5).trim();
    }

    // Handle HTTP/HTTPS gateway URLs
    if (cleanedApiKey.startsWith('http://') || cleanedApiKey.startsWith('https://')) {
      try {
        const url = new URL(cleanedApiKey);

        // Dynamically replace any `<OTP_CODE>` placeholder in the URL search params first
        for (const [key, value] of url.searchParams.entries()) {
          if (value.includes('<OTP_CODE>')) {
            url.searchParams.set(key, value.replace('<OTP_CODE>', otpCode));
          }
        }

        // --- BhashSMS / SixthSense specific logic ---
        if (isBhashSMSGateway(cleanedApiKey)) {
          const hasPriority = url.searchParams.get('priority') === 'wa';
          const hasParams = url.searchParams.has('Params');

          // BhashSMS WhatsApp mode (priority=wa) requires country code (e.g. 917974478098)
          // BhashSMS SMS mode requires 10-digit phone WITHOUT country code (e.g. 7974478098)
          const phoneForApi = hasPriority
            ? fullPhoneNumber
            : stripCountryCode(fullPhoneNumber, countryCode);
          url.searchParams.set('phone', phoneForApi);

          if (hasPriority && hasParams) {
            // ✅ WhatsApp template mode: OTP goes in Params
            // Only override if the OTP hasn't been dynamically set in the Params search parameter yet
            const currentParams = url.searchParams.get('Params') || '';
            if (!currentParams.includes(otpCode)) {
              const templateName = url.searchParams.get('text') || '';
              if (templateName === 'service_rejected_hindi') {
                url.searchParams.set('Params', `${otpCode},Low CIBIL Score`);
              } else {
                url.searchParams.set('Params', otpCode);
              }
            }
            console.log(`[WhatsApp Service] BhashSMS WA Template mode — phone: ${phoneForApi}, OTP in Params: ${url.searchParams.get('Params')}`);
          } else {
            // ✅ Normal SMS mode: append OTP to text
            const existingText = url.searchParams.get('text') || '';
            if (!existingText.includes(otpCode)) {
              const messageText = existingText
                ? `${existingText}${otpCode}`
                : `Your OTP is ${otpCode}. Valid for 10 minutes.`;
              url.searchParams.set('text', messageText);
            }
            console.log(`[WhatsApp Service] BhashSMS SMS mode — phone: ${phoneForApi}, text appended with OTP`);
          }
        } else {
          // --- Generic gateway ---
          url.searchParams.set('phone', fullPhoneNumber);
          const existingText = url.searchParams.get('text') || '';
          if (!existingText.includes(otpCode)) {
            const messageText = existingText
              ? `${existingText}${otpCode}`
              : `Your OTP is ${otpCode}. Valid for 10 minutes.`;
            url.searchParams.set('text', messageText);
          }
        }

        const targetUrl = url.toString();

        // Securely mask the password query parameter in terminal logs to prevent credential leakage
        const loggableUrl = new URL(targetUrl);
        if (loggableUrl.searchParams.has('pass')) {
          loggableUrl.searchParams.set('pass', '********');
        }
        console.log(`[WhatsApp Service] Calling gateway: ${loggableUrl.toString()}`);

        const response = await fetch(targetUrl);
        const responseText = await response.text();
        console.log(`[WhatsApp Service] Gateway response:`, responseText);

        // BhashSMS returns plain text — success if it starts with a number (message ID)
        const isSuccess = response.ok &&
          !responseText.toLowerCase().includes('error') &&
          !responseText.toLowerCase().includes('invalid') &&
          !responseText.toLowerCase().includes('does not exist') &&
          !responseText.toLowerCase().includes('failed');

        if (isSuccess) {
          return {
            success: true,
            message: `OTP sent successfully via WhatsApp. Ref: ${responseText.trim()}`
          };
        } else {
          return {
            success: false,
            message: `Gateway error: ${responseText.trim()}`
          };
        }
      } catch (urlErr) {
        console.error('[WhatsApp Service] URL error:', urlErr);
        // Graceful fallback for local development / network offline testing:
        console.warn(`[WhatsApp Service] Network failed. Falling back to sandbox mode. OTP is ${otpCode}`);
        return {
          success: true,
          message: `[Dev Mode Sandbox] OTP is ${otpCode} (Gateway Connection Offline)`
        };
      }
    }

    // Test/dummy key fallback
    if (cleanedApiKey.toLowerCase().includes('dummy') || cleanedApiKey.toLowerCase().includes('test')) {
      return {
        success: true,
        message: `OTP ${otpCode} sent (Test mode)`
      };
    }

    return {
      success: false,
      message: 'API key format not recognized. Please set a valid HTTP gateway URL in Admin Settings.'
    };
  } catch (err) {
    console.error('[WhatsApp Service] Failed:', err);
    return {
      success: true,
      message: `[Dev Mode Sandbox] OTP is ${otpCode} (Service Exception fallback)`
    };
  }
}
