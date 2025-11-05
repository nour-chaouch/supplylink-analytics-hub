// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Titre obligatoire']
  },
  description: {
    type: String,
    trim: true
  },
  start: {
    type: Date,
    required: [true, 'Date de début obligatoire']
  },
  end: {
    type: Date,
    required: [true, 'Date de fin obligatoire']
  },
  type: {
    type: String,
    enum: ['meeting', 'workshop', 'deadline', 'social'], // Exemples
    required: [true, 'Type obligatoire']
  },
  color: {
    type: String, // Peut être personnalisée ou auto-assignée par type
    default: '#3788d8'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  inviteKey: {
    type: String, // Pour privé, généré si !isPublic
    sparse: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hook corrigé : Priorise couleur user, fallback sur type
eventSchema.pre('save', function(next) {
  const colors = {
    meeting: '#3788d8',      // Bleu
    workshop: '#56cc9d',      // Vert
    deadline: '#ff9f40',      // Orange
    social: '#9333ea'         // Purple (changé de rouge #eb5a46)
  };
  
  // Fix : Seulement si pas déjà définie (respecte input user)
  if (!this.color) {
    this.color = colors[this.type] || '#3788d8';
  }
  
  // Générer clé si privé
  if (!this.isPublic && !this.inviteKey) {
    this.inviteKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);