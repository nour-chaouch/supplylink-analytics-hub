const mongoose = require('mongoose');

const FilterValuesSchema = new mongoose.Schema({
  indexName: {
    type: String,
    required: true,
    index: true
  },
  fieldName: {
    type: String,
    required: true,
    index: true
  },
  fieldType: {
    type: String,
    required: true,
    enum: ['keyword', 'text', 'boolean']
  },
  values: [{
    value: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 1
    }
  }],
  totalDocuments: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
FilterValuesSchema.index({ indexName: 1, fieldName: 1 }, { unique: true });

// Method to add or update values
FilterValuesSchema.methods.addValues = function(newValues) {
  const valueMap = new Map();
  
  // Convert existing values to map
  this.values.forEach(item => {
    valueMap.set(item.value, item.count);
  });
  
  // Add new values
  newValues.forEach(value => {
    if (value && typeof value === 'string' && value.trim()) {
      const trimmedValue = value.trim();
      valueMap.set(trimmedValue, (valueMap.get(trimmedValue) || 0) + 1);
    }
  });
  
  // Convert back to array and sort by count (descending)
  this.values = Array.from(valueMap.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
  
  this.lastUpdated = new Date();
};

// Static method to get filter values for an index
FilterValuesSchema.statics.getFilterValues = function(indexName) {
  return this.find({ indexName }).sort({ fieldName: 1 });
};

// Static method to get values for a specific field
FilterValuesSchema.statics.getFieldValues = function(indexName, fieldName) {
  return this.findOne({ indexName, fieldName });
};

// Static method to update field values
FilterValuesSchema.statics.updateFieldValues = async function(indexName, fieldName, fieldType, values) {
  const filterDoc = await this.findOne({ indexName, fieldName });
  
  if (filterDoc) {
    filterDoc.addValues(values);
    filterDoc.totalDocuments += values.length;
    return await filterDoc.save();
  } else {
    const newFilterDoc = new this({
      indexName,
      fieldName,
      fieldType,
      values: [],
      totalDocuments: values.length
    });
    newFilterDoc.addValues(values);
    return await newFilterDoc.save();
  }
};

module.exports = mongoose.model('FilterValues', FilterValuesSchema);



