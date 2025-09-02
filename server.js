require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Reading = require('./models/reading');
const Anomaly = require('./models/anomaly');
const Forecast = require('./models/forecast');
const { generateAnalyticsSummary } = require('./services/geminiService');


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

app.get('/api/anomalies', async (req, res) => {
    try {
        const anomalies = await Anomaly.find().sort({ timestamp: -1 }).limit(50);
        const readings = await Reading.find({
            // Find regular readings around the time of the latest anomaly for context
            receivedAt: { 
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24 hours
            }
        }).sort({ receivedAt: 1 });
        
        res.status(200).json({ anomalies, contextReadings: readings });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching anomalies' });
    }
});

app.get('/api/forecast', async (req, res) => {
    try {
        const forecast = await Forecast.findOne().sort({ createdAt: -1 });
        const recentReadings = await Reading.find({
            receivedAt: {
                $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) // last 6 hours
            }
        }).sort({ receivedAt: 1 });

        res.status(200).json({ forecast, recentReadings });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching forecast' });
    }
});

app.get('/api/summary', async (req, res) => {
    try {
        // Fetch the same data our other endpoints use
        const anomalies = await Anomaly.find().sort({ timestamp: -1 }).limit(10);
        const forecast = await Forecast.findOne().sort({ createdAt: -1 });

        // Call our Gemini service
        const summary = await generateAnalyticsSummary(anomalies, forecast);
        
        res.status(200).json({ summary });
    } catch (error) {
        res.status(500).json({ message: 'Error creating summary' });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});