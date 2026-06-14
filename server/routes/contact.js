const express = require('express');
const router = express.Router();
const ContactSubmission = require('../models/ContactSubmission');
const Joi = require('joi');

// Validation schema for contact form
const contactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\+]?[0-9][0-9\s-]{7,20}$/).required(),
  subject: Joi.string().trim().min(5).max(200).required(),
  message: Joi.string().trim().min(10).max(2000).required(),
  projectType: Joi.string().valid('window_grill', 'security_grill', 'decorative_grill', 'balcony_grill', 'railing', 'gate', 'grill', 'shed', 'staircase', 'custom', 'other').optional(),
  projectBudget: Joi.string().valid('under_10k', '10k_25k', '25k_50k', '50k_100k', 'above_100k', 'not_specified').optional(),
  urgency: Joi.string().valid('immediate', 'within_week', 'within_month', 'flexible').optional(),
  calculatorData: Joi.object({
    dimensions: Joi.object({
      width: Joi.number().positive().optional(),
      height: Joi.number().positive().optional(),
      widthUnit: Joi.string().valid('cm', 'mm', 'inch', 'inches', 'ft', 'feet', 'm').optional(),
      heightUnit: Joi.string().valid('cm', 'mm', 'inch', 'inches', 'ft', 'feet', 'm').optional()
    }).unknown(true).optional(),
    grillType: Joi.string().optional(),
    metalType: Joi.string().optional(),
    profileType: Joi.string().optional(),
	    quantity: Joi.number().integer().min(1).optional(),
    estimatedWeight: Joi.number().min(0).optional(),
    estimatedCost: Joi.number().min(0).optional(),
    calculatorType: Joi.string().valid('standard', 'advanced', 'rod_based').optional()
  }).unknown(true).allow(null).optional(),
  sessionId: Joi.string().required(),
  visitorId: Joi.string().required(),
  source: Joi.string().valid('website_contact', 'calculator_quote', 'service_inquiry', 'direct', 'whatsapp_quote').optional()
});

// Minimal schema for WhatsApp quote leads (name + phone only)
const whatsappLeadSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  phone: Joi.string().trim().min(6).max(30).required(),
  calculatorData: Joi.object().unknown(true).allow(null).optional(),
  sessionId: Joi.string().optional().allow(''),
  visitorId: Joi.string().optional().allow('')
});

// POST /api/contact/whatsapp-lead - Capture name+phone before opening WhatsApp
router.post('/whatsapp-lead', async (req, res) => {
  try {
    const { error, value } = whatsappLeadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers.referer || 'direct';

    const submission = new ContactSubmission({
      name: value.name,
      phone: value.phone,
      subject: 'WhatsApp Quote Request',
      message: 'Customer requested quote via WhatsApp button.',
      calculatorData: value.calculatorData || undefined,
      sessionId: value.sessionId,
      visitorId: value.visitorId,
      source: 'whatsapp_quote',
      ipAddress,
      userAgent,
      referrer
    });

    await submission.save();
    console.log(`📱 WhatsApp lead captured: ${submission.name} (${submission.phone})`);

    res.json({ success: true, submissionId: submission._id });
  } catch (err) {
    console.error('Error saving WhatsApp lead:', err);
    res.status(500).json({ success: false, message: 'Failed to save lead' });
  }
});

// POST /api/contact/submit - Submit contact form
router.post('/submit', async (req, res) => {
  try {
    // Validate request data
    const { error, value } = contactSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    // Get client information
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const referrer = req.headers.referer || 'direct';
    
    // Create new contact submission
    const contactSubmission = new ContactSubmission({
      ...value,
      ipAddress,
      userAgent,
      referrer,
      source: value.source || (value.calculatorData ? 'calculator_quote' : 'website_contact')
    });
    
    await contactSubmission.save();
    
    // Send success response
    res.json({
      success: true,
      message: 'Contact form submitted successfully',
      submissionId: contactSubmission._id,
      data: {
        name: contactSubmission.name,
        email: contactSubmission.email,
        subject: contactSubmission.subject,
        submissionDate: contactSubmission.submissionDate
      }
    });
    
    // Log for admin notification (you could integrate email service here)
    console.log(`📧 New contact submission from ${contactSubmission.name} (${contactSubmission.email})`);
    
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: error.message
    });
  }
});

// GET /api/contact/submissions - Get all contact submissions (admin only)
router.get('/submissions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      source,
      startDate,
      endDate,
      search
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;
    
    if (startDate || endDate) {
      query.submissionDate = {};
      if (startDate) query.submissionDate.$gte = new Date(startDate);
      if (endDate) query.submissionDate.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const submissions = await ContactSubmission.find(query)
      .sort({ submissionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-adminNotes -userAgent'); // Exclude sensitive data
    
    const total = await ContactSubmission.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting contact submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact submissions',
      error: error.message
    });
  }
});

// GET /api/contact/submission/:id - Get specific contact submission
router.get('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await ContactSubmission.findById(id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }
    
    res.json({
      success: true,
      data: submission
    });
    
  } catch (error) {
    console.error('Error getting contact submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact submission',
      error: error.message
    });
  }
});

// PUT /api/contact/submission/:id/status - Update submission status
router.put('/submission/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updatedBy = 'admin' } = req.body;
    
    const validStatuses = ['new', 'contacted', 'quoted', 'converted', 'closed', 'spam'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const submission = await ContactSubmission.findById(id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }
    
    await submission.updateStatus(status, updatedBy);
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        id: submission._id,
        status: submission.status,
        updatedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update submission status',
      error: error.message
    });
  }
});

// POST /api/contact/submission/:id/note - Add admin note
router.post('/submission/:id/note', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, addedBy = 'admin' } = req.body;
    
    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }
    
    const submission = await ContactSubmission.findById(id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }
    
    await submission.addAdminNote(note.trim(), addedBy);
    
    res.json({
      success: true,
      message: 'Note added successfully',
      data: {
        id: submission._id,
        noteCount: submission.adminNotes.length
      }
    });
    
  } catch (error) {
    console.error('Error adding admin note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add admin note',
      error: error.message
    });
  }
});

// PUT /api/contact/submission/:id/followup - Set or clear a follow-up reminder
router.put('/submission/:id/followup', async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpDate } = req.body; // ISO date string, or null/'' to clear

    const submission = await ContactSubmission.findById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    if (followUpDate) {
      const date = new Date(followUpDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid followUpDate value'
        });
      }
      submission.followUpDate = date;
    } else {
      submission.followUpDate = undefined;
    }

    await submission.save();

    res.json({
      success: true,
      message: 'Follow-up updated successfully',
      data: {
        id: submission._id,
        followUpDate: submission.followUpDate || null
      }
    });

  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update follow-up',
      error: error.message
    });
  }
});

// GET /api/contact/analytics - Get contact analytics
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const analytics = await ContactSubmission.getContactAnalytics(startDate, endDate);
    
    // Get status breakdown
    const statusBreakdown = await ContactSubmission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get source breakdown
    const sourceBreakdown = await ContactSubmission.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent submissions
    const recentSubmissions = await ContactSubmission.find()
      .sort({ submissionDate: -1 })
      .limit(5)
      .select('name email subject status submissionDate source');
    
    res.json({
      success: true,
      data: {
        summary: analytics[0] || {},
        statusBreakdown,
        sourceBreakdown,
        recentSubmissions
      }
    });
    
  } catch (error) {
    console.error('Error getting contact analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact analytics',
      error: error.message
    });
  }
});

module.exports = router;
