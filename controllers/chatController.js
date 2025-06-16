const { Chat } = require('../models/chatModel');
const mongoose = require('mongoose');

// Send a new message
const sendMessage = async (req, res) => {
  try {
    const { senderId, senderRole, receiverId, receiverRole, content } = req.body;

    // Validate required fields
    if (!senderId || !senderRole || !receiverId || !receiverRole || !content) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create a new message yoooo
    const newMessage = new Chat({
      senderId,
      senderRole,
      receiverId,
      receiverRole,
      message: content,
      isRead: false, // Default to unread
    });

    // Save the message to the database
    await newMessage.save();

    res.status(201).json({ message: 'Message sent successfully', newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message || 'An error occurred while sending the message' });
  }
};

// Fetch chat history between two users
const getChatHistory = async (req, res) => {
  try {
    const { userId, userRole, otherUserId, otherUserRole } = req.query;

    // Validate required fields
    if (!userId || !userRole || !otherUserId || !otherUserRole) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Fetch chat history where the current user is either the sender or receiver
    const chatHistory = await Chat.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 }) // Sort messages by timestamp (ascending order)
      .lean();

    res.status(200).json({ messages: chatHistory });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: error.message || 'An error occurred while fetching chat history' });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;

    // Validate required fields
    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'User ID and Other User ID are required' });
    }

    // Update all unread messages where the current user is the receiver
    const updatedMessages = await Chat.updateMany(
      {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      { isRead: true },
      { new: true }
    );

    res.status(200).json({ message: 'Messages marked as read', updatedMessages });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message || 'An error occurred while marking messages as read' });
  }
};

// Delete a specific message
const deleteMessage = async (req, res) => {
  try {
    const { messageId, userId } = req.body;

    // Validate required fields
    if (!messageId || !userId) {
      return res.status(400).json({ error: 'Message ID and User ID are required' });
    }

    // Find the message by ID
    const message = await Chat.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Ensure only the sender or receiver can delete the message
    if (message.senderId.toString() !== userId && message.receiverId.toString() !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this message' });
    }

    // Delete the message
    await Chat.findByIdAndDelete(messageId);

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: error.message || 'An error occurred while deleting the message' });
  }
};

// Export all controller methods
module.exports = {
  sendMessage,
  getChatHistory,
  markMessagesAsRead,
  deleteMessage,
};