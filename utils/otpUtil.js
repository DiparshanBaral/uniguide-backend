const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');

// OTP storage (in production, use Redis or MongoDB)
const otpStorage = new Map();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // Use app password, not regular password
  },
});

// Generate OTP and store it
const generateOTP = async (email) => {
  // Generate a 6-digit OTP
  const otp = otpGenerator.generate(6, { 
    upperCaseAlphabets: false, 
    lowerCaseAlphabets: false,
    specialChars: false 
  });
  
  // Store OTP with expiration (15 minutes)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  
  otpStorage.set(email, {
    otp,
    expiresAt,
  });
  
  return otp;
};

// Verify OTP
const verifyOTP = (email, userOtp) => {
  const otpData = otpStorage.get(email);
  
  if (!otpData) return false;
  
  // Check if OTP has expired
  if (new Date() > otpData.expiresAt) {
    otpStorage.delete(email);
    return false;
  }
  
  // Verify OTP
  if (otpData.otp === userOtp) {
    otpStorage.delete(email); // Clean up after use
    return true;
  }
  
  return false;
};

// Send OTP via email
const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  let subject, heading, mainText;
  
  if (purpose === 'reset') {
    subject = 'UniGuide Password Reset OTP';
    heading = 'UniGuide Password Reset';
    mainText = 'You requested a password reset for your UniGuide account. Please use the following OTP to verify your identity:';
  } else {
    subject = 'UniGuide Email Verification';
    heading = 'Verify Your Email Address';
    mainText = 'Please use the following OTP to verify your email address:';
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4f46e5; text-align: center;">${heading}</h2>
        <p>${mainText}</p>
        <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280;">
          © ${new Date().getFullYear()} UniGuide. All rights reserved.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  generateOTP,
  verifyOTP,
  sendOTPEmail,
};