// MSG91 real SMS service
// Sends OTPs via MSG91 REST API

const axios = require('axios');

// In-memory store for OTPs (for verification)
const otpStore = {};

const MSG91_API_KEY = process.env.MSG91_API_KEY;
const MSG91_FLOW_ID = process.env.MSG91_FLOW_ID;
const MSG91_OTP_VAR = process.env.MSG91_OTP_VAR || 'OTP';
const MSG91_USE_FLOW_API = process.env.MSG91_USE_FLOW_API !== 'false';
const MSG91_ROUTE = process.env.MSG91_ROUTE || '4'; // Transactional route
const SENDER_ID = process.env.MSG91_SENDER_ID || 'THEKED'; // Max 6 chars (must be approved in MSG91)

function looksLikeMsg91Error(data) {
  const text = typeof data === 'string' ? data.toLowerCase() : JSON.stringify(data || {}).toLowerCase();
  return (
    text.includes('error') ||
    text.includes('invalid') ||
    text.includes('failed') ||
    text.includes('not valid') ||
    text.includes('unauthorized')
  );
}

exports.sendOtp = async (phone) => {
  try {
    // Validate and normalize phone
    if (!phone || phone.toString().length < 10) {
      throw new Error('Invalid phone number - must be at least 10 digits');
    }

    // Remove +91 prefix if present, keep only digits
    let normalizedPhone = phone.toString().replace(/\D/g, '');
    if (normalizedPhone.length === 12 && normalizedPhone.startsWith('91')) {
      normalizedPhone = normalizedPhone.slice(2); // Remove +91
    }
    if (normalizedPhone.length !== 10) {
      throw new Error('Phone must be 10 digits for Indian numbers');
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory (expires in 10 minutes)
    otpStore[normalizedPhone] = { otp, expires: Date.now() + 10 * 60 * 1000 };

    console.log(`📱 Sending OTP ${otp} to ${normalizedPhone} via MSG91...`);

    // If no API key configured, skip real sending in development only.
    // In production, fail fast so the frontend does not show a false success.
    if (!MSG91_API_KEY) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MSG91_API_KEY is missing in production');
      }
      console.log(`⚠️  MSG91_API_KEY not configured. OTP for testing: ${otp}`);
      return { ok: true, message: 'OTP generation successful (SMS sending disabled)', otp_for_testing: otp };
    }

    console.log(`API Key present: ${MSG91_API_KEY.substring(0, 10)}...`);
    console.log(`Sender ID: ${SENDER_ID}`);

    if (SENDER_ID.length > 6) {
      throw new Error('MSG91_SENDER_ID must be 6 characters or less');
    }

    let response;

    if (MSG91_USE_FLOW_API) {
      if (!MSG91_FLOW_ID) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`⚠️  MSG91_FLOW_ID missing. OTP for testing: ${otp}`);
          return { ok: true, message: 'OTP generation successful (Flow API not configured)', otp_for_testing: otp };
        }
        throw new Error('MSG91_FLOW_ID is required when MSG91_USE_FLOW_API is enabled');
      }

      // MSG91 Flow API expects mobile with country code (India -> 91XXXXXXXXXX)
      const flowPayload = {
        flow_id: MSG91_FLOW_ID,
        sender: SENDER_ID,
        mobiles: `91${normalizedPhone}`,
        [MSG91_OTP_VAR]: otp,
      };

      console.log('Calling MSG91 Flow API with payload:', { ...flowPayload, flow_id: `${MSG91_FLOW_ID.slice(0, 6)}...` });

      response = await axios.post('https://control.msg91.com/api/v5/flow/', flowPayload, {
        headers: {
          authkey: MSG91_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
    } else {
      // Legacy non-template API fallback (not recommended for production)
      const message = `Your Thekedaar OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
      const params = {
        authkey: MSG91_API_KEY,
        mobiles: `91${normalizedPhone}`,
        message: message,
        route: MSG91_ROUTE,
        sender: SENDER_ID,
      };
      console.log(`Calling MSG91 legacy API with params:`, { ...params, authkey: params.authkey.substring(0, 10) + '...' });
      response = await axios.get('https://api.msg91.com/api/sendhttp.php', {
        params: params,
        timeout: 10000,
      });
    }

    // MSG91 can return HTTP 200 with an error payload/text.
    if (looksLikeMsg91Error(response.data)) {
      throw new Error(`MSG91 rejected SMS request: ${JSON.stringify(response.data)}`);
    }

    console.log(`✅ OTP sent successfully to ${normalizedPhone}. Response:`, response.data);
    return { ok: true, message: 'OTP sent to your phone', request_id: response.data };
  } catch (error) {
    console.error(`❌ Failed to send OTP:`, error.response?.data || error.message);
    console.error(`Full error:`, error);
    throw new Error(`Failed to send OTP: ${error.response?.data || error.message}`);
  }
};

exports.verifyOtp = async (phone, otp) => {
  try {
    // Normalize phone same way as sendOtp
    let normalizedPhone = phone.toString().replace(/\D/g, '');
    if (normalizedPhone.length === 12 && normalizedPhone.startsWith('91')) {
      normalizedPhone = normalizedPhone.slice(2);
    }

    const stored = otpStore[normalizedPhone];

    // Check if OTP exists and hasn't expired
    if (!stored) {
      console.log(`❌ No OTP found for ${normalizedPhone}`);
      return false;
    }

    if (Date.now() > stored.expires) {
      console.log(`❌ OTP expired for ${normalizedPhone}`);
      delete otpStore[normalizedPhone];
      return false;
    }

    if (stored.otp !== otp) {
      console.log(`❌ Invalid OTP for ${normalizedPhone}. Got ${otp}, expected ${stored.otp}`);
      return false;
    }

    // OTP is valid - delete it
    console.log(`✅ OTP verified for ${normalizedPhone}`);
    delete otpStore[normalizedPhone];
    return true;
  } catch (error) {
    console.error(`❌ OTP verification error:`, error.message);
    return false;
  }
};
