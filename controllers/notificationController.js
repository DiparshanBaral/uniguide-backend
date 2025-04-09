const { Notification } = require('../models/notificationModel');

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { userId, userRole, title, description } = req.body;

    // Validate required fields
    if (!userId || !userRole || !title || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create a new notification
    const notification = new Notification({
      userId,
      userRole,
      title,
      description,
    });

    // Save the notification to the database
    await notification.save();

    res.status(201).json({ message: 'Notification created successfully', notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: error.message || 'An error occurred while creating the notification' });
  }
};

// Get all notifications for a user
const getNotificationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch notifications for the user
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message || 'An error occurred while fetching notifications' });
  }
};

// Mark a notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Validate notificationId
    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    // Update the notification's isRead field
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message || 'An error occurred while marking the notification as read' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Validate notificationId
    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    // Delete the notification
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message || 'An error occurred while deleting the notification' });
  }
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  deleteNotification,
};