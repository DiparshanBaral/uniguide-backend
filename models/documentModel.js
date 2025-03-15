const mongoose = require('mongoose');

// Document Schema Definition
const documentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // Reference to the Student model
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor', // Reference to the Mentor model
      required: true,
    },
    documentName: {
      type: String,
      required: true,
    },
    documentUrl: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return /^https?:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/(image|raw)\/upload\/v\d+\/documents\/[a-zA-Z0-9_-]+\.(pdf|docx|doc|jpg|jpeg|png)$/.test(v);
          },
          message: "Invalid URL format for documentUrl",
        },
      },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt` fields
);

// Use the 'Users' database for documents
const usersDb = mongoose.connection.useDb('Users');

// Create the Document model
const Document = usersDb.model('Document', documentSchema, 'Documents');

module.exports = { Document };