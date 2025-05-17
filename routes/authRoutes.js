const express = require('express');
const bcrypt = require('bcryptjs');
const { Student } = require('../models/studentModel');
const { Mentor } = require('../models/mentorModel');
const { generateOTP, verifyOTP, sendOTPEmail } = require('../utils/otpUtil');
const { protect } = require('../middleware/authMiddleware');
const { createToken } = require('@stream-io/video-client');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

// Replace with your actual Stream API key and secret
const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

const router = express.Router();

// Verify email by sending OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Generate and send OTP
    const otp = await generateOTP(email);
    await sendOTPEmail(email, otp, 'verification');
    
    res.status(200).json({ message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ message: 'Error sending verification code', error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Verify OTP
    const isValid = verifyOTP(email, otp);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ message: 'Error verifying code', error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Generate and send new OTP
    const otp = await generateOTP(email);
    await sendOTPEmail(email, otp);
    
    res.status(200).json({ message: 'New verification code sent successfully' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ message: 'Error sending verification code', error: error.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists first
    const student = await Student.findOne({ email });
    const mentor = await Mentor.findOne({ email });
    
    if (!student && !mentor) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }
    
    // Check if this is a Google authenticated user
    const user = student || mentor;
    if (user.password === '[GOOGLE_AUTH_USER]') {
      return res.status(400).json({ 
        message: 'Google-authenticated accounts need to reset passwords through Google',
        isGoogleUser: true
      });
    }
    
    // Generate and send OTP
    const otp = await generateOTP(email);
    await sendOTPEmail(email, otp, 'reset');
    
    res.status(200).json({ message: 'Password reset code sent successfully' });
  } catch (error) {
    console.error('Error sending reset code:', error);
    res.status(500).json({ message: 'Error sending reset code', error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // Check which type of user (student or mentor)
    let user = await Student.findOne({ email });
    let isStudent = true;
    
    if (!user) {
      user = await Mentor.findOne({ email });
      isStudent = false;
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Verify current password for changing password
router.post('/verify-password', protect, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Ensure the request is for the authenticated user
    if (req.user.email !== email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    let user;
    if (role === 'student') {
      user = await Student.findOne({ email }).select('+password');
    } else if (role === 'mentor') {
      user = await Mentor.findOne({ email }).select('+password');
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    res.status(200).json({ message: 'Password verified successfully' });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if user is a Google-authenticated user (has no password)
router.get('/check-auth-type', protect, async (req, res) => {
  try {
    const { email } = req.query;
    
    // Verify the request is made by the same user
    if (req.user.email !== email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    let user;
    if (req.user.role === 'student') {
      user = await Student.findOne({ email }).select('+password');
    } else if (req.user.role === 'mentor') {
      user = await Mentor.findOne({ email }).select('+password');
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has a password set (non-Google user) or not (Google user)
    const isGoogleUser = !user.password || user.password === '[GOOGLE_AUTH_USER]';
    
    res.status(200).json({ isGoogleUser });
  } catch (error) {
    console.error('Error checking auth type:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add this new route for updating password after OTP verification
router.post('/update-password', protect, async (req, res) => {
  try {
    const { email, newPassword, role } = req.body;
    
    // Ensure the request is for the authenticated user
    if (req.user.email !== email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    let user;
    if (role === 'student') {
      user = await Student.findOne({ email });
    } else if (role === 'mentor') {
      user = await Mentor.findOne({ email });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate Stream token
router.get('/stream-token', async (req, res) => {
  try {
    const userId = req.query.userId; // Pass userId as a query parameter
    const userName = req.query.userName; // Pass userName as a query parameter

    console.log('Generating Stream token for user:', { userId, userName });

    if (!STREAM_API_SECRET) {
      console.error('Stream API secret is missing');
      return res.status(500).json({ error: 'Stream API secret is missing' });
    }

    // Define the payload for the token
    const payload = {
      user_id: userId,
      name: userName,
    };

    // Generate the token using the Stream API secret
    const token = jwt.sign(payload, STREAM_API_SECRET, { expiresIn: '24h' });

    console.log('Generated Stream token:', token);
    return res.json({ token });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;