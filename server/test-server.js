const express = require('express');
const cors = require('cors');

console.log('🚀 Starting Test Server...');

const app = express();
const PORT = process.env.PORT || 5005;

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

app.post('/api/contact/submit', (req, res) => {
  console.log('📧 Contact form submission received:', req.body);

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
  console.log('Contact submissions requested');
  res.json({
    success: true,
    data: {
      submissions: contactSubmissions
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Admin login: http://localhost:${PORT}/api/admin/login`);
});
