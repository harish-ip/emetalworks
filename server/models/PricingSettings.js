const mongoose = require('mongoose');

// Single source of truth for all calculator pricing. One document only —
// the public calculator and the admin quote tool both read from here.
const DEFAULT_PRICING = {
  metalRates: { steel: 68, stainless: 275 },
  fabricationRates: { steel: 105, stainless: 160 },
  finishingRates: { steel: 45, stainless: 20 },
  installationRates: {
    window: 55,
    security: 70,
    decorative: 85,
    balcony: 95,
    gate: 120,
    staircase: 120
  },
  grillComplexity: {
    window: 1.0,
    security: 1.3,
    decorative: 1.5,
    balcony: 1.2,
    gate: 1.4,
    staircase: 1.6
  },
  wastagePercent: 7,
  minimumCharge: 2500
};

const pricingSettingsSchema = new mongoose.Schema({
  // Fixed key so there is exactly one settings document
  key: { type: String, default: 'default', unique: true },
  metalRates: {
    steel: { type: Number, default: DEFAULT_PRICING.metalRates.steel },
    stainless: { type: Number, default: DEFAULT_PRICING.metalRates.stainless }
  },
  fabricationRates: {
    steel: { type: Number, default: DEFAULT_PRICING.fabricationRates.steel },
    stainless: { type: Number, default: DEFAULT_PRICING.fabricationRates.stainless }
  },
  finishingRates: {
    steel: { type: Number, default: DEFAULT_PRICING.finishingRates.steel },
    stainless: { type: Number, default: DEFAULT_PRICING.finishingRates.stainless }
  },
  installationRates: {
    window: { type: Number, default: DEFAULT_PRICING.installationRates.window },
    security: { type: Number, default: DEFAULT_PRICING.installationRates.security },
    decorative: { type: Number, default: DEFAULT_PRICING.installationRates.decorative },
    balcony: { type: Number, default: DEFAULT_PRICING.installationRates.balcony },
    gate: { type: Number, default: DEFAULT_PRICING.installationRates.gate },
    staircase: { type: Number, default: DEFAULT_PRICING.installationRates.staircase }
  },
  grillComplexity: {
    window: { type: Number, default: DEFAULT_PRICING.grillComplexity.window },
    security: { type: Number, default: DEFAULT_PRICING.grillComplexity.security },
    decorative: { type: Number, default: DEFAULT_PRICING.grillComplexity.decorative },
    balcony: { type: Number, default: DEFAULT_PRICING.grillComplexity.balcony },
    gate: { type: Number, default: DEFAULT_PRICING.grillComplexity.gate },
    staircase: { type: Number, default: DEFAULT_PRICING.grillComplexity.staircase }
  },
  wastagePercent: { type: Number, default: DEFAULT_PRICING.wastagePercent },
  minimumCharge: { type: Number, default: DEFAULT_PRICING.minimumCharge },
  updatedBy: { type: String, default: '' }
}, {
  timestamps: true
});

const PricingSettings = mongoose.model('PricingSettings', pricingSettingsSchema);

module.exports = PricingSettings;
module.exports.DEFAULT_PRICING = DEFAULT_PRICING;
