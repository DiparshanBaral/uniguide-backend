const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Route to send a new message.
router.post('/send', chatController.sendMessage);

// Route to fetch chat history between two users
router.get('/history', chatController.getChatHistory);

// Route to mark messages as read
router.post('/mark-as-read', chatController.markMessagesAsRead);

// Route to delete a specific message
router.post('/delete', chatController.deleteMessage);

module.exports = router;