import generateOtp from '../utils/otpGenerator.js';
import User from '../models/user.model.js';
import response from '../utils/response.js';

const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = generateOtp();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);
  let user;
  try {
    if (email) {
      user = await User.findOne({ email });

      if (!user) {
        user = new User({ email });
      }
      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;
      await user.save();

      return response(res, 200, 'OTP send to your email', { email });
    }

    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, 'Phone number and suffix are required');
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
    user = await User.findOne({ phoneNumber: fullPhoneNumber });

    if (!user) {
      user = new User({ phoneNumber: fullPhoneNumber, phoneSuffix });
    }

    await user.save();

    return response(res, 200, 'OTP sent successfully', {
      phoneNumber: fullPhoneNumber,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return response(res, 500, 'Internal server error');
  }
};
