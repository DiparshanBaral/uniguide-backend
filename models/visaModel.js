const mongoose = require('mongoose');

// Visa Experience Schema
const experienceSchema = new mongoose.Schema(
  {
    postid: { type: String, required: true }, 
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    author: {
      authorId: { type: String, required: true },
      name: { type: String, required: true },
      avatar: { type: String, required: true },
    },
    country: { type: String, required: true },
    flag: { type: String, required: true },
    date: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
  },
  { timestamps: true }
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