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
      enum: ['Student', 'Mentor'],
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
    link: {
      type: String, // Optional field to store route details
      validate: {
        validator: function (v) {
          return /^\/[a-zA-Z0-9/_-]*$/.test(v); // Ensure it's a valid route format
        },
        message: 'Invalid route format for link',
      },
      default: null, // Optional field
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