const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { auth, admin } = require('../middleware/auth');

router.get('/', [auth, admin], async (req, res) => {
  const reports = await Report.find().sort({ timestamp: -1 });
  res.json(reports);
});

module.exports = router;