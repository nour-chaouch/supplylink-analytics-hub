const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      next();
    } catch (error) {
      console.error('JWT Error:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Token expired' 
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token' 
        });
      } else {
        return res.status(401).json({ 
          success: false,
          message: 'Not authorized' 
        });
      }
    }
  } else {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token' 
    });
  }
};

// Admin only middleware
const adminOnly = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized' 
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Silently fail for optional auth
      req.user = null;
    }
  }

  next();
};

// Role-based access control
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Not authorized' 
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Server error' 
      });
    }
  };
};

module.exports = { 
  protect, 
  adminOnly, 
  optionalAuth, 
  requireRole 
};
