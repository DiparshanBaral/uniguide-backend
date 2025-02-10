require('dotenv').config();
const cloudinary = require("cloudinary").v2;
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

cloudinary.config({
  cloud_name: "YOUR_CLOUD_NAME",
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET"
});

// Import routes
const studentRoutes = require('./routes/studentRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const universityRoutes = require('./routes/universityRoutes');

// Use routes
app.use('/student', studentRoutes);
app.use('/mentor', mentorRoutes);
app.use('/admin', adminRoutes);
app.use('/universities', universityRoutes);

app.get('/', (req, res) => {
  res.send('UNIGUIDE API is running....');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
