const nodemailer = require('nodemailer');

// Configure nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

/**
 * Send email from contact form
 */
const sendContactEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    // Email to UniGuide team
    const mailOptions = {
      from: `"UniGuide Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
      replyTo: email
    };

    // Send confirmation email to user
    const userConfirmationOptions = {
      from: `"UniGuide Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thank you for contacting UniGuide',
      html: `
        <h2>Thank you for reaching out!</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>Here's a copy of your message:</p>
        <p><em>${message}</em></p>
        <br>
        <p>Best regards,</p>
        <p>The UniGuide Team</p>
      `
    };

    // Send both emails
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(userConfirmationOptions);

    res.status(200).json({ 
      success: true,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send email',
      error: error.message 
    });
  }
};

module.exports = {
  sendContactEmail
};