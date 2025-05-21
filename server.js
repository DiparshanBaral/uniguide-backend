require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('./config/googleAuthConfig');

// Connect to MongoDB
connectDB();

// Function to validate server time
function validateServerTime() {
  const serverTime = new Date();
  console.log('Server time:', serverTime.toISOString());
  
  // Check if year is reasonable (2023-2024)
  const year = serverTime.getFullYear();
  if (year < 2023 || year > 2024) {
    console.error(`SERVER CLOCK ERROR: Year is set to ${year} instead of 2023-2024!`);
    console.error('This will cause JWT token validation issues!');
  }
}

// Call this when your server starts
validateServerTime();

const app = express();

// Middleware for parsing JSON
app.use(express.json({ limit: '50mb' }));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  // 'https://uni-guide-frontend.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add additional headers for WebRTC
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Explicitly handle OPTIONS requests
app.options('*', cors(corsOptions));

// Add session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'uniguide_session_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

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
const documentRoutes = require('./routes/documentRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const roomRoutes = require('./routes/roomRoutes');
const visaRoutes = require('./routes/visaRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentNegotiationRoutes = require('./routes/paymentNegotiationRoutes');
const paymentRoutes = require('./payment/payment.route');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const contactRoutes = require('./routes/contactRoutes');

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
app.use('/document', documentRoutes);
app.use('/discussion', discussionRoutes);
app.use('/room', roomRoutes);
app.use('/visa', visaRoutes);
app.use('/notifications', notificationRoutes);
app.use('/review', reviewRoutes);
app.use('/paymentnegotiation', paymentNegotiationRoutes);
app.use('/auth', googleAuthRoutes);
app.use('/payment', paymentRoutes);
app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/contact', contactRoutes);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Default route
app.get('/', (req, res) => {
  res.send('UNIGUIDE API is running....');
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 20000,
  allowEIO3: true,
  maxHttpBufferSize: 5e6, // 5MB - needed for larger signaling data
});

// Store active connections
const clients = new Map();

// Helper function to find a socket by user ID
function getSocketByUserId(userId) {
  const client = clients.get(userId);
  if (!client || !client.socket) {
    console.error(`No active client found for user ID: ${userId}`);
    return null;
  }
  return client.socket;
}

// Socket.IO connection handler
io.on('connection', async (socket) => {
  try {
    const { userId, userRole } = socket.handshake.query;

    // Validate connection parameters
    if (!userId || !userRole) {
      console.error(`Invalid connection parameters: userId=${userId}, userRole=${userRole}`);
      socket.disconnect(true);
      return;
    }

    // Store the Socket.IO connection with user details
    clients.set(userId, {
      socket,
      role: userRole,
      connectedAt: new Date(),
    });
    console.log(`User connected: ${userId} (${userRole}), socket ID: ${socket.id}`);

    // Handle incoming messages
    socket.on('sendMessage', async (data) => {
      try {
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
        
        await newMessage.save();
        
        // Send the message to the receiver if they are online
        const receiver = clients.get(receiverId);
        if (receiver && receiver.socket) {
          receiver.socket.emit('receiveMessage', {
            _id: newMessage._id,
            senderId: userId,
            senderRole: userRole,
            content,
          });
        }
      } catch (error) {
        console.error('Error in sendMessage handler:', error);
        socket.emit('error', { error: 'Server error processing message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (${userRole}), socket ID: ${socket.id}`);
      clients.delete(userId);
    });

    // Send initial connection success confirmation
    socket.emit('connection-success', {
      userId: userId,
      socketId: socket.id,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error in Socket.IO connection handler:', error);
    socket.disconnect(true);
  }
});

// Add a catch-all route to handle undefined routes
app.use((req, res) => {
  console.error(`Route not found: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
