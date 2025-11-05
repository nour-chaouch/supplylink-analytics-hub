// controllers/eventController.js
const Event = require('../models/Event');
const Team = require('../models/team');
const User = require('../models/User'); // Import User model pour vérif
const mongoose = require('mongoose');

// @desc Créer un event
// @route POST /api/events
const createEvent = async (req, res) => {
  try {
    const { title, description, start, end, type, isPublic, creatorId } = req.body;

    // Vérif existence d'un ID valide au niveau controller
    if (!creatorId || !mongoose.Types.ObjectId.isValid(creatorId)) {
      return res.status(400).json({ success: false, error: 'ID créateur invalide' });
    }

    const user = await User.findById(creatorId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    const eventData = {
      title,
      description,
      start,
      end,
      type,
      isPublic,
      creator: creatorId
    };

    const event = await Event.create(eventData);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc Récup tous les events (pour user, filtre par creator ou public)
const getEvents = async (req, res) => {
  try {
    const { userId } = req.query; // Optionnel : filtre par userId pour ses events

    let filter = { isPublic: true };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Utilisateur non trouvé' });
      }
      filter.$or = [{ creator: userId }, { isPublic: true }];
    }

    const events = await Event.find(filter).populate('creator', 'name email');
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc Récup un event par ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('creator', 'name email');
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event non trouvé' });
    }
    
    // Récupérer les équipes liées à cet événement avec invites
    const teams = await Team.find({ linkedEventId: req.params.id })
      .populate('creator', 'name email')
      .populate('members', 'name email');
    
    // Convertir l'événement en objet et ajouter les équipes avec invites
    const eventObj = event.toObject();
    eventObj.teams = teams.map(team => {
      const teamObj = team.toObject();
      // S'assurer que les invites sont incluses
      return teamObj;
    });
    
    res.json({ success: true, data: eventObj });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc Update un event
const updateEvent = async (req, res) => {
  try {
    const { creatorId } = req.body; // Vérif si update, check creator

    if (creatorId && !mongoose.Types.ObjectId.isValid(creatorId)) {
      return res.status(400).json({ success: false, error: 'ID créateur invalide' });
    }

    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event non trouvé' });
    }

    // Vérif si user est creator (si creatorId fourni)
    if (creatorId && event.creator.toString() !== creatorId) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('creator', 'name email');

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc Supprimer un event
const deleteEvent = async (req, res) => {
  try {
    const { creatorId } = req.body;

    if (creatorId && !mongoose.Types.ObjectId.isValid(creatorId)) {
      return res.status(400).json({ success: false, error: 'ID créateur invalide' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event non trouvé' });
    }

    // Vérif creator
    if (creatorId && event.creator.toString() !== creatorId) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};