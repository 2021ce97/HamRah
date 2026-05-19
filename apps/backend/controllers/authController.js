const User = require('../models/User');
const jwt = require('jsonwebtoken');
const smsService = require('../services/smsService');

// Secret for JWT (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'hamrah_super_secret_key_2026';

// Mock OTP Database (In production, use Redis and Twilio)
const otpStore = {};

exports.requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

    // Generate a 4-digit mock OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[phoneNumber] = otp;

    // Send via SMS service (uses Twilio if configured, else console mock logs)
    const result = await smsService.sendOtp(phoneNumber, otp);

    res.json({ 
      message: 'OTP sent successfully', 
      provider: result.provider,
      ...(result.provider === 'mock' ? { mockOtp: otp } : {}) // Only return mockOtp in console mode for testing
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    if (otpStore[phoneNumber] !== otp) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Clean up OTP
    delete otpStore[phoneNumber];

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    let isNewUser = false;
    
    if (!user) {
      user = new User({ phoneNumber });
      await user.save();
      isNewUser = true;
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, phoneNumber: user.phoneNumber, role: 'rider' }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user, isNewUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};
