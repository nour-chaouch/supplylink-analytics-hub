// controllers/teamController.js
const Team = require('../models/team');
const User = require('../models/User');
const Event = require('../models/Event');
const { sendTeamInvite } = require('../utils/sendEmail');
const crypto = require('crypto');

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