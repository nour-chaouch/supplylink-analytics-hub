const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/signin', loginUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;
