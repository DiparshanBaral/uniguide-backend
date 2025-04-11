const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student'], default: 'student' },
    profilePic: {
      type: String,
      validate: {
        validator: function (v) {
          return /^https?:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/(image|raw)\/upload\/v\d+\/ProfilePictures\/[a-zA-Z0-9_-]+\.(jpg|jpeg|webp|png)$/.test(v);
        },
        message: "Invalid URL format for profilePic",
      },
    },
    bio: { type: String, default: '' }, // Short biography
    major: { type: String, default: '' }, // Field of study
    targetedUniversities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'University' }], // Interested universities
    connectedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mentors' }], // List of mentor IDs
    discussionRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionRoom' }], // Connected discussion rooms
    visaContributions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VisaPost' }], // Visa-related posts
    profileCompleted: { type: Boolean, default: false }, // Track profile completion
  },
  { timestamps: true }
);

// Pre-save middleware to check profile completion
studentSchema.pre('save', function (next) {
  const requiredStringFields = ['firstname', 'lastname', 'email', 'profilePic', 'bio', 'major'];
  const isStringFieldsComplete = requiredStringFields.every((field) => {
    // Ensure the field exists and is a string before trimming
    return this[field] && typeof this[field] === 'string' && this[field].trim() !== '';
  });

  // Check non-string fields separately (if any additional checks are needed)
  this.profileCompleted = isStringFieldsComplete;
  next();
});

const db = mongoose.connection.useDb('Users');

const Student = db.model('Student', studentSchema, 'Students');

module.exports = { Student };
