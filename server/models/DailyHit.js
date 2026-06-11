const mongoose = require('mongoose');

// One document per day per event type, holding a raw hit counter.
// Unlike AnalyticsEvent (deduped per session), this counts every page load.
const dailyHitSchema = new mongoose.Schema({
  date: {
    type: String, // 'YYYY-MM-DD' in IST (Asia/Kolkata)
    required: true
  },
  eventType: {
    type: String,
    enum: ['visit', 'calculator_page'],
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'dailyhits'
});

dailyHitSchema.index({ date: 1, eventType: 1 }, { unique: true });

module.exports = mongoose.model('DailyHit', dailyHitSchema);
