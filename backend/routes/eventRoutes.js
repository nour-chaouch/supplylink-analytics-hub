// routes/events.js
const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

// @desc Créer un event
// @route POST /api/events
router.post('/', createEvent);

// @desc Récup events
// @route GET /api/events
router.get('/', getEvents);

// @desc Récup event par ID
// @route GET /api/events/:id
router.get('/:id', getEventById);

// @desc Update event
// @route PUT /api/events/:id
router.put('/:id', updateEvent);

// @desc Delete event
// @route DELETE /api/events/:id
router.delete('/:id', deleteEvent);

module.exports = router;