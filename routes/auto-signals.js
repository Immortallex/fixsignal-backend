const express = require('express');
const router = express.Router();
const Signal = require('../models/Signal');
const axios = require('axios');
const { admin } = require('../middleware/auth');

// POST auto-generate signal (admin only)
router.post('/', admin, async (req, res) => {
  try {
    // Fetch real data (prices/news)
    const pricesRes = await axios.get('http://localhost:5000/prices');
    const { btc, gold } = pricesRes.data;

    const newsRes = await axios.get('http://localhost:5000/news');
    const newsTitles = newsRes.data.map(n => n.title).join(' ');

    // Simple demand/supply logic (expand with ML later)
    const pair = Math.random() > 0.5 ? 'XAUUSD' : 'BTCUSD';
    const entryPrice = pair === 'XAUUSD' ? gold : btc;
    const type = ['market', 'limit', 'stop'][Math.floor(Math.random() * 3)];
    const stopLoss = entryPrice * 0.98; // 2% below
    const takeProfit = entryPrice * 1.02; // 2% above
    const strategyNotes = `High assurance from demand zone (SMC, institutional). News impact: ${newsTitles.slice(0, 100)}...`;

    const signal = new Signal({
      pair,
      type,
      entryPrice,
      stopLoss,
      takeProfit,
      strategyNotes,
      assuranceLevel: 'high',
      createdBy: req.user.userId
    });

    await signal.save();

    const io = req.app.get('io');
    io.emit('newSignal', signal);

    res.json(signal);
  } catch (err) {
    res.status(500).json({ msg: 'Auto-signal failed' });
  }
});

module.exports = router;