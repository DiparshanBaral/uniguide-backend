const mongoose = require('mongoose');

// Notification Schema
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userRole', // Dynamic reference based on userRole
      required: true,
    },
    userRole: {
      type: String,
      enum: ['Student', 'Mentor', 'Admin'], // Role of the user receiving the notification
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100, // Limit the title length
    },
    description: {
      type: String,
      required: true,
      maxlength: 500, // Limit the description length
    },
    isRead: {
      type: Boolean,
      default: false, // Notifications are unread by default
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt` fields
);

// Use the 'Users' database for notifications
const usersDb = mongoose.connection.useDb('Users');

// Create the Notification model
const Notification = usersDb.model('Notification', notificationSchema, 'Notifications');

module.exports = { Notification };