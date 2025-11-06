// routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const { createTeam, acceptInvite, getUserTeams } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { getUserTeamsAndEvents } = require('../controllers/teamController');

// POST /api/teams (créer team + invites)
router.post('/', protect, createTeam);

// POST /api/teams/accept (accepter invite)
router.post('/accept', protect, acceptInvite);

// GET /api/teams/my (teams de l'user)
router.get('/my', protect, getUserTeams);


// GET /api/teams/my-teams-events (teams + events de l'user authentifié)
router.get('/my-teams-events', protect, getUserTeamsAndEvents);

// GET /api/teams/user/:userId (teams + events de l'user - pour compatibilité)
router.get('/user/:userId', getUserTeamsAndEvents);

module.exports = router;