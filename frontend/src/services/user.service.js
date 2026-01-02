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
