const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'mentor'],
      required: true,
      default: 'student',
    },
  },
  { timestamps: true },
);

// Explicitly specify the database and collection names
const db = mongoose.connection.useDb("Users");

const Student = db.model('Student', userSchema, 'Students');
const Mentor = db.model('Mentor', userSchema, 'Mentors');

module.exports = { Student, Mentor };