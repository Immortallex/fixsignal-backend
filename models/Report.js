const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: { 
    type: String 
    // Examples: 'user_login', 'signal_view' – this is a comment, not part of the schema
  },
  details: { type: mongoose.Schema.Types.Mixed }, // Allows any object structure
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);