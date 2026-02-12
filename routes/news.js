const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`https://newsapi.org/v2/everything?q=forex+gold+bitcoin&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`);
    res.json(response.data.articles.slice(0, 5));
  } catch (err) {
    res.status(500).json({ msg: 'News fetch failed' });
  }
});

module.exports = router;