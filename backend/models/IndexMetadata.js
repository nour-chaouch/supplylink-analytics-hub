const mongoose = require('mongoose');

const indexMetadataSchema = new mongoose.Schema({
  indexName: {
    type: String,
    required: [true, 'Index name is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Index title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Index description is required'],
    trim: true
  },
  icon: {
    type: String,
    required: [true, 'Index icon is required'],
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
indexMetadataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('IndexMetadata', indexMetadataSchema);
