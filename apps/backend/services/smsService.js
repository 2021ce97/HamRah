const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let client;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Sends an OTP SMS to the designated phone number.
 * Fallbacks to console logging if Twilio is not configured.
 * @param {string} phoneNumber 
 * @param {string} otp 
 */
exports.sendOtp = async (phoneNumber, otp) => {
  const messageBody = `Your HamRah verification code is: ${otp}. Please do not share this code.`;

  if (client && TWILIO_PHONE_NUMBER) {
    try {
      const message = await client.messages.create({
        body: messageBody,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      console.log(`[Twilio SMS] Sent message successfully: SID ${message.sid}`);
      return { success: true, provider: 'twilio', sid: message.sid };
    } catch (error) {
      console.error(`[Twilio SMS Error] Failed to send SMS:`, error.message);
      throw new Error(`SMS delivery failed: ${error.message}`);
    }
  } else {
    // Development Mock Mode
    console.log(`\n======================================================`);
    console.log(`[MOCK SMS] TO: ${phoneNumber}`);
    console.log(`[MOCK SMS] MESSAGE: ${messageBody}`);
    console.log(`======================================================\n`);
    return { success: true, provider: 'mock', otp };
  }
};
