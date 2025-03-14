// websocketServer.js
const WebSocket = require('ws');
const { Chat } = require('./models/chatModel');
const { Student } = require('./models/studentModel'); // Fix import for Student
const { Mentor } = require('./models/mentorModel'); // Fix import for Mentor
const { Portal } = require('./models/portalModel'); // Fix import for Portal

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log('WebSocket server is running on port 8080');
});

// Store active connections
const clients = new Map();

wss.on('connection', async (ws, req) => {
  try {
    // Extract userId and userRole from query parameters
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const userId = urlParams.get('userId');
    const userRole = urlParams.get('userRole');

    // Validate connection parameters
    if (!userId || !userRole) {
      ws.close(4001, 'Invalid connection parameters');
      return;
    }

    let userModel;

    // Determine the appropriate model based on userRole
    if (userRole === 'Student') {
      userModel = Student;
    } else if (userRole === 'Mentor') {
      userModel = Mentor;
    } else {
      ws.close(4002, 'Invalid user role');
      return;
    }

    // Validate user existence in the database
    const user = await userModel.findById(userId);
    if (!user) {
      ws.close(4003, 'User not found');
      return;
    }

    // Store the WebSocket connection with user details
    clients.set(userId, { ws, role: userRole });

    console.log(`User connected: ${userId} (${userRole})`);

    // Handle incoming messages
    ws.on('message', async (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
        return;
      }

      const { receiverId, receiverRole, content } = data;

      // Validate message format
      if (!receiverId || !receiverRole || !content) {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
        return;
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
        ws.send(JSON.stringify({ error: 'Failed to save message' }));
        return;
      }

      // Send the message to the receiver if they are online
      const receiver = clients.get(receiverId);
      if (receiver) {
        receiver.ws.send(
          JSON.stringify({
            senderId: userId,
            senderRole: userRole,
            content,
          })
        );
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log(`User disconnected: ${userId} (${userRole})`);
      clients.delete(userId);
    });

  } catch (error) {
    console.error('Error validating WebSocket connection:', error);
    ws.close(5000, 'Internal server error');
  }
});