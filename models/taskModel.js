const mongoose = require('mongoose');

// Use the 'Users' database for tasks
const usersDb = mongoose.connection.useDb('Users');

// Task Schema Definition
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date },
    country: {
      type: String,
      enum: ['US', 'UK', 'Canada', 'Australia'], // Country-specific tasks
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = usersDb.model('Task', taskSchema, 'Tasks');