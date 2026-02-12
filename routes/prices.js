const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,gold&vs_currencies=usd');
    const btc = response.data.bitcoin.usd;
    const gold = response.data.gold.usd;
    res.json({ btc, gold });
  } catch (err) {
    console.error('CoinGecko fetch error:', err.message);
    res.status(500).json({ msg: 'Price fetch failed' });
  }
});

module.exports = router;