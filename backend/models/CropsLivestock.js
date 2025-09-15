const mongoose = require('mongoose');

const cropsLivestockSchema = new mongoose.Schema({
  domainCode: {
    type: String,
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true
  },
  areaCode: {
    type: Number,
    required: true,
    index: true
  },
  area: {
    type: String,
    required: true,
    index: true
  },
  elementCode: {
    type: Number,
    required: true
  },
  element: {
    type: String,
    required: true
  },
  itemCode: {
    type: mongoose.Schema.Types.Mixed, // Can be number or string
    required: true,
    index: true
  },
  item: {
    type: String,
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  unit: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  flag: {
    type: String,
    required: true
  },
  flagDescription: {
    type: String,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound indexes for better query performance
cropsLivestockSchema.index({ domainCode: 1, area: 1, item: 1, year: 1 });
cropsLivestockSchema.index({ area: 1, year: 1 });
cropsLivestockSchema.index({ item: 1, year: 1 });

module.exports = mongoose.model('CropsLivestock', cropsLivestockSchema);









