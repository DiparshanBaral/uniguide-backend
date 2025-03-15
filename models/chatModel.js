const mongoose = require('mongoose');

// Chat Schema Definition
const chatSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderRole', // Dynamic reference based on senderRole
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['Student', 'Mentor'], // Role of the sender (either Student or Mentor)
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'receiverRole', // Dynamic reference based on receiverRole
      required: true,
    },
    receiverRole: {
      type: String,
      enum: ['Student', 'Mentor'], // Role of the receiver (either Student or Mentor)
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt` fields
);

// Use the 'Users' database for chats
const usersDb = mongoose.connection.useDb('Users');

// Create the Chat model
const Chat = usersDb.model('Chat', chatSchema, 'Chats');

module.exports = { Chat };