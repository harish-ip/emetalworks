const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const PricingSettings = require('../models/PricingSettings');
const { DEFAULT_PRICING } = require('../models/PricingSettings');

// Same admin auth as routes/admin.js
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

const dbConnected = () => mongoose.connection.readyState === 1;

// Strip mongoose internals so the frontend gets a plain pricing object
const toPricingPayload = (doc) => ({
  metalRates: doc.metalRates,
  fabricationRates: doc.fabricationRates,
  finishingRates: doc.finishingRates,
  installationRates: doc.installationRates,
  grillComplexity: doc.grillComplexity,
  wastagePercent: doc.wastagePercent,
  minimumCharge: doc.minimumCharge,
  updatedAt: doc.updatedAt || null,
  updatedBy: doc.updatedBy || ''
});

// GET /api/pricing - Public. Used by the website calculator on page load.
router.get('/', async (req, res) => {
  try {
    if (!dbConnected()) {
      return res.json({ success: true, data: DEFAULT_PRICING, source: 'defaults' });
    }
    let settings = await PricingSettings.findOne({ key: 'default' });
    if (!settings) {
      settings = await PricingSettings.create({ key: 'default' });
    }
    res.json({ success: true, data: toPricingPayload(settings), source: 'database' });
  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    // Never block the calculator — fall back to defaults
    res.json({ success: true, data: DEFAULT_PRICING, source: 'defaults' });
  }
});

// Accept only known numeric fields; ignore everything else
const NUMERIC_GROUPS = {
  metalRates: ['steel', 'stainless'],
  fabricationRates: ['steel', 'stainless'],
  finishingRates: ['steel', 'stainless'],
  installationRates: ['window', 'security', 'decorative', 'balcony', 'gate', 'staircase'],
  grillComplexity: ['window', 'security', 'decorative', 'balcony', 'gate', 'staircase']
};

// PUT /api/pricing - Admin only. Updates the rates the public calculator uses.
router.put('/', authenticateAdmin, async (req, res) => {
  try {
    if (!dbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected. Pricing cannot be saved right now.'
      });
    }

    const update = { updatedBy: req.admin?.username || 'admin' };
    const invalid = [];

    for (const [group, keys] of Object.entries(NUMERIC_GROUPS)) {
      if (!req.body[group] || typeof req.body[group] !== 'object') continue;
      for (const key of keys) {
        const raw = req.body[group][key];
        if (raw === undefined || raw === null || raw === '') continue;
        const value = Number(raw);
        if (!isFinite(value) || value < 0) {
          invalid.push(`${group}.${key}`);
        } else {
          update[`${group}.${key}`] = value;
        }
      }
    }

    for (const key of ['wastagePercent', 'minimumCharge']) {
      const raw = req.body[key];
      if (raw === undefined || raw === null || raw === '') continue;
      const value = Number(raw);
      if (!isFinite(value) || value < 0) {
        invalid.push(key);
      } else {
        update[key] = value;
      }
    }

    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid values for: ${invalid.join(', ')}. All rates must be non-negative numbers.`
      });
    }

    const settings = await PricingSettings.findOneAndUpdate(
      { key: 'default' },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Pricing updated. The website calculator now uses these rates.',
      data: toPricingPayload(settings)
    });
  } catch (error) {
    console.error('Error updating pricing settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing',
      error: error.message
    });
  }
});

module.exports = router;
