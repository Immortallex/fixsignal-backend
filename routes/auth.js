const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// POST /auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please provide name, email and password' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      verified: false,
      role: 'user'
    });

    await user.save();

    // Create verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const verificationUrl = `https://fixsignal-backend.onrender.com/auth/verify/${verificationToken}`;

    const msg = {
      to: email,
      from: 'noreply@fixsignal.com',        // You can change this later
      subject: 'Verify Your FixSignal Account',
      html: `
        <h2>Welcome to FixSignal, ${name}!</h2>
        <p>Thank you for signing up.</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background:#ffd700;color:#1a237e;padding:10px 20px;text-decoration:none;border-radius:4px;">Verify My Account</a>
        <p>This link expires in 1 hour.</p>
      `
    };

    await sgMail.send(msg);

    res.status(201).json({
      msg: 'Signup successful. Please check your email to verify your account.'
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ msg: 'Server error during signup' });
  }
});

// GET /auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const { userId } = jwt.verify(req.params.token, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(userId, { verified: true });
    res.send(`
      <h2>Email Verified Successfully!</h2>
      <p>Your FixSignal account is now active.</p>
      <p>You can now <a href="https://your-vercel-url.vercel.app/login">log in</a>.</p>
    `);
  } catch (err) {
    res.status(400).send('Invalid or expired verification link.');
  }
});

// Login route (unchanged)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.verified) {
    return res.status(400).json({ msg: 'Invalid credentials or not verified' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  const payload = { userId: user._id, role: user.role || 'user' };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    }
  });
});

module.exports = router;