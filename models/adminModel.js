const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    universityCount: { type: Number, default: 0 }, // Total number of universities
    mentorCount: { type: Number, default: 0 }, // Total number of mentors
    studentCount: { type: Number, default: 0 }, // Total number of students
    discussionRoomCount: { type: Number, default: 0 }, // Total number of discussion rooms
  },
  { timestamps: true }
);

const db = mongoose.connection.useDb('Users');
const Admin = db.model('Admin', adminSchema, 'Admin');

module.exports = { Admin };
