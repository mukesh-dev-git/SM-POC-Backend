require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Reading = require('./models/reading');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON bodies in requests

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Successfully connected to MongoDB Atlas!');
}).catch((error) => {
  console.error('Error connecting to MongoDB Atlas:', error);
  process.exit(1);
});

// --- API Endpoints ---

// POST /lora: Endpoint for ESP32 to send data
// This matches the SERVER_URL in your ESP32 code.
app.post('/lora', async (req, res) => {
  try {
    console.log('Received data from ESP32:', req.body);

    // Create a new reading document using the Mongoose model
    const newReading = new Reading({
      deviceId: req.body.deviceId,
      timestamp: req.body.timestamp,
      voltage: req.body.voltage,
      current: req.body.current,
      power: req.body.power,
      energy: req.body.energy,
      rssi: req.body.rssi,
    });

    // Save the document to the database
    await newReading.save();

    res.status(201).json({ message: 'Data received and stored successfully!' });
  } catch (error) {
    console.error('Failed to store data:', error);
    res.status(500).json({ message: 'Error storing data', error: error.message });
  }
});

// GET /data: Endpoint for the frontend to fetch recent data
app.get('/data', async (req, res) => {
    try {
        // Fetch the 50 most recent readings, sorted by the time they were received
        const readings = await Reading.find()
                                      .sort({ receivedAt: -1 }) // -1 for descending order
                                      .limit(50);
        res.status(200).json(readings);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        res.status(500).json({ message: 'Error fetching data' });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});