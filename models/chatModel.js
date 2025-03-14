const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderRole', // Dynamically references either 'Student' or 'Mentor'
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['Student', 'Mentor'],
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'receiverRole', // Dynamically references either 'Student' or 'Mentor'
      required: true,
    },
    receiverRole: {
      type: String,
      enum: ['Student', 'Mentor'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const db = mongoose.connection.useDb('Users');
const Chat = db.model('Chat', chatSchema, 'Chats');

module.exports = { Chat };