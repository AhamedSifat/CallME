import { ApiInstance } from './url.service';

export const sendOtp = async (phoneNumber, phoneSuffix, email) => {
  try {
    const response = await ApiInstance.post('/auth/send-otp', {
      phoneNumber,
      phoneSuffix,
      email,
    });
    return response.data;
  } catch (error) {
    console.error('sendOtp error:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyOtp = async (phoneNumber, phoneSuffix, otp, email) => {
  try {
    const response = await ApiInstance.post('/auth/verify-otp', {
      phoneNumber,
      phoneSuffix,
      otp,
      email,
    });
    return response.data;
  } catch (error) {
    console.error('verifyOtp error:', error.response?.data || error.message);
    throw error;
  }
};
