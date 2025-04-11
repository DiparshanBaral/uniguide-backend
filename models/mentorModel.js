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
    isApproved: { type: Boolean, default: false }, // Track if admin approved the mentor

    // Students connected to this mentor
    connectedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: [] }],

    // New Fields
    profileCompleted: { type: Boolean, default: false }, // Track profile completion
    paymentInformation: {
      amount: { type: Number, required: true, default: 0 }, // Amount required to connect with the mentor
      currency: { type: String, default: 'USD' }, // Currency for the payment
    },
    languages: [{ type: String, default: [] }], // List of languages the mentor knows
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
