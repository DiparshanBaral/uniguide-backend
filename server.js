require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const universityRoutes = require('./routes/universityRoutes');

// Use routes
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/universities', universityRoutes);

app.get('/', (req, res) => {
  res.send('UNIGUIDE API is running....');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
