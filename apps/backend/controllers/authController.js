const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

    // In a real app, send OTP via Twilio/AWCC here.
    console.log(`[MOCK SMS] Sent OTP ${otp} to ${phoneNumber}`);

    res.json({ message: 'OTP sent successfully', mockOtp: otp }); // Returning mockOtp for easy testing
  } catch (error) {
    res.status(500).json({ error: 'Failed to request OTP' });
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
