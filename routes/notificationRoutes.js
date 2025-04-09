const express = require('express');
const {
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to create a new notification
router.post('/create', protect, createNotification);

// Route to get all notifications for a user
router.get('/:userId', protect, getNotificationsByUser);

// Route to mark a notification as read
router.put('/:notificationId/read', protect, markNotificationAsRead);

// Route to delete a notification
router.delete('/:notificationId', protect, deleteNotification);

module.exports = router;