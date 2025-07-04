const mongoose = require('mongoose');

const contactSubmissionSchema = new mongoose.Schema({
  // Contact information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  
  // Message details
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  // Project details (if provided)
  projectType: {
    type: String,
    enum: ['window_grill', 'security_grill', 'decorative_grill', 'balcony_grill', 'gate', 'staircase', 'custom', 'other'],
    default: 'other'
  },
  projectBudget: {
    type: String,
    enum: ['under_10k', '10k_25k', '25k_50k', '50k_100k', 'above_100k', 'not_specified'],
    default: 'not_specified'
  },
  urgency: {
    type: String,
    enum: ['immediate', 'within_week', 'within_month', 'flexible'],
    default: 'flexible'
  },
  
  // Calculator data (if submitted from calculator)
  calculatorData: {
    dimensions: {
      width: Number,
      height: Number,
      widthUnit: String,
      heightUnit: String
    },
    grillType: String,
    metalType: String,
    profileType: String,
    estimatedWeight: Number,
    estimatedCost: Number,
    calculatorType: {
      type: String,
      enum: ['standard', 'advanced']
    }
  },
  
  // Tracking information
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
  
  // Submission metadata
  submissionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  referrer: String,
  
  // Admin management
  status: {
    type: String,
    enum: ['new', 'contacted', 'quoted', 'converted', 'closed', 'spam'],
    default: 'new',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: String,
    default: 'unassigned'
  },
  
  // Admin notes and follow-up
  adminNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Follow-up tracking
  followUpDate: Date,
  lastContactDate: Date,
  contactAttempts: {
    type: Number,
    default: 0
  },
  
  // Quote information
  quoteProvided: {
    type: Boolean,
    default: false
  },
  quoteAmount: Number,
  quoteDate: Date,
  
  // Conversion tracking
  converted: {
    type: Boolean,
    default: false
  },
  conversionDate: Date,
  conversionValue: Number,
  
  // Source tracking
  source: {
    type: String,
    enum: ['website_contact', 'calculator_quote', 'service_inquiry', 'direct'],
    default: 'website_contact'
  }
}, {
  timestamps: true,
  collection: 'contactsubmissions'
});

// Indexes for better query performance
contactSubmissionSchema.index({ submissionDate: -1 });
contactSubmissionSchema.index({ status: 1, submissionDate: -1 });
contactSubmissionSchema.index({ email: 1 });
contactSubmissionSchema.index({ phone: 1 });
contactSubmissionSchema.index({ priority: 1, status: 1 });

// Virtual for days since submission
contactSubmissionSchema.virtual('daysSinceSubmission').get(function() {
  return Math.floor((Date.now() - this.submissionDate) / (1000 * 60 * 60 * 24));
});

// Method to add admin note
contactSubmissionSchema.methods.addAdminNote = function(note, addedBy) {
  this.adminNotes.push({
    note,
    addedBy,
    addedAt: new Date()
  });
  return this.save();
};

// Method to update status
contactSubmissionSchema.methods.updateStatus = function(newStatus, updatedBy) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add automatic note for status change
  this.adminNotes.push({
    note: `Status changed from ${oldStatus} to ${newStatus}`,
    addedBy: updatedBy,
    addedAt: new Date()
  });
  
  // Update conversion tracking
  if (newStatus === 'converted') {
    this.converted = true;
    this.conversionDate = new Date();
  }
  
  return this.save();
};

// Static method to get contact analytics
contactSubmissionSchema.statics.getContactAnalytics = function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.submissionDate = {};
    if (startDate) matchStage.submissionDate.$gte = new Date(startDate);
    if (endDate) matchStage.submissionDate.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        newContacts: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        contactedLeads: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
        quotedLeads: { $sum: { $cond: [{ $eq: ['$status', 'quoted'] }, 1, 0] } },
        convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
        totalConversionValue: { $sum: '$conversionValue' },
        avgConversionValue: { $avg: '$conversionValue' },
        calculatorSubmissions: { $sum: { $cond: [{ $eq: ['$source', 'calculator_quote'] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        totalSubmissions: 1,
        newContacts: 1,
        contactedLeads: 1,
        quotedLeads: 1,
        convertedLeads: 1,
        conversionRate: { 
          $multiply: [
            { $divide: ['$convertedLeads', '$totalSubmissions'] }, 
            100
          ] 
        },
        totalConversionValue: { $round: ['$totalConversionValue', 2] },
        avgConversionValue: { $round: ['$avgConversionValue', 2] },
        calculatorSubmissions: 1,
        calculatorConversionRate: {
          $multiply: [
            { $divide: ['$calculatorSubmissions', '$totalSubmissions'] },
            100
          ]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema);
