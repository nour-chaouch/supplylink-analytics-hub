// routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const { createTeam, acceptInvite, getUserTeams } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/teams (créer team + invites)
router.post('/', protect, createTeam);

// POST /api/teams/accept (accepter invite)
router.post('/accept', protect, acceptInvite);

// GET /api/teams/my (teams de l'user)
router.get('/my', protect, getUserTeams);

module.exports = router;