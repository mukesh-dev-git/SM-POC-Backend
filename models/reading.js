const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  timestamp: { type: Number, required: true }, // From STM32 HAL_GetTick()
  voltage: { type: Number, required: true },
  current: { type: Number, required: true },
  power: { type: Number, required: true },
  energy: { type: Number, required: true },
  rssi: { type: Number, required: true },
  receivedAt: { type: Date, default: Date.now } // Timestamp from the server
});

// Create an index on receivedAt for faster queries
readingSchema.index({ receivedAt: -1 });

module.exports = mongoose.model('Reading', readingSchema);