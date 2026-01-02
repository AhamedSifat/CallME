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

export const updateProfile = async (data) => {
  try {
    const response = await ApiInstance.put('/auth/update-profile', data);
    return response.data;
  } catch (error) {
    console.error(
      'updateProfile error:',
      error.response?.data || error.message
    );
    throw error;
  }
};

export const checkAuthenticated = async () => {
  try {
    const response = await ApiInstance.get('/auth/check-auth');
    if (response.data.status === 'success') {
      return {
        isAuthenticated: true,
        user: response.data.user,
      };
    } else if (response.data.status === 'error') {
      return {
        isAuthenticated: false,
      };
    }
  } catch (error) {
    console.error(
      'checkAuthenticated error:',
      error.response?.data || error.message
    );
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await ApiInstance.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('logout error:', error.response?.data || error.message);
    throw error;
  }
};
