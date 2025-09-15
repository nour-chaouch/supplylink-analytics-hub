const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getSystemStats,
  createUser
} = require('../controllers/adminController');

// Apply protect and adminOnly middleware to all routes
router.use(protect);
router.use(adminOnly);

// User management routes
router.route('/users')
  .get(getAllUsers)           // GET /api/admin/users
  .post(createUser);          // POST /api/admin/users

router.route('/users/:id')
  .get(getUserById)           // GET /api/admin/users/:id
  .delete(deleteUser);        // DELETE /api/admin/users/:id

router.route('/users/:id/role')
  .put(updateUserRole);       // PUT /api/admin/users/:id/role

// System statistics
router.route('/stats')
  .get(getSystemStats);       // GET /api/admin/stats

module.exports = router;
