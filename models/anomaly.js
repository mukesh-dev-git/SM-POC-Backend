const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  power: { type: Number },
  voltage: { type: Number },
  type: { type: String },
  detectedAt: { type: Date, default: Date.now }
});

anomalySchema.index({ timestamp: -1 });
module.exports = mongoose.model('Anomaly', anomalySchema);