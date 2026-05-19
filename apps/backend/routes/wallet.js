const express = require('express');
const router = express.Router();
const walletService = require('../services/walletService');

// Route for Drivers to top-up their commission balance locally
router.post('/topup', async (req, res) => {
  const { driverId, amountAfn, provider } = req.body;
  
  if (!driverId || !amountAfn || !provider) {
    return res.status(400).json({ error: 'driverId, amountAfn, and provider are required' });
  }

  const result = await walletService.processLocalTopUp(driverId, amountAfn, provider);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// Route for Diaspora "Ride Gifting"
router.post('/gift', async (req, res) => {
  const { riderId, amountUsd } = req.body;

  if (!riderId || !amountUsd) {
    return res.status(400).json({ error: 'riderId and amountUsd are required' });
  }

  const result = await walletService.processDiasporaGift(riderId, amountUsd);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ error: result.error });
  }
});

module.exports = router;
