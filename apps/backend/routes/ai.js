const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// Route for Tazkira OCR (Driver Verification)
router.post('/verify-tazkira', async (req, res) => {
  const { base64Image } = req.body;
  
  if (!base64Image) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  const result = await aiService.verifyTazkiraOCR(base64Image);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// Route for Smart Fare Suggestion (Rider App)
router.post('/suggest-fare', async (req, res) => {
  const { pickup, destination, distanceKm } = req.body;

  if (!pickup || !destination || !distanceKm) {
    return res.status(400).json({ error: 'Pickup, destination, and distanceKm are required' });
  }

  const result = await aiService.suggestSmartFare(pickup, destination, distanceKm);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ error: result.error });
  }
});

module.exports = router;
