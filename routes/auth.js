const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

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
      role: 'user' // default role
    });

    await user.save();

    // Create verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const verificationUrl = `http://localhost:5000/auth/verify/${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your FixSignal Account',
      html: `
        <p>Hello ${name},</p>
        <p>Thank you for signing up. Please click the link below to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link expires in 1 hour.</p>
        <p>If you did not sign up, ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      msg: 'Signup successful. Please check your email to verify your account.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error during signup' });
  }
});

// GET /auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const { userId } = jwt.verify(req.params.token, process.env.JWT_SECRET);

    const user = await User.findByIdAndUpdate(
      userId,
      { verified: true },
      { new: true }
    );

    if (!user) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    res.send(`
      <h2>Email Verified Successfully!</h2>
      <p>Your account is now active.</p>
      <p>You can now <a href="http://localhost:3000/login">log in</a> to FixSignal.</p>
    `);
  } catch (err) {
    console.error(err);
    res.status(400).send('Invalid or expired verification link.');
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (!user.verified) {
      return res.status(400).json({ msg: 'Please verify your email before logging in' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT payload
    const payload = {
      userId: user._id,
      role: user.role || 'user'
    };

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

module.exports = router;