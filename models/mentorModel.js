const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['mentor'], default: 'mentor' },
    profilePic: {
      type: String,
      validate: {
        validator: function (v) {
          return /^https?:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/(image|raw)\/upload\/v\d+\/ProfilePictures\/[a-zA-Z0-9_-]+\.(jpg|jpeg|webp|png)$/.test(v);
        },
        message: "Invalid URL format for profilePic",
      },
    },

    // Mentor-Specific Fields
    bio: { type: String, maxlength: 500, default: "" }, // Short introduction
    expertise: [{ type: String, default: [] }], // List of expertise areas
    university: { type: String, default: "NA" }, // Associated university
    degree: { type: String, default: "NA" }, // Degree obtained
    yearsOfExperience: { type: Number, default: 0 }, // Work experience
    ratings: [{ type: Number, default: [] }], // Array of ratings (1-5 scale)
    averageRating: { type: Number, default: 0 }, // Calculated rating
    documentUrl: { type: String, default: "" }, // Mentor verification document URL
    isApproved: { type: Boolean, default: false }, // Track if admin approved the mentor

    // Students connected to this mentor
    connectedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: [] }],
  },
  { timestamps: true }
);

const usersDb  = mongoose.connection.useDb('Users');
const Mentor = usersDb.model('Mentor', mentorSchema, 'Mentors');

module.exports = { Mentor };
