const express = require('express');
const {
  getChatHistory,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
} = require('../controllers/chatController');

const router = express.Router();

// Get chat history between two users
router.get('/history', getChatHistory);

// Send a new message
router.post('/send', sendMessage);

// Mark messages as read
router.post('/mark-as-read', markMessagesAsRead);

// Delete a message
router.delete('/:messageId', deleteMessage);

module.exports = router;