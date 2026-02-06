const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendActivationEmail = async (email, token) => {
  const activationUrl = `${process.env.FRONTEND_URL}/activate/${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Activate Your CloudDrive Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Welcome to CloudDrive!</h1>
        <p>Thank you for registering. Please click the button below to activate your account:</p>
        <a href="${activationUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Activate Account
        </a>
        <p style="color: #666;">If you didn't create an account, please ignore this email.</p>
        <p style="color: #666;">This link will expire in 24 hours.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Reset Your CloudDrive Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Password Reset Request</h1>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        <p style="color: #666;">This link will expire in 1 hour.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendActivationEmail,
  sendPasswordResetEmail,
};
