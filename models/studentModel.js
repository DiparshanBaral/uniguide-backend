const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student'], default: 'student' },
    profilePic: { type: String },
    connectedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' }], // List of mentor IDs
    discussionRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionRoom' }], // Connected discussion rooms
    visaContributions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VisaPost' }], // Visa-related posts
    profileCompleted: { type: Boolean, default: false }, // Track profile completion
  },
  { timestamps: true }
);

const db = mongoose.connection.useDb('Users');

const Student = db.model('Student', studentSchema, 'Students');

module.exports = { Student };
