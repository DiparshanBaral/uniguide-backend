const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['mentor'], default: 'mentor' },
    profilePic: { type: String },

    // Mentor-Specific Fields
    bio: { type: String, maxlength: 500 }, // Short introduction
    expertise: [{ type: String }], // List of expertise areas
    university: { type: String, required: false }, // Associated university
    degree: { type: String, required: false }, // Degree obtained
    yearsOfExperience: { type: Number, required: false }, // Work experience
    ratings: [{ type: Number }], // Array of ratings (1-5 scale)
    averageRating: { type: Number, default: 0 }, // Calculated rating
    documentUrl: { type: String }, // Mentor verification document URL
    isApproved: { type: Boolean, default: false }, // Track if admin approved the mentor

    // Students connected to this mentor
    connectedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

const db = mongoose.connection.useDb('Users');
const Mentor = db.model('Mentor', mentorSchema, 'Mentors');

module.exports = { Mentor };
