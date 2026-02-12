const express = require('express');
const router = express.Router();
const Paystack = require('paystack-node');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);

// POST initialize subscription payment
router.post('/initialize', auth, async (req, res) => {
  try {
    const { email } = req.user;
    const transaction = await paystack.transaction.initialize({
      email,
      amount: 500000, // 5000 NGN in kobo (test amount)
      callback_url: 'http://localhost:3000/profile', // Redirect after payment
      metadata: { userId: req.user.userId }
    });

    res.json({ authorization_url: transaction.data.authorization_url });
  } catch (err) {
    res.status(500).json({ msg: 'Payment init failed' });
  }
});

// POST webhook for payment verification (Paystack calls this)
router.post('/webhook', async (req, res) => {
  const event = req.body;

  if (event.event === 'charge.success') {
    const userId = event.data.metadata.userId;
    await User.findByIdAndUpdate(userId, { role: 'premium' });
    console.log('Subscription successful for user:', userId);
  }

  res.sendStatus(200);
});

module.exports = router;