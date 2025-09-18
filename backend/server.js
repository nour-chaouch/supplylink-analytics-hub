const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { initializeElasticsearch } = require('./config/elasticsearch');
const faostatRoutes = require('./routes/faostatRoutes');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '20gb' })); // Increased limit for large file uploads
app.use(express.urlencoded({ limit: '20gb', extended: true })); // Increased limit for large file uploads
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Development logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SupplyLink Backend is running' });
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/faostat', faostatRoutes);
app.use('/api/agricultural', require('./routes/agriculturalDataRoutes'));

// Debug middleware for admin routes
app.use('/api/admin', (req, res, next) => {
  console.log(`Admin route accessed: ${req.method} ${req.path}`);
  next();
});

app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/elasticsearch', require('./routes/elasticsearchAdminRoutes'));

// Catch-all route for debugging
app.use('*', (req, res) => {
  console.log(`Unmatched route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.method} ${req.originalUrl}` 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5001;

// Start server without requiring database connection for development
const startServer = async () => {
  try {
    // Try to connect to MongoDB but don't fail if it's not available
    if (process.env.MONGO_URI) {
      await connectDB();
    } else {
      console.log('⚠️  No MONGO_URI provided, running without MongoDB connection');
    }
    
    // Initialize Elasticsearch
    await initializeElasticsearch();
    
    app.listen(PORT, () => {
      console.log(`🚀 SupplyLink Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📊 Health check available at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
