const express = require('express');
const cors = require('cors');

console.log('🚀 Starting Test Server...');
console.log('📅 Server started at:', new Date().toLocaleString());

const app = express();
const PORT = process.env.PORT || 5007;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Test routes
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/admin/login', (req, res) => {
  console.log('Admin login attempt:', req.body);
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      token: 'test-token-123',
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.get('/api/admin/dashboard', (req, res) => {
  console.log('Dashboard data requested');
  res.json({
    success: true,
    data: {
      totalVisits: 150,
      totalContacts: 25,
      conversionRate: 16.7,
      recentContacts: []
    }
  });
});

// Store contact submissions in memory (for testing)
let contactSubmissions = [];

// Store interaction tracking data in memory (for testing)
let interactionData = [];

// Tracking interaction endpoint
app.post('/tracking/interaction', (req, res) => {
  console.log('📊 Interaction tracked:', JSON.stringify(req.body, null, 2));

  try {
    const interaction = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...req.body
    };

    interactionData.push(interaction);

    res.json({
      success: true,
      message: 'Interaction tracked successfully',
      interactionId: interaction.id
    });
  } catch (error) {
    console.error('❌ Error tracking interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction'
    });
  }
});

app.post('/api/contact/submit', (req, res) => {
  console.log('📧 Contact form submission received:', JSON.stringify(req.body, null, 2));

  try {
    const submissionData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(), // For admin dashboard compatibility
      status: 'new', // Default status for new submissions
      adminNote: '', // Empty admin note initially
      ...req.body
    };

    // Store the submission
    contactSubmissions.push(submissionData);

    console.log('✅ Contact submission stored:', submissionData.id);

    res.json({
      success: true,
      message: 'Contact form submitted successfully!',
      submissionId: submissionData.id
    });
  } catch (error) {
    console.error('❌ Error processing contact submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process contact submission'
    });
  }
});

app.get('/api/contact/submissions', (req, res) => {
  console.log('📋 Admin requesting contact submissions, count:', contactSubmissions.length);
  console.log('📋 Submissions data:', JSON.stringify(contactSubmissions, null, 2));
  res.json({
    success: true,
    data: {
      submissions: contactSubmissions
    }
  });
});

// Admin dashboard stats endpoint
app.get('/api/admin/dashboard', (req, res) => {
  console.log('📊 Admin requesting dashboard stats');

  const totalContacts = contactSubmissions.length;
  const totalVisits = Math.floor(totalContacts * 3.5) || 150; // Simulate visits (roughly 3.5x contacts)
  const conversionRate = totalContacts > 0 ? ((totalContacts / totalVisits) * 100).toFixed(1) : 0;

  const dashboardStats = {
    totalVisits,
    totalContacts,
    conversionRate: parseFloat(conversionRate),
    recentContacts: contactSubmissions.slice(-5).reverse(), // 5 most recent
    monthlyStats: {
      contacts: totalContacts,
      quotes: Math.floor(totalContacts * 0.8), // 80% of contacts request quotes
      conversions: Math.floor(totalContacts * 0.3) // 30% conversion rate
    }
  };

  console.log('📊 Dashboard stats:', dashboardStats);

  res.json({
    success: true,
    data: dashboardStats
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Admin login: http://localhost:${PORT}/api/admin/login`);
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/api/admin/dashboard`);
  console.log(`📋 Contact submissions: http://localhost:${PORT}/api/contact/submissions`);
  console.log('✅ Server is ready to accept requests');
});
