require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));

// Middleware to set headers for CORS and Content-Type for API key
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

// API Key (Loaded from .env)
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

// Route to serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoint to serve the Google Maps API key
app.get('/api/key', (req, res) => {
    res.json({ apiKey: googleMapsApiKey });
});

// Port setting
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Google Maps API Key: ${googleMapsApiKey}`);  // For debugging purposes, to verify API key is loaded correctly
});
