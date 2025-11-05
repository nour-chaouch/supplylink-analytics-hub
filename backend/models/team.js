// models/Team.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nom de la team obligatoire']
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['temp', 'permanent'],
    default: 'temp' // Temp pour liée à event
  },
  linkedEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  invites: [{ // Invites en attente
    email: String,
    token: String,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hook : Générer token invite si nouveau membre ajouté
teamSchema.pre('save', function(next) {
  if (this.invites && this.invites.length > 0) {
    for (let invite of this.invites) {
      if (!invite.token) {
        invite.token = crypto.randomBytes(32).toString('hex');
      }
    }
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);