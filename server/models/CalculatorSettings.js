const mongoose = require('mongoose');

const calculatorSettingsSchema = new mongoose.Schema({
  // Material rates (per kg)
  materialRates: {
    mildSteel: {
      type: Number,
      default: 102,
      required: true,
      min: 0
    },
    stainlessSteel: {
      type: Number,
      default: 450,
      required: true,
      min: 0
    },
    aluminum: {
      type: Number,
      default: 280,
      required: true,
      min: 0
    },
    castIron: {
      type: Number,
      default: 85,
      required: true,
      min: 0
    }
  },
  
  // Weight factors for different grill types (kg/sq.ft)
  weightFactors: {
    window: {
      type: Number,
      default: 1.3,
      required: true,
      min: 0
    },
    security: {
      type: Number,
      default: 2.0,
      required: true,
      min: 0
    },
    decorative: {
      type: Number,
      default: 1.2,
      required: true,
      min: 0
    },
    balcony: {
      type: Number,
      default: 2.8,
      required: true,
      min: 0
    }
  },
  
  // Rod thickness multipliers
  rodThicknessMultipliers: {
    '8mm': {
      type: Number,
      default: 1.0,
      required: true,
      min: 0
    },
    '10mm': {
      type: Number,
      default: 1.4,
      required: true,
      min: 0
    },
    '12mm': {
      type: Number,
      default: 1.8,
      required: true,
      min: 0
    }
  },
  
  // Spacing type multipliers
  spacingMultipliers: {
    standard: {
      type: Number,
      default: 1.0,
      required: true,
      min: 0
    },
    close: {
      type: Number,
      default: 1.3,
      required: true,
      min: 0
    },
    wide: {
      type: Number,
      default: 0.8,
      required: true,
      min: 0
    }
  },
  
  // Design complexity multipliers
  designMultipliers: {
    simple: {
      type: Number,
      default: 1.0,
      required: true,
      min: 0
    },
    cross: {
      type: Number,
      default: 1.2,
      required: true,
      min: 0
    },
    decorative: {
      type: Number,
      default: 1.4,
      required: true,
      min: 0
    }
  },
  
  // Metadata
  lastUpdatedBy: {
    type: String,
    default: 'system'
  },
  
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },
  
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Static method to get current settings (or create default if none exist)
calculatorSettingsSchema.statics.getCurrentSettings = async function() {
  let settings = await this.findOne().sort({ createdAt: -1 });
  
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({
      materialRates: {
        mildSteel: 102,
        stainlessSteel: 450,
        aluminum: 280,
        castIron: 85
      },
      weightFactors: {
        window: 1.3,
        security: 2.0,
        decorative: 1.2,
        balcony: 2.8
      },
      rodThicknessMultipliers: {
        '8mm': 1.0,
        '10mm': 1.4,
        '12mm': 1.8
      },
      spacingMultipliers: {
        standard: 1.0,
        close: 1.3,
        wide: 0.8
      },
      designMultipliers: {
        simple: 1.0,
        cross: 1.2,
        decorative: 1.4
      },
      lastUpdatedBy: 'system',
      version: 1
    });
  }
  
  return settings;
};

// Static method to update settings
calculatorSettingsSchema.statics.updateSettings = async function(updates, updatedBy = 'admin') {
  const currentSettings = await this.getCurrentSettings();
  
  // Merge updates with current settings
  Object.assign(currentSettings, updates);
  currentSettings.lastUpdatedBy = updatedBy;
  currentSettings.lastUpdatedAt = new Date();
  currentSettings.version += 1;
  
  await currentSettings.save();
  return currentSettings;
};

const CalculatorSettings = mongoose.model('CalculatorSettings', calculatorSettingsSchema);

module.exports = CalculatorSettings;

