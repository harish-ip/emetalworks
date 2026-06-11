const express = require('express');
const jwt = require('jsonwebtoken');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const DailyHit = require('../models/DailyHit');

const router = express.Router();

// Current calendar day in IST (Asia/Kolkata) as 'YYYY-MM-DD'.
// en-CA locale formats dates in ISO-like YYYY-MM-DD order.
const istDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

const recordEvent = async (eventType, req, res) => {
  try {
    const { visitorId, sessionId, path = '/', referrer = '' } = req.body;

    if (!visitorId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'visitorId and sessionId are required'
      });
    }

    await Promise.all([
      // Raw daily hit counter — incremented on every page load.
      DailyHit.updateOne(
        { date: istDay(), eventType },
        { $inc: { count: 1 } },
        { upsert: true }
      ),
      // Session-unique record — idempotent, drives unique-visitor counts.
      AnalyticsEvent.updateOne(
        { eventType, sessionId },
        {
          $setOnInsert: {
            eventType,
            visitorId,
            sessionId,
            path,
            referrer,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || '',
            firstSeenAt: new Date()
          },
          $set: {
            lastSeenAt: new Date()
          }
        },
        { upsert: true }
      )
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error(`Error recording ${eventType}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to record analytics event',
      error: error.message
    });
  }
};

router.post('/visit', (req, res) => recordEvent('visit', req, res));
router.post('/calculator', (req, res) => recordEvent('calculator_page', req, res));

router.get('/summary', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalVisits,
      calculatorPageVisits,
      uniqueVisitorIds,
      calculatorVisitorIds,
      recentCalculatorUsers,
      dailyVisitHits,
      dailyCalculatorHits
    ] = await Promise.all([
      AnalyticsEvent.countDocuments({ eventType: 'visit' }),
      AnalyticsEvent.countDocuments({ eventType: 'calculator_page' }),
      AnalyticsEvent.distinct('visitorId', { eventType: 'visit' }),
      AnalyticsEvent.distinct('visitorId', { eventType: 'calculator_page' }),
      AnalyticsEvent.find({ eventType: 'calculator_page' })
        .sort({ firstSeenAt: -1 })
        .limit(20)
        .select('visitorId ipAddress userAgent referrer firstSeenAt lastSeenAt -_id')
        .lean(),
      DailyHit.find({ eventType: 'visit' })
        .sort({ date: -1 })
        .limit(14)
        .select('date count -_id')
        .lean(),
      DailyHit.find({ eventType: 'calculator_page' })
        .sort({ date: -1 })
        .limit(14)
        .select('date count -_id')
        .lean()
    ]);

    const today = istDay();
    const todayHits = dailyVisitHits.find((d) => d.date === today);
    const todayCalcHits = dailyCalculatorHits.find((d) => d.date === today);

    res.json({
      success: true,
      data: {
        totalVisits,
        calculatorPageVisits,
        uniqueVisitors: uniqueVisitorIds.length,
        calculatorUniqueVisitors: calculatorVisitorIds.length,
        recentCalculatorUsers,
        hitsToday: todayHits ? todayHits.count : 0,
        calculatorHitsToday: todayCalcHits ? todayCalcHits.count : 0,
        // Oldest -> newest, convenient for a left-to-right chart/table.
        dailyHits: dailyVisitHits.slice().reverse(),
        dailyCalculatorHits: dailyCalculatorHits.slice().reverse()
      }
    });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics summary',
      error: error.message
    });
  }
});

module.exports = router;
