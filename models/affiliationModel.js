const mongoose = require("mongoose");

// Use the 'Users' database for mentors
const usersDb = mongoose.connection.useDb('Users');
// Use the 'Universities' database for university collections
const universitiesDb = mongoose.connection.useDb('Universities');

// Affiliation Schema Definition
const affiliationSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentors", // Refers to the Mentor collection in the 'Users' database
      required: true,
      index: true,
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Dynamically reference the appropriate university collection based on the university location
      refPath: 'universityLocation', // Dynamically determines the collection
      index: true,
    },
    documentUrl: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/[^\s]+$/.test(v);
        },
        message: "Invalid URL format for documentUrl",
      },
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
        return universitiesDb.model('USUniversity', new mongoose.Schema({}), 'US');
      case 'UK':
        return universitiesDb.model('UKUniversity', new mongoose.Schema({}), 'UK');
      case 'Canada':
        return universitiesDb.model('CanadaUniversity', new mongoose.Schema({}), 'Canada');
      case 'Australia':
        return universitiesDb.model('AustraliaUniversity', new mongoose.Schema({}), 'Australia');
      default:
        return null;
    }
  },
  localField: 'universityId',
  foreignField: '_id',
});

module.exports = usersDb.model("Affiliation", affiliationSchema, "Affiliations");
