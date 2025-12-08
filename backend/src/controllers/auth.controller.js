import generateOtp from '../utils/otpGenerator.js';
import User from '../models/user.model.js';
import { response } from '../utils/responseHandler.js';
import { sendOtpEmail } from '../services/email.service.js';
import {
  sendOtpToPhoneNumber,
  verifyOtpCode,
} from '../services/twilio.service.js';
import generateToken from '../utils/generateToken.js';
import { uploadFileToCloudinary } from '../config/cloudinaryConfig.js';
import Conversation from '../models/conversation.model.js';

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

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { username, about, agreed } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, 'User not found');
    }

    const profilePicture = req.file ? req.file.path : null;

    if (profilePicture) {
      const uploadResult = await uploadFileToCloudinary(req.file);
      user.profilePicture = uploadResult.secure_url;
    }

    if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    if (username) user.username = username;
    if (about) user.about = about;
    if (agreed) user.agreed = agreed;

    await user.save();
    return response(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    console.error('Error updating profile:', error);
    return response(res, 500, 'Internal server error');
  }
};

const checkAuthenticated = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (user) {
      return response(res, 200, 'User is authenticated', { user });
    }
    if (!user) {
      return response(res, 401, 'User is not authenticated');
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    return response(res, 500, 'Internal server error');
  }
};

const getAllUsers = async (req, res) => {
  const userId = req.user.id;
  try {
    const users = await User.find({ _id: { $ne: userId } })
      .select('username about profilePicture phoneNumber lastseen isOnline')
      .lean();

    const usersWithConversations = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [userId, user._id] },
        })
          .populate({
            path: 'lastMessage',
            select: 'content sender receiver createdAt',
          })
          .lean();
        return {
          ...user,
          conversation: conversation || null,
        };
      })
    );

    return response(
      res,
      200,
      'Users retrieved successfully',
      usersWithConversations
    );
  } catch (error) {
    console.error('Error retrieving users:', error);
    return response(res, 500, 'Internal server error');
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  return response(res, 200, 'Logged out successfully');
};

export {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUsers,
};
