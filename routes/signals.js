const express = require('express');
const router = express.Router(); // ← Missing line added here
const Signal = require('../models/Signal');
const Report = require('../models/Report');
const { auth, admin } = require('../middleware/auth');

// GET all signals (for verified users)
router.get('/', auth, async (req, res) => {
  if (!req.user.verified) return res.status(403).json({ msg: 'Verify account first' });
  const signals = await Signal.find().sort({ createdAt: -1 });
  
  // Log report
  await new Report({ type: 'signal_view', details: { userId: req.user.userId } }).save();
  
  res.json(signals);
});

// POST create signal (admin only)
router.post('/', [auth, admin], async (req, res) => {
  const { pair, type, entryPrice, stopLoss, takeProfit, strategyNotes } = req.body;
  
  // High assurance check (example: require demand/supply keywords)
  if (!strategyNotes.toLowerCase().includes('demand') && !strategyNotes.toLowerCase().includes('supply')) {
    return res.status(400).json({ msg: 'Strategy notes must include "demand" or "supply" for high assurance' });
  }
  
  const signal = new Signal({
    pair, type, entryPrice, stopLoss, takeProfit, strategyNotes,
    createdBy: req.user.userId
  });
  await signal.save();
  
  // Emit real-time
  const io = req.app.get('io');
  io.emit('newSignal', signal);
  
  res.json(signal);
});

// PUT edit signal (admin only)
router.put('/:id', [auth, admin], async (req, res) => {
  const signal = await Signal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!signal) return res.status(404).json({ msg: 'Signal not found' });
  
  // Emit update
  const io = req.app.get('io');
  io.emit('newSignal', signal);
  
  res.json(signal);
});

module.exports = router;