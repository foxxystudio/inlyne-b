const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const { sendSignUpVerificationLink, sendResetPasswordLink } = require('../utils/sendMail');
const crypto = require('crypto');

const router = express.Router();

const getTokenCookieOptions = () => {
   const isProduction = process.env.NODE_ENV === 'production';
   return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
   };
};

// Workspace ID generate
const generateWorkspaceId = async () => {
   let id;
   let exists = true;

   while (exists) {
      id = crypto.randomBytes(4).toString('hex'); // 8 char: [0-9a-f]
      exists = await User.exists({ workspaceID: id })
         || await TempUser.exists({ workspaceID: id });
   }

   return id;
};

// JWT auth middleware for protected routes
const authenticateToken = async (req, res, next) => {
   const token = req.cookies?.access_token;

   // Token yoksa sessizce success:false dön (401 vermeden)
   if (!token) {
      return res.status(200).json({ msg: 'No token found. Please login.', success: false, user: null });
   }

   try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
         return res.status(401).json({ msg: 'User not found.', success: false, userNotFound: true, user: null });
      }

      req.user = user;
      next();
   } catch (err) {
      console.error('❌ Authentication error:', err);
      if (err.name === 'TokenExpiredError') {
         return res.status(401).json({ msg: 'Token expired. Please login again.', success: false, tokenExpired: true, user: null });
      }
      return res.status(401).json({ msg: 'Invalid token.', success: false, tokenInvalid: true, user: null });
   }
};

// Get current user from JWT (requires cookie token)
router.get('/me', authenticateToken, async (req, res) => {
   res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
   });

   res.status(200).json({
      user: {
         id: req.user._id,
         email: req.user.email,
         name: req.user.name,
         isVerified: req.user.isVerified,
         workspaceID: req.user.workspaceID,
         role: req.user.role,
         createdAt: req.user.createdAt,
         updatedAt: req.user.updatedAt
      }
   });
});

// Step 1: Sign Up - Email exist kontrolü ve verify email gönderme
router.post('/signup', async (req, res) => {
   const { email, name } = req.body;

   try {
      // Email validation
      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
         return res.status(400).json({ msg: 'Please provide a valid email address.' });
      }

      // Check if email already exists in User collection
      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return res.status(400).json({ msg: 'This email is already in use.' });
      }

      // Check if email already exists in TempUser collection and delete it
      const existingTempUser = await TempUser.findOne({ email });
      if (existingTempUser) {
         await TempUser.deleteOne({ email });
      }

      // Create verification token
      const token = jwt.sign({ email, name }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const workspaceID = await generateWorkspaceId();

      // Save to TempUser collection
      const tempUser = new TempUser({
         email,
         name,
         verificationToken: token,
         isEmailVerified: false,
         workspaceID
      });
      await tempUser.save();

      // Send verification email
      await sendSignUpVerificationLink(email, token);

      res.status(201).json({
         msg: 'Verification link sent to your email.',
         success: true
      });
   } catch (err) {
      console.error('❌ Signup error:', err);
      res.status(500).json({ msg: 'Server error from signup.' });
   }
});

// Step 2: Verify Email - Token'ı verify et ve user'ı create-password sayfasına yönlendir
router.get('/verify-email', async (req, res) => {
   const { token } = req.query;

   try {
      if (!token) {
         return res.status(400).json({ msg: 'Token is required.' });
      }

      // Verify token
      let decoded;
      try {
         decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
         return res.status(400).json({ msg: 'Invalid or expired token.' });
      }

      // Find temp user
      const tempUser = await TempUser.findOne({
         email: decoded.email,
         name: decoded.name,
         verificationToken: token
      });

      if (!tempUser) {
         return res.status(404).json({ msg: 'Verification link is invalid or expired.' });
      }

      // Update temp user as verified
      tempUser.isEmailVerified = true;
      await tempUser.save();

      res.status(200).json({
         msg: 'Email verified successfully.',
         success: true,
         email: decoded.email,
         token: token
      });
   } catch (err) {
      console.error('❌ Verify email error:', err);
      res.status(500).json({ msg: 'Server error from verify email.' });
   }
});

// Step 3: Create Password - Şifre oluştur ve geçici user'ı asıl user'a dönüştür
router.post('/create-password', async (req, res) => {
   const { token, password } = req.body;

   try {
      if (!token || !password) {
         return res.status(400).json({ msg: 'Token and password are required.' });
      }

      // Password validation
      if (password.length < 8) {
         return res.status(400).json({ msg: 'Password must be at least 8 characters long.' });
      }

      // Verify token
      let decoded;
      try {
         decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
         return res.status(400).json({ msg: 'Invalid or expired token.' });
      }

      // Find temp user and check if email is verified
      const tempUser = await TempUser.findOne({
         email: decoded.email,
         name: decoded.name,
         verificationToken: token,
         isEmailVerified: true
      });

      if (!tempUser) {
         return res.status(404).json({ msg: 'Invalid verification or email not verified.' });
      }

      // Check if user already exists (double check)
      const existingUser = await User.findOne({ email: decoded.email });
      if (existingUser) {
         await TempUser.deleteOne({ email: decoded.email, name: decoded.name });
         return res.status(400).json({ msg: 'This email is already registered.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new User({
         email: decoded.email,
         name: decoded.name,
         password: hashedPassword,
         isVerified: true,
         workspaceID: tempUser.workspaceID,
         role: 'user'
      });
      await newUser.save();

      // Delete temp user
      await TempUser.deleteOne({ email: decoded.email, name: decoded.name });

      // Create JWT for login
      const loginToken = jwt.sign(
         {
            userId: newUser._id,
            email: newUser.email,
            name: newUser.name,
            workspaceID: newUser.workspaceID,
         },
         process.env.JWT_SECRET,
         { expiresIn: '7d' }
      );

      // Set auth cookie as HttpOnly so it cannot be read via document.cookie
      res.cookie('access_token', loginToken, getTokenCookieOptions());

      res.status(201).json({
         msg: 'Account created successfully.',
         success: true,
         workspaceID: tempUser.workspaceID
      });
   } catch (err) {
      console.error('❌ Create password error:', err);
      res.status(500).json({ msg: 'Server error from create password.' });
   }
});

// Step 0: Sign In - Email/password login
router.post('/signin', async (req, res) => {
   const { email, password } = req.body;

   try {
      if (!email || !password) {
         return res.status(400).json({
            success: false,
            msg: 'Email and password are required.',
            emailError: !email ? 'Email is required.' : undefined,
            passwordError: !password ? 'Password is required.' : undefined,
         });
      }

      const user = await User.findOne({ email });
      if (!user) {
         return res.status(401).json({
            success: false,
            msg: 'No account found for this email.',
            emailError: 'No account found for this email.'
         });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return res.status(401).json({
            success: false,
            msg: 'Incorrect password.',
            passwordError: 'Incorrect password.'
         });
      }

      const loginToken = jwt.sign(
         {
            userId: user._id,
            email: user.email,
            name: user.name,
            workspaceID: user.workspaceID,
         },
         process.env.JWT_SECRET,
         { expiresIn: '7d' }
      );

      res.cookie('access_token', loginToken, getTokenCookieOptions());

      res.status(200).json({
         success: true,
         msg: 'Logged in successfully.',
         user: {
            email: user.email,
            name: user.name,
            workspaceID: user.workspaceID,
         }
      });
   } catch (err) {
      console.error('❌ Signin error:', err);
      res.status(500).json({ msg: 'Server error from signin.' });
   }
});

// Reset Password - request link
router.post('/reset-password/request', async (req, res) => {
   const { email } = req.body;

   try {
      if (!email) {
         return res.status(400).json({
            success: false,
            msg: 'Email is required.',
            emailError: 'Email is required.'
         });
      }

      const user = await User.findOne({ email });
      if (!user) {
         return res.status(404).json({
            success: false,
            msg: 'No account found for this email.',
            emailError: 'No account found for this email.'
         });
      }

      const resetToken = jwt.sign(
         { userId: user._id, email: user.email, name: user.name, type: 'reset' },
         process.env.JWT_SECRET,
         { expiresIn: '15m' }
      );

      await sendResetPasswordLink(email, resetToken);

      res.status(200).json({
         success: true,
         msg: 'Password reset link sent to your email.'
      });
   } catch (err) {
      console.error('❌ Reset password request error:', err);
      res.status(500).json({ msg: 'Server error from reset password request.' });
   }
});

// Reset Password - verify token
router.get('/reset-password/verify', async (req, res) => {
   const { token } = req.query;

   try {
      if (!token) {
         return res.status(400).json({ success: false, msg: 'Token is required.' });
      }

      let decoded;
      try {
         decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
         return res.status(400).json({ success: false, msg: 'Invalid or expired token.' });
      }

      if (decoded.type !== 'reset') {
         return res.status(400).json({ success: false, msg: 'Invalid reset token.' });
      }

      res.status(200).json({
         success: true,
         email: decoded.email
      });
   } catch (err) {
      console.error('❌ Reset password verify error:', err);
      res.status(500).json({ msg: 'Server error from reset password verify.' });
   }
});

// Reset Password - set new password
router.post('/reset-password/create-password', async (req, res) => {
   const { token, password } = req.body;

   try {
      if (!token || !password) {
         return res.status(400).json({
            success: false,
            msg: 'Token and password are required.',
            passwordError: !password ? 'Password is required.' : undefined,
         });
      }

      if (password.length < 8) {
         return res.status(400).json({
            success: false,
            msg: 'Password must be at least 8 characters long.',
            passwordError: 'Password must be at least 8 characters long.'
         });
      }

      let decoded;
      try {
         decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
         return res.status(400).json({ success: false, msg: 'Invalid or expired token.' });
      }

      if (decoded.type !== 'reset') {
         return res.status(400).json({ success: false, msg: 'Invalid reset token.' });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
         return res.status(404).json({ success: false, msg: 'User not found.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({
         success: true,
         msg: 'Password updated successfully. Please sign in with your new password.',
      });
   } catch (err) {
      console.error('❌ Reset password create error:', err);
      res.status(500).json({ msg: 'Server error from reset password create.' });
   }
});

// Logout by clearing auth cookie
router.post('/logout', (req, res) => {
   res.clearCookie('access_token', getTokenCookieOptions());
   res.status(200).json({ msg: 'Logged out successfully.' });
});

module.exports = router;