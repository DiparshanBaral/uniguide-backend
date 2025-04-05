const mongoose = require('mongoose');

// Visa Experience Schema
const experienceSchema = new mongoose.Schema(
  {
    postid: { type: String, required: true }, // Unique ID for each experience post
    title: { type: String, required: true }, // Title of the experience
    excerpt: { type: String, required: true }, // Short description of the experience
    author: {
      authorId: { type: String, required: true }, // Author's unique ID
      name: { type: String, required: true }, // Author's name
      avatar: { type: String, required: true }, // Author's avatar URL
    },
    country: { type: String, required: true }, // Country related to the experience
    flag: { type: String, required: true }, // Emoji flag of the country
    date: { type: Date, default: Date.now }, // Date of the post
    likes: { type: Number, default: 0 }, // Number of likes
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

// Visa Schema
const visaSchema = new mongoose.Schema(
  {
    country: { type: String, required: true }, // Country name (e.g., United States)
    flag: { type: String, required: true }, // Emoji flag of the country
    experiences: [experienceSchema], // Array of visa experiences
  },
  { timestamps: true }
);

// Use the Users database
const db = mongoose.connection.useDb('Users');

// Create the Visa model
const Visa = db.model('Visa', visaSchema, 'Visa');

module.exports = { Visa };