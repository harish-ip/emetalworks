const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const CalculatorSettings = require('../models/CalculatorSettings');

// Admin authentication middleware
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

// GET /api/calculator-settings - Get current calculator settings (public)
router.get('/', async (req, res) => {
  try {
    console.log('📊 Fetching calculator settings...');
    const settings = await CalculatorSettings.getCurrentSettings();
    
    res.json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    console.error('Error fetching calculator settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calculator settings',
      error: error.message
    });
  }
});

// PUT /api/calculator-settings - Update calculator settings (admin only)
router.put('/', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔧 Updating calculator settings...');
    console.log('Update data:', req.body);
    
    const { materialRates, weightFactors, rodThicknessMultipliers, spacingMultipliers, designMultipliers } = req.body;
    
    // Validate that at least one field is being updated
    if (!materialRates && !weightFactors && !rodThicknessMultipliers && !spacingMultipliers && !designMultipliers) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }
    
    // Build updates object
    const updates = {};
    if (materialRates) updates.materialRates = materialRates;
    if (weightFactors) updates.weightFactors = weightFactors;
    if (rodThicknessMultipliers) updates.rodThicknessMultipliers = rodThicknessMultipliers;
    if (spacingMultipliers) updates.spacingMultipliers = spacingMultipliers;
    if (designMultipliers) updates.designMultipliers = designMultipliers;
    
    const updatedSettings = await CalculatorSettings.updateSettings(updates, req.admin.username);
    
    console.log('✅ Calculator settings updated successfully');
    
    res.json({
      success: true,
      message: 'Calculator settings updated successfully',
      data: updatedSettings
    });
    
  } catch (error) {
    console.error('Error updating calculator settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update calculator settings',
      error: error.message
    });
  }
});

// PUT /api/calculator-settings/material-rates - Update only material rates (admin only)
router.put('/material-rates', authenticateAdmin, async (req, res) => {
  try {
    console.log('💰 Updating material rates...');
    console.log('Material rates data:', req.body);
    
    const { mildSteel, stainlessSteel, aluminum, castIron } = req.body;
    
    // Validate that at least one rate is being updated
    if (mildSteel === undefined && stainlessSteel === undefined && aluminum === undefined && castIron === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No material rates provided'
      });
    }
    
    // Validate rates are positive numbers
    const rates = { mildSteel, stainlessSteel, aluminum, castIron };
    for (const [material, rate] of Object.entries(rates)) {
      if (rate !== undefined && (typeof rate !== 'number' || rate < 0)) {
        return res.status(400).json({
          success: false,
          message: `Invalid rate for ${material}. Must be a positive number.`
        });
      }
    }
    
    // Get current settings
    const currentSettings = await CalculatorSettings.getCurrentSettings();
    
    // Update only the provided rates
    const materialRates = { ...currentSettings.materialRates };
    if (mildSteel !== undefined) materialRates.mildSteel = mildSteel;
    if (stainlessSteel !== undefined) materialRates.stainlessSteel = stainlessSteel;
    if (aluminum !== undefined) materialRates.aluminum = aluminum;
    if (castIron !== undefined) materialRates.castIron = castIron;
    
    const updatedSettings = await CalculatorSettings.updateSettings({ materialRates }, req.admin.username);
    
    console.log('✅ Material rates updated successfully');
    
    res.json({
      success: true,
      message: 'Material rates updated successfully',
      data: updatedSettings
    });
    
  } catch (error) {
    console.error('Error updating material rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material rates',
      error: error.message
    });
  }
});

// GET /api/calculator-settings/history - Get settings update history (admin only)
router.get('/history', authenticateAdmin, async (req, res) => {
  try {
    console.log('📜 Fetching calculator settings history...');
    
    const history = await CalculatorSettings.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('materialRates weightFactors lastUpdatedBy lastUpdatedAt version createdAt');
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error('Error fetching settings history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings history',
      error: error.message
    });
  }
});

module.exports = router;

