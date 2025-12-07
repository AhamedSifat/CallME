import generateOtp from '../utils/otpGenerator.js';
import User from '../models/user.model.js';
import { response } from '../utils/response.js';
import { sendOtpEmail } from '../services/email.service.js';
import {
  sendOtpToPhoneNumber,
  verifyOtpCode,
} from '../services/twilio.service.js';
import generateToken from '../utils/generateToken.js';

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
      await sendOtpEmail(email, otp);
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

    await sendOtpToPhoneNumber(fullPhoneNumber);
    await user.save();

    return response(res, 200, 'OTP sent successfully', {
      phoneNumber: fullPhoneNumber,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return response(res, 500, 'Internal server error');
  }
};

const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, otp, email } = req.body;
  try {
    let user;
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        return response(res, 400, 'User not found');
      }
      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > user.emailOtpExpiry
      ) {
        return response(res, 400, 'Invalid or expired OTP');
      }

      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    }

    if (phoneNumber && phoneSuffix) {
      const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
      user = await User.findOne({ phoneNumber: fullPhoneNumber });
      if (!user) {
        return response(res, 400, 'User not found');
      }
      // Here you would typically verify the OTP with Twilio's service
      const result = await verifyOtpCode(fullPhoneNumber, otp);
      if (result.status !== 'approved') {
        return response(res, 400, 'Invalid OTP');
      }

      user.isVerified = true;
      await user.save();
    }
    const token = generateToken({ id: user._id });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response(res, 200, 'OTP verified successfully', { token, user });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return response(res, 500, 'Internal server error');
  }
};

export { sendOtp, verifyOtp };
