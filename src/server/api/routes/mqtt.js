const express = require('express');
const router = express.Router();

// Import the MQTT handlers (adjust path as needed)
const { healthCheck, notifyIfRestock, getLocation } = require('../mqtt/mqtt.js');

// GET /health/:vmId
// Returns JSON: { hardwareId, status, isOnline, lastChecked, [error] }
router.get('/health/:vmId', async (req, res) => {
  const { vmId } = req.params;
  try {
    const result = await healthCheck(vmId);
    res.json(result);
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /restock/:vmId
// Triggers a restock notification if the VM has just completed restocking
router.post('/restock/:vmId', async (req, res) => {
  const { vmId } = req.params;
  try {
    await notifyIfRestock(vmId);
    res.json({ success: true });
  } catch (err) {
    console.error('Notify restock failed:', err);
    res.status(500).json({ error: err.message });
  }
});
// GET /location/:vmId
// Returns last-known { lat, lng, lastUpdated } or 404 if not available
router.get('/location/:vmId', (req, res) => {
  const { vmId } = req.params;
  const locEntry = getLocation(vmId);
  if (!locEntry) {
    return res.status(404).json({ error: 'Location not available' });
  }
  res.json({
    hardwareId: vmId,
    location: {
      lat: locEntry.lat,
      lng: locEntry.lng
    },
    lastUpdated: locEntry.lastUpdated
  });
});

module.exports = router;
