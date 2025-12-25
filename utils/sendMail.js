const nodemailer = require('nodemailer');

const CLIENT_URL =
   process.env.CLIENT_URL_PROD ||
   process.env.CLIENT_URL ||
   'http://localhost:3000';

const sendMail = async ({ to, subject, html }) => {
   const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      auth: {
         user: process.env.EMAIL_USER,
         pass: process.env.EMAIL_PASS
      },
      secure: process.env.NODE_ENV === 'development' ? false : true,
      tls: {
         rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true,
      },
   });

   try {
      await transporter.sendMail({
         from: process.env.EMAIL_USER,
         to,
         subject,
         html
      });
      console.log('✅ Email sent to', to);
   } catch (err) {
      console.error('❌ Error sending email:', err);
      throw err; // backend catch etsin diye tekrar fırlat
   }
};

// Send Verification Link for Sign Up
const sendSignUpVerificationLink = async (email, token) => {
   const verificationLink = `${CLIENT_URL}/auth/sign-up/create-password?token=${token}`;

   await sendMail({
      to: email,
      subject: 'Verify your email - Inlyne',
      html: `
         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email & Create Password</h2>
            <p>Thank you for signing up! Please click the button below to verify your email address and create your password:</p>
            <div style="margin: 30px 0;">
               <a href="${verificationLink}" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Create Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
         </div>
      `,
   });
};

// Send Reset Password Link
const sendResetPasswordLink = async (email, token) => {
   const resetLink = `${CLIENT_URL}/auth/reset-password/create-password?token=${token}`;

   await sendMail({
      to: email,
      subject: 'Reset your password - Inlyne',
      html: `
         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset your password</h2>
            <p>We received a request to reset your password. Click the button below to set a new one:</p>
            <div style="margin: 30px 0;">
               <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${resetLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 15 minutes.</p>
         </div>
      `,
   });
};

module.exports = {
   sendMail,
   sendSignUpVerificationLink,
   sendResetPasswordLink
};