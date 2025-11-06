// controllers/teamController.js
const Team = require('../models/team');
const User = require('../models/User');
const Event = require('../models/Event');
const { sendTeamInvite } = require('../utils/sendEmail');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Créer team + Invites
exports.createTeam = async (req, res) => {
  try {
    // Accept both eventId and linkedEventId for compatibility
    const { name, description, eventId, linkedEventId, memberEmails = [], creatorId } = req.body;
    
    // Use req.user.id if available (from middleware), otherwise use creatorId from body
    const creator = req.user?.id || creatorId;
    if (!creator) {
      return res.status(401).json({ success: false, error: 'Authentification requise' });
    }

    // Use linkedEventId if provided, otherwise use eventId
    const finalLinkedEventId = linkedEventId || eventId;

    // Créer team
    const team = await Team.create({
      name,
      description,
      linkedEventId: finalLinkedEventId,
      creator: creator
    });

    // Ajouter invites si emails fournis
    if (memberEmails.length > 0) {
      const creatorUser = req.user || await User.findById(creator);
      const creatorName = creatorUser?.name || 'Un utilisateur';
      
      for (const email of memberEmails) {
        const token = crypto.randomBytes(32).toString('hex');
        team.invites.push({
          email,
          token,
          status: 'pending'
        });
        // Envoi email (si la fonction existe)
        try {
          await sendTeamInvite(email, name, finalLinkedEventId ? 'Event lié' : 'Team globale', token, creatorName);
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError);
          // Continue même si l'email échoue
        }
      }
      await team.save();
    }

    // Populate pour frontend
    const populatedTeam = await Team.findById(team._id)
      .populate('creator', 'name email')
      .populate('members', 'name email')
      .populate('linkedEventId', 'title start end');
    
    // Si l'équipe est liée à un événement, retourner l'événement mis à jour avec les équipes
    if (finalLinkedEventId) {
      const event = await Event.findById(finalLinkedEventId)
        .populate('creator', 'name email');
      
      if (event) {
        // Récupérer toutes les équipes liées à cet événement (avec invites)
        const teams = await Team.find({ linkedEventId: finalLinkedEventId })
          .populate('creator', 'name email')
          .populate('members', 'name email');
        
        // Convertir l'événement en objet et ajouter les équipes avec invites
        const eventObj = event.toObject();
        eventObj.teams = teams.map(team => {
          const teamObj = team.toObject();
          // Les invites sont automatiquement incluses dans toObject()
          return teamObj;
        });
        
        return res.status(201).json({ success: true, data: eventObj });
      }
    }
      
    res.status(201).json({ success: true, data: populatedTeam });
  } catch (error) {
    console.error('Erreur création team:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};


// Récupérer teams de l'user + events liés
exports.getUserTeamsAndEvents = async (req, res) => {
  try {
    // Utiliser req.user.id depuis le middleware protect
    const userId = req.user?.id || req.params.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentification requise' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'ID user invalide' });
    }

    // Fetch teams où user est membre
    const teams = await Team.find({ members: userId, status: 'active' })
      .populate('creator', 'name email') // Populate creator
      .populate('members', 'name email') // Populate members
      .populate('linkedEventId', 'title description start end type isPublic creator') // Populate event lié
      .sort({ createdAt: -1 }); // Plus récent en premier

    // Récupérer les événements liés aux équipes
    const eventIds = teams
      .map(team => team.linkedEventId)
      .filter(id => id != null)
      .map(id => id._id || id);

    // Fetch events créés par l'user
    const userCreatedEvents = await Event.find({ creator: userId })
      .populate('creator', 'name email')
      .sort({ start: -1 });

    // Fetch events liés aux équipes où l'user est membre
    const linkedEvents = eventIds.length > 0 
      ? await Event.find({ _id: { $in: eventIds } })
          .populate('creator', 'name email')
          .sort({ start: -1 })
      : [];

    // Récupérer les équipes pour chaque événement lié
    const eventsWithTeams = await Promise.all(
      linkedEvents.map(async (event) => {
        const eventTeams = await Team.find({ linkedEventId: event._id })
          .populate('creator', 'name email')
          .populate('members', 'name email');
        const eventObj = event.toObject();
        eventObj.teams = eventTeams;
        return eventObj;
      })
    );

    res.json({ 
      success: true, 
      data: {
        teams: teams.map(team => team.toObject()),
        userCreatedEvents: userCreatedEvents.map(event => event.toObject()),
        linkedEvents: eventsWithTeams
      } 
    });
  } catch (error) {
    console.error('Erreur getUserTeamsAndEvents:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
// Accepter invite
exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;
    if (!req.user.id) return res.status(401).json({ error: 'Authentification requise' });

    const team = await Team.findOne({ 'invites.token': token, 'invites.status': 'pending' });
    if (!team) return res.status(400).json({ error: 'Token invalide ou expiré' });

    // Update invite et ajouter membre
    const inviteIndex = team.invites.findIndex(i => i.token === token);
    team.invites[inviteIndex].status = 'accepted';
    team.members.push(req.user.id);
    await team.save();

    res.json({ success: true, data: { team } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user teams
exports.getUserTeams = async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user.id }).populate('creator').populate('linkedEventId');
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};