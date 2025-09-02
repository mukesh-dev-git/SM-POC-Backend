const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  createdAt: { type: Date, required: true },
  startTime: { type: Date, required: true },
  forecast: {
    timestamps: [Date],
    power_watts: [Number]
  }
});

forecastSchema.index({ createdAt: -1 });
module.exports = mongoose.model('Forecast', forecastSchema);