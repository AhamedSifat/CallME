import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      sparse: true,
      unique: true,
    },
    phoneSuffix: {
      type: String,
      required: true,
    },

    username: {
      type: String,
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    emailOtp: {
      type: String,
    },
    emailOtpExpiry: {
      type: Date,
    },
    profilePicture: {
      type: String,
    },
    about: {
      type: String,
    },

    lastSeen: {
      type: Date,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    agreed: {
      type: Boolean,
      default: false,
    },

    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
