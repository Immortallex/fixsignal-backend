const mongoose = require('mongoose');
const signalSchema = new mongoose.Schema({
  pair: { type: String, enum: ['XAUUSD', 'BTCUSD'], required: true },
  type: { type: String, enum: ['market', 'limit', 'stop'], required: true },
  entryPrice: Number,
  stopLoss: Number,
  takeProfit: Number,
  strategyNotes: String, // Demand/Supply, SMC, etc.
  assuranceLevel: { type: String, default: 'high' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Signal', signalSchema);