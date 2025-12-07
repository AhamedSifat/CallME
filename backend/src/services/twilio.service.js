import twilio from 'twilio';

import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

//SEND OTP TO PHONE NUMBER
const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    console.log('Sending OTP to phone number:', phoneNumber);
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    const response = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    console.log('OTP sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

//VERIFY OTP CODE

const verifyOtpCode = async (phoneNumber, code) => {
  try {
    console.log('Verifying OTP for phone number:', phoneNumber);
    if (!phoneNumber || !code) {
      throw new Error('Phone number and code are required');
    }
    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code });
    console.log('OTP verified successfully:', response);
    return response;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error('Failed to verify OTP');
  }
};

export { sendOtpToPhoneNumber, verifyOtpCode };
