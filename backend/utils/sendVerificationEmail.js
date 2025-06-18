const nodemailer = require('nodemailer');

const sendVerificationEmail = async (to, token) => {
  const baseUrl = 'https://bug-tracker2-1.onrender.com';
  const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Bug Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your email address',
    html: `
      <h3>Verify Your Email</h3>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>Link expires in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
  } catch (err) {
    console.error('Error sending verification email:', err);
    throw new Error('Failed to send verification email');
  }
};

module.exports = sendVerificationEmail;