# eMetalWorks Backend Server

MongoDB backend system for user tracking, contact management, and analytics for the eMetalWorks website.

## Features

- **User Visit Tracking**: Track page visits, user interactions, device information, and session data
- **Contact Form Management**: Handle contact form submissions with calculator data integration
- **Admin Dashboard**: Authentication and analytics dashboard for business insights
- **Analytics & Reporting**: Comprehensive analytics with conversion tracking and user behavior insights
- **Security**: Rate limiting, CORS protection, input validation, and JWT authentication

## Tech Stack

- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for admin authentication
- **Helmet.js** for security headers
- **Rate limiting** for API protection
- **CORS** for cross-origin requests
- **Input validation** with Joi

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/emetalworks
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Security
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=24h
   
   # Admin Credentials
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password
   
   # CORS
   FRONTEND_URL=http://localhost:3002
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Start MongoDB:**
   - **Local MongoDB:** `mongod`
   - **MongoDB Atlas:** Use your connection string in `MONGODB_URI`

4. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify installation:**
   Visit `http://localhost:5000/api/health` - you should see:
   ```json
   {
     "status": "OK",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "uptime": "0:00:01",
     "environment": "development"
   }
   ```

## API Endpoints

### User Tracking
- `POST /api/tracking/visit` - Track page visits
- `POST /api/tracking/interaction` - Track user interactions
- `PUT /api/tracking/visit/:sessionId/duration` - Update visit duration
- `GET /api/tracking/analytics` - Get visit analytics

### Contact Management
- `POST /api/contact/submit` - Submit contact form
- `GET /api/contact/submissions` - Get all submissions (admin)
- `GET /api/contact/submission/:id` - Get specific submission
- `PUT /api/contact/submission/:id/status` - Update submission status
- `POST /api/contact/submission/:id/note` - Add admin note
- `GET /api/contact/analytics` - Get contact analytics

### Admin
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/stats` - Quick statistics
- `GET /api/admin/export/contacts` - Export contact data

## Database Schema

### UserVisit Collection
```javascript
{
  sessionId: String,        // Unique session identifier
  visitorId: String,        // Unique visitor identifier
  visitDate: Date,          // Visit timestamp
  currentPage: String,      // Page visited
  referrer: String,         // Referrer URL
  userAgent: String,        // Browser user agent
  ipAddress: String,        // Visitor IP address
  device: String,           // Device type (mobile/tablet/desktop)
  browser: Object,          // Browser information
  location: Object,         // Geographic location
  timeOnSite: Number,       // Time spent on site (seconds)
  interactions: Array,      // User interactions
  calculatorUsed: Boolean,  // Whether calculator was used
  contactFormViewed: Boolean // Whether contact form was viewed
}
```

### ContactSubmission Collection
```javascript
{
  name: String,             // Contact name
  email: String,            // Contact email
  phone: String,            // Contact phone
  subject: String,          // Message subject
  message: String,          // Message content
  projectType: String,      // Type of project
  projectBudget: String,    // Budget range
  urgency: String,          // Project urgency
  calculatorData: Object,   // Calculator data if available
  status: String,           // Submission status
  priority: String,         // Priority level
  source: String,           // Submission source
  sessionId: String,        // Associated session
  visitorId: String,        // Associated visitor
  submissionDate: Date,     // Submission timestamp
  adminNotes: Array,        // Admin notes
  statusHistory: Array      // Status change history
}
```

## Development

### Scripts
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests (when implemented)
```

### Environment Variables
All environment variables are documented in `.env.example`. Key variables:

- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret key for JWT tokens
- `ADMIN_USERNAME/ADMIN_PASSWORD`: Admin login credentials
- `FRONTEND_URL`: Frontend URL for CORS

### Security Features
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for specific frontend origin
- **Input Validation**: Joi validation for all inputs
- **Security Headers**: Helmet.js for security headers
- **JWT Authentication**: Secure admin authentication

## Production Deployment

1. **Set environment variables:**
   ```bash
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   ADMIN_PASSWORD=your-secure-admin-password
   ```

2. **Use process manager:**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start server.js --name "emetalworks-api"
   
   # Using systemd (Linux)
   # Create service file and enable
   ```

3. **Set up reverse proxy (nginx example):**
   ```nginx
   server {
       listen 80;
       server_name api.emetalworks.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Monitoring & Logs

- Server logs are output to console
- MongoDB connection status is logged
- Error handling with detailed error messages
- Health check endpoint for monitoring

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify MongoDB connection
3. Ensure all environment variables are set
4. Check network connectivity and CORS settings
