const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(bodyParser.json()); // ใช้ body-parser สำหรับ parsing JSON
app.use(cors()); // เปิดใช้งาน CORS (ถ้าจำเป็น)

// Import routes
const lineApi = require('./api/line');
const testApi = require('./api/test');

// API Routes
app.use('/line', lineApi);
app.use('/test', testApi);

// Serve static files (optional if you're serving frontend assets)
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to LINE Bot');
});

// Handle undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
