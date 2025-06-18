// utils/sendVerificationEmail.js
const nodemailer = require('nodemailer');

const sendVerificationEmail = async (to, token) => {
  const baseUrl = 'https://bug-tracker2-1.onrender.com';
  const verificationLink = `${baseUrl}/verify-email?token=${token}`;

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
      <p>If you did not create an account, you can ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;
