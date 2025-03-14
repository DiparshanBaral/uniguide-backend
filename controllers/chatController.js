// controllers/chatController.js
const { Chat } = require('../models/chatModel');

// Get chat history between two users
const getChatHistory = async (req, res) => {
  try {
    const { userId, userRole, otherUserId, otherUserRole } = req.query;

    if (!userId || !userRole || !otherUserId || !otherUserRole) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const messages = await Chat.find({
      $or: [
        { senderId: userId, senderRole: userRole, receiverId: otherUserId, receiverRole: otherUserRole },
        { senderId: otherUserId, senderRole: otherUserRole, receiverId: userId, receiverRole: userRole },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  try {
    const { senderId, senderRole, receiverId, receiverRole, content } = req.body;

    if (!senderId || !senderRole || !receiverId || !receiverRole || !content) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newMessage = new Chat({
      senderId,
      senderRole,
      receiverId,
      receiverRole,
      message: content,
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully', newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { userId, userRole, otherUserId, otherUserRole } = req.body;

    if (!userId || !userRole || !otherUserId || !otherUserRole) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await Chat.updateMany(
      {
        senderId: otherUserId,
        senderRole: otherUserRole,
        receiverId: userId,
        receiverRole: userRole,
        read: false,
      },
      { read: true }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    const deletedMessage = await Chat.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getChatHistory,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
};