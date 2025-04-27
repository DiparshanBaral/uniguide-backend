const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String},
    role: { type: String, enum: ['student'], default: 'student' },
    profilePic: {
      type: String,
      default: '', // Default to an empty string or set dynamically during Google login
    },
    bio: { type: String, default: '' },
    major: { type: String, default: '' },
    targetedUniversities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'University' }], // Interested universities
    connectedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mentors' }], // List of mentor IDs
    discussionRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionRoom' }], // Connected discussion rooms
    visaContributions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VisaPost' }], // Visa-related posts
    profileCompleted: { type: Boolean, default: false }, // Track profile completion
    googleId: { type: String },
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
