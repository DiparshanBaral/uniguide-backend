require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// CORS Configuration
const allowedOrigins = ['http://localhost:5173']; // Add your frontend origin here
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('Not allowed by CORS')); // Block the request
    }
  },
  credentials: true, // Allow credentials (e.g., cookies, authorization headers)
};
app.use(cors(corsOptions));

// Preflight Request Handling (Optional)
app.options('*', cors(corsOptions)); // Automatically handle preflight requests for all routes

// Import routes
const studentRoutes = require('./routes/studentRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const universityRoutes = require('./routes/universityRoutes');
const affiliationRoutes = require('./routes/affiliationRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const portalRoutes = require('./routes/portalRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Use routes
app.use('/student', studentRoutes);
app.use('/mentor', mentorRoutes);
app.use('/admin', adminRoutes);
app.use('/universities', universityRoutes);
app.use('/affiliations', affiliationRoutes);
app.use('/connections', connectionRoutes);
app.use('/portal', portalRoutes);
app.use('/tasks', taskRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('UNIGUIDE API is running....');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));