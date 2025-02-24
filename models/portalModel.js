const mongoose = require('mongoose');

// Use the 'Users' database for portals
const usersDb = mongoose.connection.useDb('Users');

// Portal Schema Definition
const portalSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // Refers to the Student model in the 'Users' database
      required: true,
      index: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor', // Refers to the Mentor model in the 'Users' database
      required: true,
      index: true,
    },
    country: {
      type: String,
      enum: ['US', 'UK', 'Canada', 'Australia'], // Target country for the application process
      required: true,
    },
    applicationStatus: {
      type: String,
      enum: ['In Progress', 'Completed'],
      default: 'In Progress',
    },
    tasks: [
      {
        taskId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task', // Reference to the Task model
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        dueDate: { type: Date },
        status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
      },
    ],
    documents: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'uploadedByRole', required: true },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'reviewedByRole' },
        feedback: { type: String, default: '' },
        status: { type: String, enum: ['Uploaded', 'Reviewed'], default: 'Uploaded' },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = usersDb.model('Portal', portalSchema, 'Portals');