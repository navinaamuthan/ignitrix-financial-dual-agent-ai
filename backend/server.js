require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeFirebase } = require('./config/firebase');

// Initialize Firebase
initializeFirebase();

const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ADK Chat Backend API',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      sessions: '/api/sessions',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 ADK Agents URL: ${process.env.ADK_AGENTS_URL || 'http://localhost:8000'}`);
  console.log(`🤖 ADK App Name: ${process.env.ADK_APP_NAME || 'final_agent'}`);
  console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID || 'Not configured'}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST /api/chat - Send a message to ADK agents`);
  console.log(`   POST /api/sessions - Create a new session`);
  console.log(`   GET /api/sessions/:sessionId - Get session details`);
  console.log(`   GET /api/sessions/user/:userId - Get user sessions`);
  console.log(`   GET /api/sessions/:sessionId/history - Get chat history`);
  console.log(`   PUT /api/sessions/:sessionId/state - Update session state`);
  console.log(`   DELETE /api/sessions/:sessionId - Delete session`);
  console.log(`   GET /api/health - Health check`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 