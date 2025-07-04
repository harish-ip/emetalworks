const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserVisit = require('../models/UserVisit');
const ContactSubmission = require('../models/ContactSubmission');

// Simple admin authentication middleware
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

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Simple admin credentials check (in production, use proper user management)
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        username,
        role: 'admin'
      }
    });
    
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// GET /api/admin/dashboard - Get dashboard data
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    // Get visit analytics
    const visitAnalytics = await UserVisit.getAnalytics(startDate.toISOString());
    
    // Get contact analytics
    const contactAnalytics = await ContactSubmission.getContactAnalytics(startDate.toISOString());
    
    // Get recent activities
    const recentVisits = await UserVisit.find({ visitDate: { $gte: startDate } })
      .sort({ visitDate: -1 })
      .limit(10)
      .select('visitDate currentPage device browser.name calculatorUsed contactFormViewed timeOnSite');
    
    const recentContacts = await ContactSubmission.find({ submissionDate: { $gte: startDate } })
      .sort({ submissionDate: -1 })
      .limit(10)
      .select('name email subject status submissionDate source priority');
    
    // Get top pages
    const topPages = await UserVisit.aggregate([
      { $match: { visitDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$currentPage',
          visits: { $sum: 1 },
          avgTimeOnSite: { $avg: '$timeOnSite' },
          uniqueVisitors: { $addToSet: '$visitorId' }
        }
      },
      {
        $project: {
          page: '$_id',
          visits: 1,
          avgTimeOnSite: { $round: ['$avgTimeOnSite', 2] },
          uniqueVisitors: { $size: '$uniqueVisitors' },
          _id: 0
        }
      },
      { $sort: { visits: -1 } },
      { $limit: 5 }
    ]);
    
    // Get conversion funnel
    const totalVisits = await UserVisit.countDocuments({ visitDate: { $gte: startDate } });
    const calculatorUsers = await UserVisit.countDocuments({ 
      visitDate: { $gte: startDate },
      calculatorUsed: true 
    });
    const contactFormViews = await UserVisit.countDocuments({ 
      visitDate: { $gte: startDate },
      contactFormViewed: true 
    });
    const contactSubmissions = await ContactSubmission.countDocuments({ 
      submissionDate: { $gte: startDate } 
    });
    
    const conversionFunnel = {
      visits: totalVisits,
      calculatorUsers,
      contactFormViews,
      contactSubmissions,
      calculatorConversionRate: totalVisits > 0 ? ((calculatorUsers / totalVisits) * 100).toFixed(2) : 0,
      contactViewRate: totalVisits > 0 ? ((contactFormViews / totalVisits) * 100).toFixed(2) : 0,
      submissionRate: contactFormViews > 0 ? ((contactSubmissions / contactFormViews) * 100).toFixed(2) : 0
    };
    
    // Get device and browser stats
    const deviceStats = await UserVisit.aggregate([
      { $match: { visitDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 },
          avgTimeOnSite: { $avg: '$timeOnSite' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const browserStats = await UserVisit.aggregate([
      { $match: { visitDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$browser.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get daily trends
    const dailyTrends = await UserVisit.aggregate([
      { $match: { visitDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$visitDate'
            }
          },
          visits: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' },
          calculatorUsers: { $sum: { $cond: ['$calculatorUsed', 1, 0] } },
          avgTimeOnSite: { $avg: '$timeOnSite' }
        }
      },
      {
        $project: {
          date: '$_id',
          visits: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          calculatorUsers: 1,
          avgTimeOnSite: { $round: ['$avgTimeOnSite', 2] },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        period,
        visitAnalytics: visitAnalytics[0] || {},
        contactAnalytics: contactAnalytics[0] || {},
        recentVisits,
        recentContacts,
        topPages,
        conversionFunnel,
        deviceStats,
        browserStats,
        dailyTrends
      }
    });
    
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

// GET /api/admin/export/contacts - Export contact data
router.get('/export/contacts', authenticateAdmin, async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, status } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.submissionDate = {};
      if (startDate) query.submissionDate.$gte = new Date(startDate);
      if (endDate) query.submissionDate.$lte = new Date(endDate);
    }
    if (status) query.status = status;
    
    const contacts = await ContactSubmission.find(query)
      .sort({ submissionDate: -1 })
      .select('-adminNotes -userAgent -ipAddress'); // Exclude sensitive data
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'Name,Email,Phone,Subject,Status,Submission Date,Source,Priority\n';
      const csvData = contacts.map(contact => 
        `"${contact.name}","${contact.email}","${contact.phone}","${contact.subject}","${contact.status}","${contact.submissionDate}","${contact.source}","${contact.priority}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
      res.send(csvHeader + csvData);
    } else {
      res.json({
        success: true,
        data: contacts,
        count: contacts.length
      });
    }
    
  } catch (error) {
    console.error('Error exporting contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export contacts',
      error: error.message
    });
  }
});

// GET /api/admin/stats - Get quick stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const stats = {
      today: {
        visits: await UserVisit.countDocuments({ visitDate: { $gte: today } }),
        contacts: await ContactSubmission.countDocuments({ submissionDate: { $gte: today } })
      },
      yesterday: {
        visits: await UserVisit.countDocuments({ 
          visitDate: { $gte: yesterday, $lt: today } 
        }),
        contacts: await ContactSubmission.countDocuments({ 
          submissionDate: { $gte: yesterday, $lt: today } 
        })
      },
      thisWeek: {
        visits: await UserVisit.countDocuments({ visitDate: { $gte: thisWeek } }),
        contacts: await ContactSubmission.countDocuments({ submissionDate: { $gte: thisWeek } })
      },
      total: {
        visits: await UserVisit.countDocuments(),
        contacts: await ContactSubmission.countDocuments(),
        newContacts: await ContactSubmission.countDocuments({ status: 'new' }),
        convertedContacts: await ContactSubmission.countDocuments({ status: 'converted' })
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message
    });
  }
});

module.exports = router;
