const mongoose = require("mongoose");
const Mentor = require('../models/mentorModel').Mentor;

// Use the 'Users' database for mentors
const usersDb = mongoose.connection.useDb('Users');
// Use the 'Universities' database for university collections
const universitiesDb = mongoose.connection.useDb('Universities');

// Affiliation Schema Definition
const affiliationSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor', // Refers to the Mentor model in the 'Users' database
      required: true,
      index: true,
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'universityLocation', // Dynamically determines the collection
      index: true,
    },
    documentUrl: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/(image|raw)\/upload\/v\d+\/affiliation\/[a-zA-Z0-9_-]+\.(pdf|jpg|jpeg|png)$/.test(v);
        },
        message: "Invalid URL format for documentUrl",
      },
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    universityLocation: {
      type: String,
      enum: ["US", "UK", "Canada", "Australia"], // The location of the university (to determine the collection)
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual field to dynamically refer to the correct university collection
affiliationSchema.virtual('university', {
  ref: function() {
    switch (this.universityLocation) {
      case 'US':
        return 'USUniversity';
      case 'UK':
        return 'UKUniversity';
      case 'Canada':
        return 'CanadaUniversity';
      case 'Australia':
        return 'AustraliaUniversity';
      default:
        return null;
    }
  },
  localField: 'universityId',
  foreignField: '_id',
});

module.exports = usersDb.model("Affiliation", affiliationSchema, "Affiliations");