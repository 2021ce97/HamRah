const express = require('express');
const router = express.Router();
const routeService = require('../services/routeService');

router.post('/directions', async (req, res) => {
  try {
    const { start, end } = req.body;
    if (!start || !end || start.lng === undefined || start.lat === undefined || end.lng === undefined || end.lat === undefined) {
      return res.status(400).json({ error: 'Start and end coordinates are required with lat and lng values' });
    }
    
    const result = await routeService.getDirections(start, end);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
