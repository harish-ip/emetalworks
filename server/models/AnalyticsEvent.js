const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['visit', 'calculator_page'],
    required: true,
    index: true
  },
  visitorId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  path: {
    type: String,
    default: '/'
  },
  referrer: String,
  ipAddress: String,
  userAgent: String,
  firstSeenAt: {
    type: Date,
    default: Date.now
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'analyticsevents'
});

analyticsEventSchema.index({ eventType: 1, sessionId: 1 }, { unique: true });
analyticsEventSchema.index({ eventType: 1, firstSeenAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
