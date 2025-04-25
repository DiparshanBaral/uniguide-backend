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
      default: '', // Default to an empty string or set dynamically during Google login
    },

    // Mentor-Specific Fields
    bio: { type: String, maxlength: 500, default: '' }, // Short introduction
    expertise: [{ type: String, default: [] }], // List of expertise areas
    university: { type: String, default: "NA" }, // Associated university
    degree: { type: String, default: "NA" }, // Degree obtained
    yearsOfExperience: { type: Number, default: 0 }, // Work experience
    isApproved: { type: Boolean, default: false }, // Track if admin approved the mentor

    // Adding consultation fee fields instead of paymentInformation object
    consultationFee: { type: Number, default: 0 }, // Amount required to connect with the mentor
    currency: { type: String, default: 'USD' }, // Currency for the consultation fee
    
    // Students connected to this mentor
    connectedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: [] }],

    // New Fields
    profileCompleted: { type: Boolean, default: false }, // Track profile completion
    languages: [{ type: String, default: [] }], // List of languages the mentor knows

    // Add this to the schema:
    googleId: { type: String },
  },
  { timestamps: true }
);

mentorSchema.pre('save', function (next) {
  const requiredStringFields = ['firstname', 'lastname', 'email', 'profilePic', 'bio', 'university', 'degree'];
  const isStringFieldsComplete = requiredStringFields.every((field) => {
    // Ensure the field exists and is a string before trimming
    return this[field] && typeof this[field] === 'string' && this[field].trim() !== '';
  });

  // Check non-string fields separately
  const isExpertiseComplete = Array.isArray(this.expertise) && this.expertise.length > 0;
  const isExperienceComplete = typeof this.yearsOfExperience === 'number' && this.yearsOfExperience > 0;

  // Set profileCompleted based on all checks
  this.profileCompleted = isStringFieldsComplete && isExpertiseComplete && isExperienceComplete;
  next();
});

const usersDb = mongoose.connection.useDb('Users');
const Mentor = usersDb.model('Mentor', mentorSchema, 'Mentors');

module.exports = { Mentor };
