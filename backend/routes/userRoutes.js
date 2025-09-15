const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  refreshToken,
  verifyToken,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', registerUser);
router.post('/signin', loginUser);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/verify', protect, verifyToken);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
