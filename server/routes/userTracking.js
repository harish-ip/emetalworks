const express = require('express');
const router = express.Router();
const UserVisit = require('../models/UserVisit');
const { v4: uuidv4 } = require('uuid');

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  const browser = {
    name: 'unknown',
    version: 'unknown'
  };
  
  const os = {
    name: 'unknown',
    version: 'unknown'
  };
  
  let device = 'unknown';
  
  // Simple user agent parsing (you might want to use a library like 'ua-parser-js' for better parsing)
  if (userAgent) {
    // Browser detection
    if (userAgent.includes('Chrome')) {
      browser.name = 'Chrome';
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      if (match) browser.version = match[1];
    } else if (userAgent.includes('Firefox')) {
      browser.name = 'Firefox';
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      if (match) browser.version = match[1];
    } else if (userAgent.includes('Safari')) {
      browser.name = 'Safari';
      const match = userAgent.match(/Version\/([0-9.]+)/);
      if (match) browser.version = match[1];
    } else if (userAgent.includes('Edge')) {
      browser.name = 'Edge';
      const match = userAgent.match(/Edge\/([0-9.]+)/);
      if (match) browser.version = match[1];
    }
    
    // OS detection
    if (userAgent.includes('Windows')) {
      os.name = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      os.name = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os.name = 'Linux';
    } else if (userAgent.includes('Android')) {
      os.name = 'Android';
    } else if (userAgent.includes('iOS')) {
      os.name = 'iOS';
    }
    
    // Device detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      device = 'mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'tablet';
    } else {
      device = 'desktop';
    }
  }
  
  return { browser, os, device };
};

// POST /api/tracking/visit - Track a new visit
router.post('/visit', async (req, res) => {
  try {
    const {
      sessionId,
      visitorId,
      currentPage,
      referrer,
      screenResolution
    } = req.body;
    
    // Get client information
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const { browser, os, device } = parseUserAgent(userAgent);
    
    // Check if this session already exists
    let existingVisit = await UserVisit.findOne({ sessionId });
    
    if (existingVisit) {
      // Update existing visit
      existingVisit.pageViews += 1;
      existingVisit.bounceRate = false; // Multiple page views = not a bounce
      existingVisit.currentPage = currentPage;
      await existingVisit.save();
      
      return res.json({
        success: true,
        message: 'Visit updated',
        visitId: existingVisit._id
      });
    }
    
    // Create new visit record
    const newVisit = new UserVisit({
      sessionId: sessionId || uuidv4(),
      visitorId: visitorId || uuidv4(),
      userAgent,
      browser,
      os,
      device,
      ipAddress,
      currentPage: currentPage || 'home',
      referrer: referrer || 'direct',
      screenResolution
    });
    
    await newVisit.save();
    
    res.json({
      success: true,
      message: 'Visit tracked successfully',
      visitId: newVisit._id,
      sessionId: newVisit.sessionId,
      visitorId: newVisit.visitorId
    });
    
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track visit',
      error: error.message
    });
  }
});

// POST /api/tracking/interaction - Track user interactions
router.post('/interaction', async (req, res) => {
  try {
    const {
      sessionId,
      type,
      element,
      data
    } = req.body;
    
    if (!sessionId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and interaction type are required'
      });
    }
    
    // Find the visit record
    const visit = await UserVisit.findOne({ sessionId });
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit session not found'
      });
    }
    
    // Add the interaction
    await visit.addInteraction(type, element, data);
    
    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });
    
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction',
      error: error.message
    });
  }
});

// PUT /api/tracking/visit/:sessionId/duration - Update visit duration
router.put('/visit/:sessionId/duration', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { timeOnSite, exitPage } = req.body;
    
    const visit = await UserVisit.findOne({ sessionId });
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit session not found'
      });
    }
    
    visit.timeOnSite = timeOnSite;
    if (exitPage) {
      visit.exitPage = exitPage;
    }
    
    await visit.save();
    
    res.json({
      success: true,
      message: 'Visit duration updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating visit duration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update visit duration',
      error: error.message
    });
  }
});

// GET /api/tracking/analytics - Get basic analytics (for admin)
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const analytics = await UserVisit.getAnalytics(startDate, endDate);

    // Get additional metrics
    const totalVisits = await UserVisit.countDocuments();
    const recentVisits = await UserVisit.find()
      .sort({ visitDate: -1 })
      .limit(10)
      .select('visitDate currentPage device browser.name timeOnSite calculatorUsed contactFormViewed');

    // Get popular pages
    const popularPages = await UserVisit.aggregate([
      {
        $group: {
          _id: '$currentPage',
          visits: { $sum: 1 },
          avgTimeOnSite: { $avg: '$timeOnSite' }
        }
      },
      { $sort: { visits: -1 } },
      { $limit: 10 }
    ]);

    // Get device breakdown
    const deviceBreakdown = await UserVisit.aggregate([
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get browser breakdown
    const browserBreakdown = await UserVisit.aggregate([
      {
        $group: {
          _id: '$browser.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get daily visits for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyVisits = await UserVisit.aggregate([
      {
        $match: {
          visitDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$visitDate'
            }
          },
          visits: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' }
        }
      },
      {
        $project: {
          date: '$_id',
          visits: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: analytics[0] || {},
        totalVisits,
        recentVisits,
        popularPages,
        deviceBreakdown,
        browserBreakdown,
        dailyVisits
      }
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

module.exports = router;
