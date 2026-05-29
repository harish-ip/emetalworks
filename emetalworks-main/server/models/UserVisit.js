const mongoose = require('mongoose');

const userVisitSchema = new mongoose.Schema({
  // Visitor identification
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  visitorId: {
    type: String,
    required: true,
    index: true
  },
  
  // Visit information
  visitDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Browser and device information
  userAgent: {
    type: String,
    required: true
  },
  browser: {
    name: String,
    version: String
  },
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  os: {
    name: String,
    version: String
  },
  
  // Location information (if available)
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String
  },
  
  // Page information
  currentPage: {
    type: String,
    required: true,
    default: 'home'
  },
  referrer: {
    type: String,
    default: 'direct'
  },
  
  // Screen information
  screenResolution: {
    width: Number,
    height: Number
  },
  
  // Visit duration and engagement
  timeOnSite: {
    type: Number, // in seconds
    default: 0
  },
  pageViews: {
    type: Number,
    default: 1
  },
  
  // Interaction tracking
  interactions: [{
    type: {
      type: String,
      enum: ['click', 'scroll', 'form_focus', 'calculator_use', 'tab_switch', 'contact_form'],
      required: true
    },
    element: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed // Additional data for the interaction
  }],
  
  // Calculator usage
  calculatorUsed: {
    type: Boolean,
    default: false
  },
  calculatorInteractions: {
    type: Number,
    default: 0
  },
  
  // Contact form interaction
  contactFormViewed: {
    type: Boolean,
    default: false
  },
  contactFormStarted: {
    type: Boolean,
    default: false
  },
  
  // Exit information
  exitPage: String,
  bounceRate: {
    type: Boolean,
    default: true // Will be updated if user views multiple pages
  }
}, {
  timestamps: true,
  collection: 'uservisits'
});

// Indexes for better query performance
userVisitSchema.index({ visitDate: -1 });
userVisitSchema.index({ sessionId: 1, visitDate: -1 });
userVisitSchema.index({ visitorId: 1, visitDate: -1 });
userVisitSchema.index({ 'interactions.type': 1 });

// Virtual for visit duration in minutes
userVisitSchema.virtual('visitDurationMinutes').get(function() {
  return Math.round(this.timeOnSite / 60);
});

// Method to add interaction
userVisitSchema.methods.addInteraction = function(type, element, data = {}) {
  this.interactions.push({
    type,
    element,
    data,
    timestamp: new Date()
  });
  
  // Update specific flags based on interaction type
  if (type === 'calculator_use') {
    this.calculatorUsed = true;
    this.calculatorInteractions += 1;
  }
  
  if (type === 'contact_form') {
    this.contactFormViewed = true;
    if (data.action === 'form_start') {
      this.contactFormStarted = true;
    }
  }
  
  return this.save();
};

// Static method to get analytics data
userVisitSchema.statics.getAnalytics = function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.visitDate = {};
    if (startDate) matchStage.visitDate.$gte = new Date(startDate);
    if (endDate) matchStage.visitDate.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitorId' },
        totalPageViews: { $sum: '$pageViews' },
        avgTimeOnSite: { $avg: '$timeOnSite' },
        calculatorUsers: { $sum: { $cond: ['$calculatorUsed', 1, 0] } },
        contactFormViews: { $sum: { $cond: ['$contactFormViewed', 1, 0] } },
        contactFormStarts: { $sum: { $cond: ['$contactFormStarted', 1, 0] } },
        bounceRate: { $avg: { $cond: ['$bounceRate', 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        totalVisits: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
        totalPageViews: 1,
        avgTimeOnSite: { $round: ['$avgTimeOnSite', 2] },
        calculatorUsers: 1,
        contactFormViews: 1,
        contactFormStarts: 1,
        bounceRate: { $multiply: ['$bounceRate', 100] }
      }
    }
  ]);
};

module.exports = mongoose.model('UserVisit', userVisitSchema);
