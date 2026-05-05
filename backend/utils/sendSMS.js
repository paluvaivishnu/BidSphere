const twilio = require('twilio');

// Initialize Twilio Client conditionally
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Sends an SMS automatically with a mock fallback
 * @param {string} to - The phone number to send to
 * @param {string} message - The text body
 */
const sendSMS = async (to, message) => {
  if (!to) return false;

  // Mock Fallback
  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('\n=============================================');
    console.log('📱 MOCK SMS TRIGGERED (No Twilio Keys Found)');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('=============================================\n');
    return true; // Simulate success
  }

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log(`Twilio SMS sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Twilio SMS Failed:', error);
    return false;
  }
};

module.exports = sendSMS;
