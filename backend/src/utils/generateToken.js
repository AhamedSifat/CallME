import jwt from 'jsonwebtoken';

const generateToken = (payload, expiresIn = '7d') => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, secret, { expiresIn });
};

export default generateToken;
