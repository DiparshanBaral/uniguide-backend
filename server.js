require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // Required for integrating Socket.IO
const mongoose = require('mongoose');
const { Server } = require('socket.io'); // Use Socket.IO
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// CORS Configuration
const allowedOrigins = ['http://localhost:5173'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
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
const chatRoutes = require('./routes/chatRoutes');

// Use routes
app.use('/student', studentRoutes);
app.use('/mentor', mentorRoutes);
app.use('/admin', adminRoutes);
app.use('/universities', universityRoutes);
app.use('/affiliations', affiliationRoutes);
app.use('/connections', connectionRoutes);
app.use('/portal', portalRoutes);
app.use('/tasks', taskRoutes);
app.use('/chat', chatRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('UNIGUIDE API is running....');
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store active connections
const clients = new Map();

// Handle Socket.IO connections
io.on('connection', async (socket) => {
  try {
    // Extract userId and userRole from query parameters
    const { userId, userRole } = socket.handshake.query;

    // Validate connection parameters
    if (!userId || !userRole) {
      console.error(`Invalid connection parameters: userId=${userId}, userRole=${userRole}`);
      socket.disconnect(true);
      return;
    }

    let userModel;
    // Determine the appropriate model based on userRole
    if (userRole === 'Student') {
      userModel = require('./models/studentModel').Student;
    } else if (userRole === 'Mentor') {
      userModel = require('./models/mentorModel').Mentor;
    } else {
      console.error(`Invalid user role: ${userRole}`);
      socket.disconnect(true);
      return;
    }

    // Validate user existence in the database
    const user = await userModel.findById(userId);
    if (!user) {
      console.error(`User not found: userId=${userId}`);
      socket.disconnect(true);
      return;
    }

    // Store the Socket.IO connection with user details
    clients.set(userId, { socket, role: userRole });
    console.log(`User connected: ${userId} (${userRole})`);

    // Handle incoming messages
    // Handle incoming messages via Socket.IO
    socket.on('sendMessage', async (data) => {
      const { receiverId, receiverRole, content } = data;

      // Validate message format
      if (!receiverId || !receiverRole || !content) {
        console.error('Invalid message format:', data);
        socket.emit('error', { error: 'Invalid message format' });
        return;
      }

      // Check if the message already exists in the database
      const Chat = require('./models/chatModel').Chat;
      const existingMessage = await Chat.findOne({
        senderId: userId,
        senderRole: userRole,
        receiverId,
        receiverRole,
        message: content,
      });

      if (existingMessage) {
        console.warn('Duplicate message detected:', content);
        return; // Avoid saving duplicates
      }

      // Save the message to the database
      const newMessage = new Chat({
        senderId: userId,
        senderRole: userRole,
        receiverId,
        receiverRole,
        message: content,
      });

      try {
        await newMessage.save();
      } catch (error) {
        console.error('Error saving message to database:', error);
        socket.emit('error', { error: 'Failed to save message' });
        return;
      }

      // Send the message to the receiver if they are online
      const receiver = clients.get(receiverId);
      if (receiver) {
        receiver.socket.emit('receiveMessage', {
          _id: newMessage._id, // Include the unique ID of the message
          senderId: userId,
          senderRole: userRole,
          content,
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (${userRole})`);
      clients.delete(userId);
    });
  } catch (error) {
    console.error('Error validating Socket.IO connection:', error);
    socket.disconnect(true);
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
