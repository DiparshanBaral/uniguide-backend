const mongoose = require('mongoose');

// Define the university schema
const universitySchema = new mongoose.Schema({
  country: { 
    type: String, 
    required: true, 
    enum: ['US', 'UK', 'Canada', 'Australia'], 
  },
  name: { type: String, required: true },
  location: { type: String, required: true },
  ranking: { type: Number, required: true },
  coursesOffered: [String],
  contact: {
    phone: { type: String },
    email: { type: String },
  },
  website: { type: String },
  description: { type: String },
  tuitionFee: {
    undergraduate: { type: Number, required: true },
    graduate: { type: Number, required: true },
  },
  acceptanceRate: { type: Number, required: true },
  graduationRate: { type: Number, required: true },
}, { timestamps: true });


// Explicitly specify the database and collection names for each country
const db = mongoose.connection.useDb('Universities'); // Use the 'Universities' database

const USUniversity = db.model('USUniversity', universitySchema, 'US'); // Collection for US universities
const UKUniversity = db.model('UKUniversity', universitySchema, 'UK'); // Collection for UK universities
const CanadaUniversity = db.model('CanadaUniversity', universitySchema, 'Canada'); // Collection for Canada universities
const AustraliaUniversity = db.model('AustraliaUniversity', universitySchema, 'Australia'); // Collection for Australia universities

module.exports = { USUniversity, UKUniversity, CanadaUniversity, AustraliaUniversity };
